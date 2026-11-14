import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Printer,
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
  Check,
  FileText,
  Edit3,
  PenTool
} from 'lucide-react';
import api from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

// Reject known 1x1 / tiny placeholder PNGs (e.g. bright green test pixel) so they never stretch on paper
const isValidSignatureImage = (src) => {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!trimmed.startsWith('data:image/')) return false;
  if (trimmed.length < 250 || trimmed.includes('AAAAEAAAABCAYAAAAfFcSJ')) return false;
  return true;
};

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
  const isCustom = doc.template_type === 'CUSTOM' || (!['MOS', 'MDT', 'MRP', 'MR'].includes(doc.template_type) && doc.pages?.length > 0);
  const tplType = doc.template_type || 'MOS';

  // Orientation: 'landscape' or 'portrait'
  const [orientation, setOrientation] = useState(doc.orientation || 'landscape');
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1); // 0.8 to 1.3

  // ── Drag & Drop + Resize Signature State ──
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [sigPosition, setSigPosition] = useState({ xPercent: 42, yPercent: 74 }); // % relative to paper
  const [sigWidth, setSigWidth] = useState(150); // px width
  const [isPositionLocked, setIsPositionLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ clientX: 0, initialWidth: 150 });
  const [stamping, setStamping] = useState(false);
  const [stampSuccess, setStampSuccess] = useState(false);
  const [invalidSigIds, setInvalidSigIds] = useState({});

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

  // Auto-snap signature right into the blank ink space above the user's printed name
  const snapToMySlot = () => {
    let targetX = 42;
    if (userAllowedSlot === 'maker') targetX = 9;
    else if (userAllowedSlot === 'checker') targetX = 42;
    else if (userAllowedSlot === 'approver') targetX = 75;
    setSigPosition({ xPercent: targetX, yPercent: 74 });
  };

  // Start Usign drag-and-drop placement
  const handleStartPlacing = () => {
    if (isAlreadySignedByCurrentUser) {
      addToast('Anda sudah menandatangani dokumen ini.', 'warning');
      return;
    }
    if (isUserSlotOccupied) {
      addToast(`Kolom "${getSlotLabel(userAllowedSlot)}" untuk hak akses Anda sudah ditandatangani.`, 'warning');
      return;
    }

    let initialX = 42;
    if (!isCustom) {
      if (userAllowedSlot === 'maker') initialX = 9;
      else if (userAllowedSlot === 'checker') initialX = 42;
      else if (userAllowedSlot === 'approver') initialX = 75;
    }
    setSigPosition({ xPercent: initialX, yPercent: 74 });
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

  // Handle Dragging signature across paper canvas
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

  // Handle Drag-to-Resize from bottom-right corner handle
  const handleResizeDown = (e) => {
    if (isPositionLocked) return;
    e.preventDefault();
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setIsResizing(true);
    setResizeStart({ clientX, initialWidth: sigWidth });
  };

  const handlePointerMove = (e) => {
    if (isPositionLocked) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (isResizing) {
      const deltaX = clientX - resizeStart.clientX;
      setSigWidth(Math.max(88, Math.min(260, Math.round(resizeStart.initialWidth + deltaX))));
      return;
    }

    if (!isDragging) return;
    const paperRect = paperRef.current?.getBoundingClientRect();
    if (!paperRect) return;

    let newX = clientX - paperRect.left - dragOffset.x;
    let newY = clientY - paperRect.top - dragOffset.y;

    // Constrain inside paper boundary
    newX = Math.max(8, Math.min(newX, paperRect.width - sigWidth - 8));
    newY = Math.max(8, Math.min(newY, paperRect.height - 64));

    const xPercent = (newX / paperRect.width) * 100;
    const yPercent = (newY / paperRect.height) * 100;

    setSigPosition({ xPercent, yPercent });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
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
  }, [isDragging, isResizing, dragOffset, resizeStart]);

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
            hash: null
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
              <span>{doc.site_location || 'Site Office'}</span>
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upload Gambar TTD</span>
            </button>
          ) : !isPlacingSignature ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenSignatureModal}
                className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Ganti atau ekstrak ulang gambar tanda tangan"
              >
                Ganti TTD
              </button>
              <button
                onClick={handleStartPlacing}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Tanda Tangani Dokumen</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {!isPositionValidForRole && (
                <button
                  type="button"
                  onClick={snapToMySlot}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  Arahkan ke Kolom {getSlotLabel(userAllowedSlot)}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPlacingSignature(false)}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>

              {!isPositionLocked ? (
                <button
                  type="button"
                  disabled={!isPositionValidForRole}
                  onClick={handleLockPosition}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all ${
                    isPositionValidForRole
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                  title={!isPositionValidForRole ? `Geser tanda tangan ke kolom ${getSlotLabel(userAllowedSlot)}` : 'Kunci Posisi'}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Kunci Posisi</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleUnlockPosition}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Ubah Posisi</span>
                  </button>

                  <button
                    type="button"
                    disabled={stamping || !isPositionValidForRole}
                    onClick={handleApproveAndStamp}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
              Tanda tangan berhasil dibubuhkan dan disimpan pada dokumen.
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

      {/* ── THE INTERACTIVE PAPER CANVAS (Siku 90° Real Corporate A4/F4 Sheet) ── */}
      <div className="w-full flex justify-center overflow-x-auto bg-slate-200/60 border border-slate-300/80 p-4 sm:p-6 pb-10 print:p-0 print:bg-white print:border-none">
        <div
          ref={paperRef}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease'
          }}
          className={`relative bg-white text-slate-900 rounded-none border border-slate-400 shadow-[0_6px_28px_rgba(15,23,42,0.10)] overflow-hidden print:shadow-none print:border-none print:transform-none ${
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

          {/* ════════ CASE B: BUILT-IN TEMPLATES (MOS, MDT, MRP, MR) ════════ */}
          {!isCustom && activePageIndex === 0 && (
            <div className="p-8 sm:p-10 space-y-4">
              
              {/* Official Digitech Corporate Letterhead + Formal Sharp Form Box */}
              <div className="border-b-2 border-slate-900 pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/digitech-emblem.png"
                      alt="Digitech"
                      className="w-11 h-11 object-contain shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/favicon.png';
                      }}
                    />
                    <div>
                      <div className="text-lg font-black text-slate-900 tracking-wider leading-none">
                        DIGITECH
                      </div>
                      <div className="text-[11px] font-bold text-red-700 mt-0.5">
                        Inventory Management System
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Divisi Logistik &amp; Operasional Site
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="border-2 border-slate-900 rounded-none bg-slate-50 px-4 py-1 text-sm font-black uppercase tracking-wider text-slate-900 inline-block">
                      {tplType === 'MDT'
                        ? 'MATERIAL DISMANTLING'
                        : tplType === 'MRP'
                        ? 'MATERIAL REPLACEMENT'
                        : tplType === 'MR'
                        ? 'MATERIAL REQUEST'
                        : 'MATERIAL ON SITE'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 mt-1">
                      No. Dokumen: <strong className="text-slate-900">{doc.doc_number}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balanced 6x2 Formal Metadata Grid (Sharp 90° Corners) */}
              <div className="border border-slate-800 rounded-none text-[11px]">
                <div className="grid grid-cols-2">
                  {/* Left Column (6 Rows) */}
                  <div className="divide-y divide-slate-300 border-r border-slate-800">
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">Lokasi Asal (Dari)</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-medium text-slate-900">{doc.origin_location || 'Gudang Site / Buffer'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">Lokasi Tujuan (Ke)</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-semibold text-slate-900">{doc.destination_location || doc.site_location || 'BIB Pit Sebamban KM-14'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">Pengirim / Pembuat</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-medium text-slate-900">{doc.sender_name || 'Staff Lapangan'} ({doc.sender_role || 'Teknisi Lapangan'})</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">Penerima / Tujuan</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-semibold text-slate-900">{doc.destination_receiver || doc.pic_receiver_name || 'Team Mekanik Pit'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">No. Dokumen</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-mono font-bold text-red-700">{doc.doc_number}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">No. SPK / WO</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-mono font-medium text-slate-900">{doc.wo_spk_number || '-'}</span>
                    </div>
                  </div>

                  {/* Right Column (Matching 6 Rows) */}
                  <div className="divide-y divide-slate-300">
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">
                        {tplType === 'MDT' ? 'Tanggal Dismantling' : tplType === 'MRP' ? 'Tanggal Replacement' : tplType === 'MR' ? 'Tanggal Pengajuan' : 'Tanggal Penerimaan'}
                      </span>
                      <span className="col-span-2 px-2.5 py-1.5 font-mono font-medium text-slate-900">{doc.received_date || '2026-10-31'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">No. PO / DO</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-mono font-medium text-slate-900">{doc.po_do_number || '-'} {doc.do_sj_number && doc.do_sj_number !== '-' ? ` / SJ: ${doc.do_sj_number}` : ''}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">
                        {tplType === 'MDT' ? 'Kondisi Dismantling' : tplType === 'MRP' ? 'Kondisi Replacement' : 'Kondisi Kemasan'}
                      </span>
                      <span className="col-span-2 px-2.5 py-1.5 font-medium text-slate-900">{doc.package_condition || 'Baik'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">Target Dibutuhkan</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-mono font-medium text-slate-900">{doc.required_date || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">Departemen / Unit</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-medium text-slate-900">{doc.department || 'Operasional & Logistik Site'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="px-2.5 py-1.5 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">Peruntukan / Catatan</span>
                      <span className="col-span-2 px-2.5 py-1.5 font-medium text-slate-900 truncate">{doc.unit_targeted && doc.unit_targeted !== '-' ? doc.unit_targeted : (doc.purpose || 'Verifikasi & Otorisasi Operasional')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 9-Column Items Table with Unified Formal Header */}
              <div className="border border-slate-800 rounded-none overflow-hidden text-[11px]">
                <div className="bg-slate-100 border-b border-slate-800 text-slate-900 py-1.5 px-4 text-center font-bold text-xs uppercase tracking-wider">
                  {tplType === 'MDT'
                    ? 'DETAIL BARANG DISMANTLING'
                    : tplType === 'MRP'
                    ? 'DETAIL REPLACEMENT'
                    : tplType === 'MR'
                    ? 'DETAIL PERMINTAAN MATERIAL'
                    : 'DETAIL BARANG DITERIMA'}
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#162B4D] text-white text-center font-bold divide-x divide-slate-600 border-b border-slate-800">
                      <th className="py-2 px-2 w-10">No</th>
                      <th className="py-2 px-3 text-left">Nama Barang / Material</th>
                      <th className="py-2 px-3 text-left">Spesifikasi / Part No.</th>
                      <th className="py-2 px-3 w-32">Serial Number</th>
                      <th className="py-2 px-2 w-20">
                        {tplType === 'MOS' ? 'Qty Terima' : tplType === 'MR' ? 'Qty Diminta' : 'Qty Dismantling'}
                      </th>
                      <th className="py-2 px-2 w-20">
                        {tplType === 'MOS' ? 'Qty DO' : tplType === 'MR' ? 'Qty Keluar' : 'Qty Installation'}
                      </th>
                      <th className="py-2 px-2 w-24">Kondisi Barang</th>
                      <th className="py-2 px-2 w-28">{tplType === 'MR' ? 'Rak / Bin' : 'Garansi'}</th>
                      <th className="py-2 px-3 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {(doc.items && doc.items.length > 0 ? doc.items : []).map((it, idx) => (
                      <tr key={it.id || idx} className="divide-x divide-slate-300 text-slate-900">
                        <td className="py-1.5 px-2 text-center font-mono">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold">{it.name || it.item_name}</td>
                        <td className="py-1.5 px-3">{it.spec || it.part_number}</td>
                        <td className="py-1.5 px-3 font-mono text-center">{it.sn || it.serial_number}</td>
                        <td className="py-1.5 px-2 text-center font-semibold">{it.qty_received ?? it.qty ?? '-'}</td>
                        <td className="py-1.5 px-2 text-center">{it.qty_do || '-'}</td>
                        <td className="py-1.5 px-2 text-center">{it.condition || it.item_condition || 'Baru'}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{tplType === 'MR' ? (it.bin_location || it.rack || '-') : (it.warranty || '-')}</td>
                        <td className="py-1.5 px-3 text-slate-700">{it.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Catatan Teknis / Alasan Pekerjaan (Sharp Paper Box) */}
              {doc.notes_justification && (
                <div className="border border-slate-400 rounded-none p-2.5 bg-slate-50/70 text-xs text-slate-800">
                  <div className="font-bold text-slate-900 mb-0.5 text-[11px] uppercase tracking-wide">
                    Catatan Teknis &amp; Justifikasi Pekerjaan:
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed italic">
                    "{doc.notes_justification}"
                  </p>
                </div>
              )}

              {/* Official Signature Area Grid Frame (Pure Paper Columns — Zero Dashboard Clutter) */}
              <div className="pt-1">
                <div className="border border-slate-800 rounded-none">
                  <div className="bg-[#162B4D] text-white py-1.5 px-4 text-center font-bold text-xs uppercase tracking-wider border-b border-slate-800">
                    TANDA TANGAN &amp; OTORISASI
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-slate-800 text-center text-xs">
                    {/* Slot 1: Dibuat Oleh */}
                    <div className="flex flex-col justify-between h-36 bg-white">
                      <div className="bg-slate-100 py-1 font-bold text-slate-900 border-b border-slate-300">
                        Dibuat Oleh
                      </div>
                      <div className="flex-1" />
                      <div className="border-t border-slate-300 py-1.5 px-2">
                        <div className="font-bold text-slate-900">( {doc.approval_maker_name || doc.sender_name || 'Staff Lapangan'} )</div>
                        <div className="text-[10px] text-slate-600">
                          {doc.approval_maker_role || doc.sender_role || 'Teknisi Lapangan'} {doc.approval_maker_dept ? `— ${doc.approval_maker_dept}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Slot 2: Diperiksa Oleh */}
                    <div className="flex flex-col justify-between h-36 bg-white">
                      <div className="bg-slate-100 py-1 font-bold text-slate-900 border-b border-slate-300">
                        Diperiksa Oleh
                      </div>
                      <div className="flex-1" />
                      <div className="border-t border-slate-300 py-1.5 px-2">
                        <div className="font-bold text-slate-900">( {doc.approval_checker_name || 'Zainal Fahriandy'} )</div>
                        <div className="text-[10px] text-slate-600">
                          {doc.approval_checker_role || 'Supervisor Logistik Site'} {doc.approval_checker_dept ? `— ${doc.approval_checker_dept}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Slot 3: Diketahui Oleh */}
                    <div className="flex flex-col justify-between h-36 bg-white">
                      <div className="bg-slate-100 py-1 font-bold text-slate-900 border-b border-slate-300">
                        Diketahui Oleh
                      </div>
                      <div className="flex-1" />
                      <div className="border-t border-slate-300 py-1.5 px-2">
                        <div className="font-bold text-slate-900">( {doc.approval_approver_name || 'Harris'} )</div>
                        <div className="text-[10px] text-slate-600">
                          {doc.approval_approver_role || 'Digitech'} {doc.approval_approver_dept ? `— ${doc.approval_approver_dept}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Corporate Footnote */}
              <div className="pt-2 border-t border-slate-300 text-slate-600 text-[10px] font-medium flex items-center justify-between gap-4">
                <span>
                  Catatan: Laporkan ke Pengawas Site dan Digitech apabila terdapat ketidaksesuaian jumlah atau kondisi material.
                </span>
                <span className="font-mono text-slate-500 shrink-0">
                  DigiTech Division &mdash; Golden Energy Mines (GEMS) &bull; Dokumen Resmi Site
                </span>
              </div>

            </div>
          )}

          {/* ════════ CASE C: PAGE 2 (REAL DYNAMIC PHOTO ATTACHMENT IF AVAILABLE) ════════ */}
          {!isCustom && activePageIndex === 1 && hasPhotoAttachment && (
            <div className="p-8 sm:p-10 space-y-6">
              <div className="border-b-2 border-slate-900 pb-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/digitech-emblem.png"
                    alt="Digitech"
                    className="w-10 h-10 object-contain shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/favicon.png';
                    }}
                  />
                  <div>
                    <div className="text-base font-black text-slate-900 tracking-wider leading-none">
                      DIGITECH
                    </div>
                    <div className="text-[10px] font-bold text-red-700 mt-0.5">
                      Inventory Management System
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900">
                    LAMPIRAN DOKUMENTASI FOTO
                  </h2>
                  <div className="text-[11px] font-mono text-slate-700 font-bold">
                    {doc.doc_number}
                  </div>
                </div>
              </div>

              <div className="border border-slate-800 rounded-none p-4 bg-white space-y-3">
                <div className="max-h-[560px] rounded-none overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-300">
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

          {/* ════════ STAMPED SIGNATURES OVERLAY (PURE TRANSPARENT INK ONLY) ════════ */}
          {stampedSignatures
            .filter((sig) =>
              Number(sig.page_index ?? 0) === activePageIndex &&
              isValidSignatureImage(sig.signature_image) &&
              !invalidSigIds[sig.id]
            )
            .map((sig) => (
              <div
                key={sig.id}
                style={{
                  position: 'absolute',
                  left: `${sig.x_percent}%`,
                  top: `${sig.y_percent}%`,
                  width: `${sig.width_percent || 16}%`
                }}
                className="select-none pointer-events-none"
                title={`Ditandatangani oleh ${sig.signer_name} (${sig.signer_role || 'Staff'}) pada ${sig.timestamp}`}
              >
                <img
                  src={sig.signature_image}
                  alt={sig.signer_name || 'Tanda Tangan'}
                  onLoad={(e) => {
                    if (e.target.naturalWidth <= 4 || e.target.naturalHeight <= 4) {
                      setInvalidSigIds((prev) => ({ ...prev, [sig.id]: true }));
                    }
                  }}
                  onError={() => setInvalidSigIds((prev) => ({ ...prev, [sig.id]: true }))}
                  className="w-full h-auto max-h-20 object-contain mix-blend-multiply pointer-events-none"
                />
              </div>
            ))}

          {/* ════════ ACTIVE USIGN DRAG & RESIZE TRANSPARENT INK PLACER ════════ */}
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
              className={`relative cursor-move z-30 select-none rounded-none p-1 transition-colors ${
                !isPositionValidForRole
                  ? 'border border-dashed border-red-600 bg-red-500/5'
                  : isPositionLocked
                  ? 'border border-solid border-emerald-600'
                  : 'border border-dashed border-slate-800'
              }`}
            >
              {/* Floating Micro-Toolbar Above Frame (Zero Paper Obstruction) */}
              <div
                className="absolute -top-6 left-0 right-0 flex items-center justify-between gap-1 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-tight whitespace-nowrap ${
                    !isPositionValidForRole
                      ? 'bg-red-600 text-white'
                      : isPositionLocked
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  {!isPositionValidForRole
                    ? `Geser ke ${getSlotLabel(userAllowedSlot)}`
                    : isPositionLocked
                    ? 'Terkunci'
                    : 'Geser & Atur Ukuran'}
                </span>

                {!isPositionLocked && (
                  <div className="flex items-center gap-0.5 bg-white border border-slate-400 shadow-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSigWidth((w) => Math.max(88, w - 16));
                      }}
                      className="w-4 h-4 text-[10px] font-bold text-slate-800 hover:bg-slate-100 leading-none flex items-center justify-center cursor-pointer"
                      title="Perkecil"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSigWidth((w) => Math.min(260, w + 16));
                      }}
                      className="w-4 h-4 text-[10px] font-bold text-slate-800 hover:bg-slate-100 leading-none flex items-center justify-center border-l border-slate-300 cursor-pointer"
                      title="Perbesar"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* 4 Corner Crop Handles (Sharp Squares) */}
              {!isPositionLocked && (
                <>
                  <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-slate-900 pointer-events-none" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-slate-900 pointer-events-none" />
                  <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-slate-900 pointer-events-none" />
                  <button
                    type="button"
                    onMouseDown={handleResizeDown}
                    onTouchStart={handleResizeDown}
                    aria-label="Ubah ukuran tanda tangan"
                    title="Tarik untuk memperbesar/memperkecil tanda tangan"
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-red-600 border border-white cursor-nwse-resize z-10"
                  />
                </>
              )}

              {/* Pure Transparent Ink Preview Directly Over Paper */}
              <div className="h-14 flex items-center justify-center overflow-hidden">
                {userSignature ? (
                  <img
                    src={userSignature}
                    alt="Tanda Tangan"
                    className="max-h-full max-w-full object-contain mix-blend-multiply pointer-events-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <PenTool className="w-4 h-4 mb-0.5 opacity-60" />
                    <span className="text-[9px] font-mono">Belum ada file TTD</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
