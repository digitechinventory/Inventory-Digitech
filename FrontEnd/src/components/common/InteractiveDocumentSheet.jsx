import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Share2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  Check,
  FileText,
  Image as ImageIcon,
  Edit3
} from 'lucide-react';
import api from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * InteractiveDocumentSheet
 * 
 * Renders an official document paper sheet supporting both Portrait and Landscape.
 * Eliminates the old locked 3-column signature boxes in favor of dynamic
 * drag-and-drop signature stamping anywhere on the document canvas.
 * 
 * Supports:
 * - Built-in Templates: MOS (001), MDT (005), MRP (006)
 * - Custom Uploaded Documents: multi-page PDF renders and images
 * - Interactive Draggable Signature Box with "Oke" (Lock) and "Approve" (Stamp) flow
 */
export default function InteractiveDocumentSheet({
  documentData,
  currentUser,
  userSignature,
  onOpenSignatureModal,
  onDocumentUpdated,
  onBackToList,
  onEditDocument
}) {
  const { addToast } = useToast();
  const doc = documentData || {};
  const isCustom = doc.template_type === 'CUSTOM' || (!['MOS', 'MDT', 'MRP'].includes(doc.template_type) && doc.pages?.length > 0);
  const tplType = doc.template_type || 'MOS';

  // Orientation: 'landscape' or 'portrait'
  const [orientation, setOrientation] = useState(doc.orientation || 'landscape');
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1); // 0.8 to 1.3

  // ── Drag & Drop Signature State ──
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [sigPosition, setSigPosition] = useState({ xPercent: 45, yPercent: 80 }); // % relative to paper
  const [sigWidth, setSigWidth] = useState(160); // px width
  const [isPositionLocked, setIsPositionLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [stamping, setStamping] = useState(false);
  const [stampSuccess, setStampSuccess] = useState(false);

  // Stamped signatures list on document
  const [stampedSignatures, setStampedSignatures] = useState(doc.signatures_placed || []);

  const paperRef = useRef(null);

  // ── Role & Slot Mapping Helper ──
  const normalizedRole = (currentUser?.role || '').toLowerCase();

  const getUserAllowedSlot = () => {
    if (normalizedRole === 'user' || normalizedRole.includes('teknisi') || normalizedRole.includes('staff')) return 'maker';
    if (normalizedRole === 'admin' || normalizedRole.includes('supervisor')) return 'checker';
    if (normalizedRole === 'superadmin' || normalizedRole.includes('management') || normalizedRole.includes('head')) return 'approver';
    return 'all';
  };

  const getSlotLabel = (slot) => {
    switch (slot) {
      case 'maker': return 'Dibuat Oleh';
      case 'checker': return 'Diperiksa Oleh';
      case 'approver': return 'Diketahui Oleh';
      default: return 'Kolom Otorisasi';
    }
  };

  const getSlotFromX = (x) => {
    if (x <= 36) return 'maker';
    if (x <= 66) return 'checker';
    return 'approver';
  };

  // 1. Validasi: Apakah dokumen sudah ditandatangani oleh user yang login
  const isAlreadySignedByCurrentUser = stampedSignatures.some(
    (sig) =>
      (sig.signer_id && currentUser?.id && sig.signer_id === currentUser.id) ||
      (sig.signer_name && currentUser?.full_name && sig.signer_name.toLowerCase() === currentUser.full_name.toLowerCase())
  );

  // 2. Validasi: Kolom mana yang sudah terisi tanda tangan
  const isSlotSigned = (slotType) => {
    return stampedSignatures.some((sig) => {
      if (Number(sig.page_index ?? 0) !== activePageIndex) return false;
      return getSlotFromX(Number(sig.x_percent)) === slotType;
    });
  };

  const userAllowedSlot = getUserAllowedSlot();
  const isUserSlotOccupied = !isCustom && userAllowedSlot !== 'all' && isSlotSigned(userAllowedSlot);

  // 3. Validasi: Posisi drag saat ini vs peran user
  const currentSlot = getSlotFromX(sigPosition.xPercent);
  const isPositionValidForRole = isCustom || (userAllowedSlot === 'all' || currentSlot === userAllowedSlot);

  // AI Smart Auto-Snap ke kolom hak akses user
  const snapToMySlot = () => {
    let targetX = 45;
    if (userAllowedSlot === 'maker') targetX = 12;
    else if (userAllowedSlot === 'checker') targetX = 45;
    else if (userAllowedSlot === 'approver') targetX = 78;
    setSigPosition({ xPercent: targetX, yPercent: 80 });
  };

  // Buka mode penempatan tanda tangan dengan auto-snap pintar
  const handleStartPlacing = () => {
    if (isAlreadySignedByCurrentUser) {
      addToast('Anda sudah menandatangani dokumen ini.', 'warning');
      return;
    }
    if (isUserSlotOccupied) {
      addToast(`Kolom "${getSlotLabel(userAllowedSlot)}" untuk hak akses Anda sudah ditandatangani.`, 'warning');
      return;
    }

    let initialX = 45;
    if (!isCustom) {
      if (userAllowedSlot === 'maker') initialX = 12;
      else if (userAllowedSlot === 'checker') initialX = 45;
      else if (userAllowedSlot === 'approver') initialX = 78;
    }
    setSigPosition({ xPercent: initialX, yPercent: 80 });
    setIsPlacingSignature(true);
    setIsPositionLocked(false);
  };

  useEffect(() => {
    if (doc.signatures_placed) {
      setStampedSignatures(doc.signatures_placed);
    }
    if (doc.orientation) {
      setOrientation(doc.orientation);
    }
  }, [doc]);

  // Handle Dragging signature box across paper canvas
  const handlePointerDown = (e) => {
    if (isPositionLocked) return;
    e.preventDefault();
    setIsDragging(true);

    const paperRect = paperRef.current?.getBoundingClientRect();
    if (!paperRect) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const currentX = (sigPosition.xPercent / 100) * paperRect.width;
    const currentY = (sigPosition.yPercent / 100) * paperRect.height;

    setDragOffset({
      x: clientX - (paperRect.left + currentX),
      y: clientY - (paperRect.top + currentY)
    });
  };

  const handlePointerMove = (e) => {
    if (!isDragging || isPositionLocked) return;
    const paperRect = paperRef.current?.getBoundingClientRect();
    if (!paperRect) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let newX = clientX - paperRect.left - dragOffset.x;
    let newY = clientY - paperRect.top - dragOffset.y;

    // Constrain inside paper boundary
    newX = Math.max(10, Math.min(newX, paperRect.width - sigWidth - 10));
    newY = Math.max(10, Math.min(newY, paperRect.height - 90));

    const xPercent = (newX / paperRect.width) * 100;
    const yPercent = (newY / paperRect.height) * 100;

    setSigPosition({ xPercent, yPercent });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, dragOffset]);

  // Lock position ("Kunci Posisi")
  const handleLockPosition = () => {
    if (!isPositionValidForRole) {
      addToast(`Validasi Tata Letak Gagal: Sebagai ${currentUser?.role || 'User'}, Anda hanya berhak menandatangani di kolom "${getSlotLabel(userAllowedSlot)}".`, 'warning');
      return;
    }
    setIsPositionLocked(true);
  };

  // Unlock position ("Ubah Posisi")
  const handleUnlockPosition = () => {
    setIsPositionLocked(false);
  };

  // Perform Final Approval & Stamp
  const handleApproveAndStamp = async () => {
    if (!userSignature) {
      onOpenSignatureModal?.();
      return;
    }
    if (isAlreadySignedByCurrentUser) {
      addToast('Anda sudah menandatangani dokumen ini.', 'warning');
      return;
    }
    if (!isPositionValidForRole) {
      addToast(`Validasi Tata Letak Gagal: Sebagai ${currentUser?.role || 'User'}, Anda hanya berhak menandatangani di kolom "${getSlotLabel(userAllowedSlot)}".`, 'warning');
      return;
    }
    if (!isCustom && isSlotSigned(currentSlot)) {
      addToast(`Kolom tanda tangan "${getSlotLabel(currentSlot)}" sudah terisi pada dokumen ini.`, 'warning');
      return;
    }
    if (!isPositionLocked) {
      setIsPositionLocked(true);
    }

    setStamping(true);
    try {
      const paperRect = paperRef.current?.getBoundingClientRect();
      const widthPercent = paperRect ? (sigWidth / paperRect.width) * 100 : 18.0;
      const heightPercent = 10.0;

      const payload = {
        page_index: activePageIndex,
        x_percent: Math.round(sigPosition.xPercent * 100) / 100,
        y_percent: Math.round(sigPosition.yPercent * 100) / 100,
        width_percent: Math.round(widthPercent * 100) / 100,
        height_percent: heightPercent,
        signature_image: userSignature,
        signer_name: currentUser?.full_name || 'Approver Lapangan',
        signer_role: currentUser?.role || 'Staff Lapangan'
      };

      const res = await api.post(`/mos/${doc.id}/stamp`, payload);
      const updatedDoc = res.data?.data;

      if (updatedDoc?.signatures_placed) {
        setStampedSignatures(updatedDoc.signatures_placed);
      } else {
        // Fallback local addition
        setStampedSignatures((prev) => [
          ...prev,
          {
            id: `stamp-${Date.now()}`,
            signer_id: currentUser?.id,
            page_index: activePageIndex,
            x_percent: sigPosition.xPercent,
            y_percent: sigPosition.yPercent,
            width_percent: widthPercent,
            height_percent: heightPercent,
            signature_image: userSignature,
            signer_name: currentUser?.full_name || 'Approver Lapangan',
            signer_role: currentUser?.role || 'Staff Lapangan',
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            hash: 'SHA256:MANUAL-STAMP-VALIDATED'
          }
        ]);
      }

      setIsPlacingSignature(false);
      setIsPositionLocked(false);
      setStampSuccess(true);
      addToast('Tanda tangan digital berhasil dibubuhkan pada dokumen.', 'success');
      onDocumentUpdated?.(updatedDoc || doc);
      setTimeout(() => setStampSuccess(false), 4500);
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal menandatangani dokumen.', 'error');
    } finally {
      setStamping(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine current page content for custom upload
  const currentPageImage = doc.pages?.[activePageIndex]?.image_data;
  const hasPhotoAttachment = Boolean(doc.photo_attachment_url || (Array.isArray(doc.photo_attachments) && doc.photo_attachments.length > 0));
  const totalPages = isCustom ? (doc.pages?.length || 1) : (hasPhotoAttachment ? 2 : 1);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 font-sans select-none">
      
      {/* ── Action Bar / Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-4 z-40">
        
        {/* Left: Back & Document Meta */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Kembali ke Waiting List"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {doc.doc_number || 'Dokumen Approval'}
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                doc.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {doc.status === 'completed' ? 'Selesai Disetujui' : 'Menunggu Approval'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>{doc.title}</span>
              <span>&bull;</span>
              <span>{doc.site_location || 'Office VGT'}</span>
            </div>
          </div>
        </div>

        {/* Right: Signature Actions & Tools — Pushed to right edge */}
        <div className="flex items-center justify-end flex-wrap gap-2 ml-auto shrink-0">
          
          {/* Edit Document Info Button */}
          {onEditDocument && (
            <button
              type="button"
              onClick={() => onEditDocument(doc)}
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sesuaikan Nomor Dokumen, Rute Pengiriman, atau Alur Approval"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Sesuaikan Dokumen</span>
            </button>
          )}

          {/* Orientation Toggle */}
          <button
            type="button"
            onClick={() => setOrientation(prev => prev === 'landscape' ? 'portrait' : 'landscape')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Ubah format orientasi kertas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="capitalize">{orientation}</span>
          </button>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center border border-slate-200 rounded-xl overflow-hidden text-xs">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.1))}
              className="p-1.5 hover:bg-slate-100 text-slate-600"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-600">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.25, prev + 0.1))}
              className="p-1.5 hover:bg-slate-100 text-slate-600"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Cetak Dokumen"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* User Signature Status & Stamping Trigger */}
          {isAlreadySignedByCurrentUser ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Dokumen Telah Anda Tanda Tangani</span>
            </div>
          ) : isUserSlotOccupied ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
              <span>Kolom Anda ({getSlotLabel(userAllowedSlot)}) Sudah Terisi</span>
            </div>
          ) : !userSignature ? (
            <button
              onClick={onOpenSignatureModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upload Tanda Tangan</span>
            </button>
          ) : !isPlacingSignature ? (
            <button
              onClick={handleStartPlacing}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 transition-all cursor-pointer"
            >
              <Move className="w-4 h-4" />
              <span>Tanda Tangani Dokumen</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setIsPlacingSignature(false)}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs font-medium"
              >
                Batal
              </button>

              {!isPositionLocked ? (
                <button
                  type="button"
                  disabled={!isPositionValidForRole}
                  onClick={handleLockPosition}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                    isPositionValidForRole
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                  title={!isPositionValidForRole ? `Pindahkan ke kolom ${getSlotLabel(userAllowedSlot)}` : 'Kunci Posisi'}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Kunci Posisi</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleUnlockPosition}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Ubah Posisi</span>
                  </button>

                  <button
                    type="button"
                    disabled={stamping || !isPositionValidForRole}
                    onClick={handleApproveAndStamp}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{stamping ? 'Membubuhkan...' : 'Approve & Bubuhkan TTD'}</span>
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Success Notification Alert */}
      {stampSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">
              Tanda tangan digital transparan berhasil dibubuhkan di posisi dokumen! Validasi SHA-256 tersimpan.
            </span>
          </div>
        </div>
      )}

      {/* Page Navigation for Multi-page Documents */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded-2xl text-xs font-semibold text-slate-600">
          <button
            disabled={activePageIndex === 0}
            onClick={() => setActivePageIndex(prev => Math.max(0, prev - 1))}
            className="flex items-center gap-1 px-3 py-1 bg-white disabled:opacity-40 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Halaman Sebelumnya</span>
          </button>

          <span className="font-mono">
            Halaman {activePageIndex + 1} dari {totalPages} {activePageIndex === 1 && !isCustom ? '(Lampiran Foto Dokumentasi)' : ''}
          </span>

          <button
            disabled={activePageIndex >= totalPages - 1}
            onClick={() => setActivePageIndex(prev => Math.min(totalPages - 1, prev + 1))}
            className="flex items-center gap-1 px-3 py-1 bg-white disabled:opacity-40 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <span>Halaman Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── THE INTERACTIVE PAPER CANVAS ── */}
      <div className="w-full flex justify-center overflow-x-auto pb-8">
        <div
          ref={paperRef}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease'
          }}
          className={`relative bg-white text-slate-900 shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:transform-none ${
            orientation === 'landscape'
              ? 'w-[1100px] min-h-[770px]'
              : 'w-[794px] min-h-[1123px]'
          }`}
        >

          {/* ════════ CASE A: CUSTOM UPLOADED DOCUMENT (PDF / IMAGE) ════════ */}
          {isCustom && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              {currentPageImage ? (
                <img
                  src={currentPageImage}
                  alt={`Halaman Dokumen ${activePageIndex + 1}`}
                  className="w-full h-auto object-contain select-none pointer-events-none"
                />
              ) : (
                <div className="py-24 text-center text-slate-400 space-y-2">
                  <FileText className="w-12 h-12 mx-auto" />
                  <p className="text-sm font-semibold">Halaman dokumen belum memiliki gambar render.</p>
                </div>
              )}
            </div>
          )}

          {/* ════════ CASE B: BUILT-IN TEMPLATES (MOS, MDT, MRP) ════════ */}
          {!isCustom && activePageIndex === 0 && (
            <div className="p-8 sm:p-10 space-y-4">
              
              {/* Top Banner Header: Deep Navy Blue (#16325C) with White Bold Title */}
              <div className="bg-[#16325C] text-white py-3.5 px-6 rounded-md text-center shadow-sm">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
                  {tplType === 'MDT'
                    ? 'MATERIAL DISMANTLING'
                    : tplType === 'MRP'
                    ? 'MATERIAL REPLACEMENT'
                    : 'MATERIAL ON SITE'}
                </h1>
              </div>

              {/* Sub-header Metadata Grid (Matching Official PDF Table with Route Details) */}
              <div className="border border-[#16325C]/30 text-xs">
                <div className="grid grid-cols-2">
                  {/* Left Column: Asal -> Tujuan */}
                  <div className="divide-y divide-[#16325C]/20 border-r border-[#16325C]/30">
                    <div className="grid grid-cols-3 p-2 bg-[#F1F5F9]/60">
                      <span className="font-bold text-[#16325C]">Lokasi Asal (Dari)</span>
                      <span className="col-span-2 font-medium text-slate-800">{doc.origin_location || 'Office VGT'}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2">
                      <span className="font-bold text-[#16325C]">Lokasi Tujuan (Ke)</span>
                      <span className="col-span-2 font-semibold text-slate-900">{doc.destination_location || doc.site_location || 'BIB Pit Sebamban KM-14'}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 bg-[#F1F5F9]/60">
                      <span className="font-bold text-[#16325C]">Pengirim / Pembuat</span>
                      <span className="col-span-2 font-medium text-slate-800">{doc.sender_name || 'Rayhans Najib Al-Faruq'} ({doc.sender_role || 'Teknisi VGT'})</span>
                    </div>
                    <div className="grid grid-cols-3 p-2">
                      <span className="font-bold text-[#16325C]">Penerima / Tujuan</span>
                      <span className="col-span-2 font-semibold text-slate-800">{doc.destination_receiver || doc.pic_receiver_name || 'Team Mekanik Pit'}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 bg-[#F1F5F9]/60">
                      <span className="font-bold text-[#16325C]">No. Dokumen</span>
                      <span className="col-span-2 font-mono font-bold text-red-700">{doc.doc_number}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2">
                      <span className="font-bold text-[#16325C]">No. SPK / WO</span>
                      <span className="col-span-2 font-mono font-medium text-slate-800">{doc.wo_spk_number || '-'}</span>
                    </div>
                  </div>

                  {/* Right Column: Tanggal, PO, Kondisi, Peruntukan */}
                  <div className="divide-y divide-[#16325C]/20">
                    <div className="grid grid-cols-3 p-2 bg-[#F1F5F9]/60">
                      <span className="font-bold text-[#16325C]">
                        {tplType === 'MDT' ? 'Tanggal Dismantling' : tplType === 'MRP' ? 'Tanggal Replacement' : 'Tanggal Penerimaan'}
                      </span>
                      <span className="col-span-2 font-medium text-slate-800">{doc.received_date || '21/10/2026'}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2">
                      <span className="font-bold text-[#16325C]">No. PO / DO</span>
                      <span className="col-span-2 font-medium text-slate-800">{doc.po_do_number || '-'} {doc.do_sj_number && doc.do_sj_number !== '-' ? ` / SJ: ${doc.do_sj_number}` : ''}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 bg-[#F1F5F9]/60">
                      <span className="font-bold text-[#16325C]">
                        {tplType === 'MDT' ? 'Kondisi Dismantling' : tplType === 'MRP' ? 'Kondisi Replacement' : 'Kondisi Kemasan'}
                      </span>
                      <span className="col-span-2 font-medium text-slate-800">{doc.package_condition || 'Baik'}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2">
                      <span className="font-bold text-[#16325C]">Target Dibutuhkan</span>
                      <span className="col-span-2 font-medium text-slate-800">{doc.required_date || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 bg-[#F1F5F9]/60">
                      <span className="font-bold text-[#16325C]">Peruntukan / Unit</span>
                      <span className="col-span-2 font-medium text-slate-800">{doc.unit_targeted && doc.unit_targeted !== '-' ? doc.unit_targeted : (doc.purpose || 'Verifikasi & Otorisasi Operasional')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Section Title Bar */}
              <div className="bg-[#2563EB] text-white py-2 px-4 text-center font-bold text-xs uppercase tracking-wide">
                {tplType === 'MDT'
                  ? 'DETAIL BARANG DISMANTLING'
                  : tplType === 'MRP'
                  ? 'DETAIL REPLACEMENT'
                  : 'DETAIL BARANG DITERIMA'}
              </div>

              {/* 9-Column Items Table */}
              <div className="border border-slate-300 overflow-hidden text-[11px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#1E3A5F] text-white text-center font-bold divide-x divide-slate-400/40">
                      <th className="py-2.5 px-2 w-10">No</th>
                      <th className="py-2.5 px-3">Nama Barang / Material</th>
                      <th className="py-2.5 px-3">Spesifikasi / Part No.</th>
                      <th className="py-2.5 px-3 w-32">Serial Number</th>
                      <th className="py-2.5 px-2 w-20">
                        {tplType === 'MOS' ? 'Qty Terima' : 'Qty Dismantling'}
                      </th>
                      <th className="py-2.5 px-2 w-20">
                        {tplType === 'MOS' ? 'Qty DO' : 'Qty Installation'}
                      </th>
                      <th className="py-2.5 px-2 w-24">Kondisi Barang</th>
                      <th className="py-2.5 px-3 w-32">Garansi</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {(doc.items && doc.items.length > 0 ? doc.items : []).map((it, idx) => (
                      <tr key={it.id || idx} className="divide-x divide-slate-300 hover:bg-slate-50 text-slate-800">
                        <td className="py-1.5 px-2 text-center font-mono">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold">{it.name || it.item_name}</td>
                        <td className="py-1.5 px-3">{it.spec || it.part_number}</td>
                        <td className="py-1.5 px-3 font-mono text-center">{it.sn || it.serial_number}</td>
                        <td className="py-1.5 px-2 text-center font-semibold">{it.qty_received ?? it.qty ?? '-'}</td>
                        <td className="py-1.5 px-2 text-center">{it.qty_do || '-'}</td>
                        <td className="py-1.5 px-2 text-center">{it.condition || it.item_condition || 'Baru'}</td>
                        <td className="py-1.5 px-3 text-center">{it.warranty || '-'}</td>
                        <td className="py-1.5 px-3 text-slate-600">{it.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Catatan Teknis / Alasan Pekerjaan (Jika Ada) */}
              {doc.notes_justification && (
                <div className="border border-slate-300 rounded-md p-2.5 bg-slate-50/70 text-xs text-slate-800">
                  <div className="font-bold text-[#16325C] mb-0.5 text-[11px] uppercase tracking-wide">
                    Catatan Teknis &amp; Justifikasi Pekerjaan:
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed italic">
                    "{doc.notes_justification}"
                  </p>
                </div>
              )}

              {/* Official Signature Area Grid Frame (Bottom of Document) */}
              <div className="pt-2">
                <div className="bg-[#1E3A5F] text-white py-1.5 px-4 text-center font-bold text-xs uppercase tracking-wider">
                  TANDA TANGAN &amp; OTORISASI
                </div>

                <div className="border-x border-b border-slate-300 grid grid-cols-3 divide-x divide-slate-300 text-center text-xs">
                  {/* Slot 1: Dibuat Oleh */}
                  <div className={`flex flex-col justify-between h-36 transition-all ${
                    isPlacingSignature && userAllowedSlot === 'maker'
                      ? 'bg-emerald-50/50 ring-2 ring-emerald-500/50'
                      : ''
                  }`}>
                    <div className="bg-slate-100 py-1 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-center gap-1">
                      <span>Dibuat Oleh</span>
                      {isSlotSigned('maker') && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />}
                    </div>
                    <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400 italic">
                      {isSlotSigned('maker') ? (
                        <span className="text-emerald-700 font-semibold text-[10px]">✓ Terverifikasi</span>
                      ) : isPlacingSignature && userAllowedSlot === 'maker' ? (
                        <span className="text-emerald-600 font-bold text-[10px] animate-pulse">Area TTD Anda</span>
                      ) : null}
                    </div>
                    <div className="border-t border-slate-200 py-1.5 px-2">
                      <div className="font-bold text-slate-900">( {doc.approval_maker_name || doc.sender_name || 'Rayhans Najib A.'} )</div>
                      <div className="text-[10px] text-slate-500 italic">
                        {doc.approval_maker_role || doc.sender_role || 'Teknisi VGT'} {doc.approval_maker_dept ? `— ${doc.approval_maker_dept}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Slot 2: Diperiksa Oleh */}
                  <div className={`flex flex-col justify-between h-36 transition-all ${
                    isPlacingSignature && userAllowedSlot === 'checker'
                      ? 'bg-emerald-50/50 ring-2 ring-emerald-500/50'
                      : ''
                  }`}>
                    <div className="bg-slate-100 py-1 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-center gap-1">
                      <span>Diperiksa Oleh</span>
                      {isSlotSigned('checker') && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />}
                    </div>
                    <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400 italic">
                      {isSlotSigned('checker') ? (
                        <span className="text-emerald-700 font-semibold text-[10px]">✓ Terverifikasi</span>
                      ) : isPlacingSignature && userAllowedSlot === 'checker' ? (
                        <span className="text-emerald-600 font-bold text-[10px] animate-pulse">Area TTD Anda</span>
                      ) : null}
                    </div>
                    <div className="border-t border-slate-200 py-1.5 px-2">
                      <div className="font-bold text-slate-900">( {doc.approval_checker_name || 'Zainal Fahriandy'} )</div>
                      <div className="text-[10px] text-slate-500 italic">
                        {doc.approval_checker_role || 'Supervisor VGT'} {doc.approval_checker_dept ? `— ${doc.approval_checker_dept}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Slot 3: Diketahui Oleh */}
                  <div className={`flex flex-col justify-between h-36 transition-all ${
                    isPlacingSignature && userAllowedSlot === 'approver'
                      ? 'bg-emerald-50/50 ring-2 ring-emerald-500/50'
                      : ''
                  }`}>
                    <div className="bg-slate-100 py-1 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-center gap-1">
                      <span>Diketahui Oleh</span>
                      {isSlotSigned('approver') && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />}
                    </div>
                    <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400 italic">
                      {isSlotSigned('approver') ? (
                        <span className="text-emerald-700 font-semibold text-[10px]">✓ Terverifikasi</span>
                      ) : isPlacingSignature && userAllowedSlot === 'approver' ? (
                        <span className="text-emerald-600 font-bold text-[10px] animate-pulse">Area TTD Anda</span>
                      ) : null}
                    </div>
                    <div className="border-t border-slate-200 py-1.5 px-2">
                      <div className="font-bold text-slate-900">( {doc.approval_approver_name || 'Harris'} )</div>
                      <div className="text-[10px] text-slate-500 italic">
                        {doc.approval_approver_role || 'Digitech'} {doc.approval_approver_dept ? `— ${doc.approval_approver_dept}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Warning Note */}
              <div className="p-2 border border-red-200 bg-red-50/40 text-red-700 text-[11px] font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>⚠ Laporkan ke Supervisor VGT dan Digitech jika terdapat item yang tidak sesuai atau kondisi barang tidak baik.</span>
              </div>

            </div>
          )}

          {/* ════════ CASE C: PAGE 2 (REAL DYNAMIC PHOTO ATTACHMENT IF AVAILABLE) ════════ */}
          {!isCustom && activePageIndex === 1 && hasPhotoAttachment && (
            <div className="p-8 sm:p-10 space-y-6">
              <div className="bg-[#16325C] text-white py-3 px-6 rounded-md text-center shadow-sm">
                <h2 className="text-lg font-bold uppercase tracking-wider">
                  DOKUMENTASI FOTO ATTACHMENT ({doc.doc_number})
                </h2>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="max-h-[560px] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-300">
                  <img
                    src={doc.photo_attachment_url || (doc.photo_attachments && doc.photo_attachments[0])}
                    alt="Foto Dokumentasi Fisik"
                    className="w-full h-auto max-h-[540px] object-contain"
                  />
                </div>
                <div className="text-center font-bold text-xs text-slate-800">
                  Foto Dokumentasi Fisik Lapangan &amp; Verifikasi Material
                </div>
              </div>
            </div>
          )}

          {/* ════════ STAMPED SIGNATURES OVERLAY ════════ */}
          {stampedSignatures
            .filter(sig => Number(sig.page_index ?? 0) === activePageIndex)
            .map((sig) => (
              <div
                key={sig.id}
                style={{
                  position: 'absolute',
                  left: `${sig.x_percent}%`,
                  top: `${sig.y_percent}%`,
                  width: `${sig.width_percent || 18}%`,
                  transform: 'translate(-10%, -20%)'
                }}
                className="group select-none pointer-events-auto cursor-pointer"
                title={`Disetujui oleh: ${sig.signer_name} (${sig.signer_role || 'Staff'}) pada ${sig.timestamp}`}
              >
                {/* Transparent Ink Image Only - Pure Signature without Name Text */}
                {sig.signature_image ? (
                  <img
                    src={sig.signature_image}
                    alt={sig.signer_name || 'Tanda Tangan'}
                    className="w-full h-auto max-h-24 object-contain filter drop-shadow-sm pointer-events-none"
                  />
                ) : (
                  <svg viewBox="0 0 120 40" className="w-28 h-10 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 28 C 25 10, 35 35, 45 15 C 55 -5, 60 38, 75 22 C 85 10, 95 30, 110 20 M30 25 L90 24" />
                  </svg>
                )}
              </div>
            ))}

          {/* ════════ ACTIVE DRAG & DROP SIGNATURE BOX (TANPA NAMA DI DALAM KOTAK) ════════ */}
          {isPlacingSignature && (
            <div
              style={{
                position: 'absolute',
                left: `${sigPosition.xPercent}%`,
                top: `${sigPosition.yPercent}%`,
                width: `${sigWidth}px`,
                touchAction: 'none'
              }}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
              className={`p-2 rounded-2xl cursor-move transition-all z-30 select-none shadow-xl ${
                !isPositionValidForRole
                  ? 'border-2 border-red-500 bg-red-50/40 ring-4 ring-red-400/30'
                  : isPositionLocked
                  ? 'border-2 border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-400/30'
                  : 'border-2 border-dashed border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/20 animate-pulse'
              }`}
            >
              {/* Header Box (Purely Functional Status - NO PERSON NAME) */}
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200/60 text-[10px]">
                <span className="font-bold flex items-center gap-1">
                  {!isPositionValidForRole ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span className="text-red-700">Area Tanda Tangan</span>
                    </>
                  ) : isPositionLocked ? (
                    <>
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Posisi Terkunci</span>
                    </>
                  ) : (
                    <>
                      <Move className="w-3 h-3 text-blue-600" />
                      <span className="text-blue-700">Geser ke Kolom TTD</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-slate-400">
                  {Math.round(sigPosition.xPercent)}%, {Math.round(sigPosition.yPercent)}%
                </span>
              </div>

              {/* Transparent Signature Ink Preview Only (NO NAME TEXT WHATSOEVER) */}
              <div className="h-16 flex items-center justify-center overflow-hidden bg-white/40 rounded-xl border border-slate-200/50">
                {userSignature ? (
                  <img
                    src={userSignature}
                    alt="Signature Ink"
                    className="max-h-full max-w-full object-contain filter drop-shadow-sm pointer-events-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <PenTool className="w-5 h-5 mb-0.5 opacity-60" />
                    <span className="text-[10px] italic">Letakkan Tanda Tangan</span>
                  </div>
                )}
              </div>

              {/* Action Buttons (Lock Position / Snap) - NO PERSON NAME */}
              {!isPositionValidForRole ? (
                <div className="mt-1 pt-1 border-t border-red-200 space-y-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      snapToMySlot();
                    }}
                    className="w-full py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
                  >
                    ⚡ Rapikan ke Kolom Dokumen
                  </button>
                </div>
              ) : !isPositionLocked ? (
                <div className="mt-1.5 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLockPosition();
                    }}
                    className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
                  >
                    ✓ Kunci Posisi Ini
                  </button>
                </div>
              ) : null}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
