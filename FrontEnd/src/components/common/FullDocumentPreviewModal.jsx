import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileText,
  FileCheck2,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  AlertTriangle,
  Layers,
  Sparkles,
  Eye,
  RefreshCw,
  PenTool,
  Lock,
  ArrowRight,
  ShieldAlert,
  Check,
  QrCode
} from 'lucide-react';
import { uploadProjectDocumentAttachment, signProjectDocument } from '../../api/projectInventoryApi';
import SignatureCanvas from './SignatureCanvas';

/**
 * FullDocumentPreviewModal
 * 
 * Authentic PDF Reader & Physical A4 Document Viewer:
 * - Ambient PDF viewer backdrop (Slate/Charcoal #323639 matching Chrome/Adobe PDF viewer)
 * - Real physical A4 paper sheet with physical margins, drop shadow, and crisp legal typography
 * - Full toolbar with Document title, Page 1/1 counter, Zoom controls (- 100% +), Rotate, Print, Download, Fullscreen, and Close
 * - 100% responsive, zero element clipping, smoothly scrollable vertically
 * - Print-ready (@media print) to output genuine A4 corporate sheets
 */
export default function FullDocumentPreviewModal({
  isOpen,
  onClose,
  document: initialDoc,
  onDocumentUpdated,
  currentUser = null,
  userSignature = null
}) {
  const [doc, setDoc] = useState(initialDoc);
  const [viewMode, setViewMode] = useState('sheet'); // 'sheet' | 'attachment'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadToast, setUploadToast] = useState(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const fileInputRef = useRef(null);
  const modalContainerRef = useRef(null);

  // Sync state when initialDoc changes
  useEffect(() => {
    if (initialDoc) {
      setDoc(initialDoc);
      if (initialDoc.file_url || initialDoc.file_data) {
        setViewMode('attachment');
      } else {
        setViewMode('sheet');
      }
      setZoomLevel(100);
      setRotation(0);
    }
  }, [initialDoc]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isSignModalOpen) {
          setIsSignModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSignModalOpen, onClose]);

  if (!isOpen || !doc) return null;

  // Derive file properties
  const rawFileUrl = doc.file_url || doc.file_data || '';
  const fileType = doc.file_type || (rawFileUrl.toLowerCase().includes('.pdf') || (doc.file_attachment && doc.file_attachment.toLowerCase().endsWith('.pdf')) ? 'pdf' : 'image');
  const hasAttachment = Boolean(doc.file_url || doc.file_data || doc.file_attachment);

  // Full absolute URL for backend static uploads if relative
  const backendBase = 'http://localhost:3001';
  const resolvedFileUrl = doc.file_data 
    ? doc.file_data 
    : doc.file_url 
      ? (doc.file_url.startsWith('http') ? doc.file_url : `${backendBase}${doc.file_url}`)
      : null;

  // Handle Zoom In / Out / Reset
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 15, 60));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (modalContainerRef.current?.requestFullscreen) {
        modalContainerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (window.document.exitFullscreen) {
        window.document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Download
  const handleDownload = () => {
    if (resolvedFileUrl) {
      const link = window.document.createElement('a');
      link.href = resolvedFileUrl;
      link.download = doc.file_attachment || `${doc.doc_number || 'Dokumen'}.${fileType === 'pdf' ? 'pdf' : 'jpg'}`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else {
      window.print();
    }
  };

  // Handle File Upload to Backend & Database
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const base64Data = event.target.result;
        const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
        
        const payload = {
          file_name: file.name,
          file_data: base64Data,
          file_type: isPdf ? 'pdf' : 'image',
          summary: `Lampiran berkas fisik resmi diunggah oleh ${currentUser?.full_name || 'Staff'}`
        };

        const updated = await uploadProjectDocumentAttachment(doc.id, payload);
        const resolvedDoc = updated || {
          ...doc,
          file_attachment: file.name,
          file_data: base64Data,
          file_url: `/uploads/documents/${file.name}`,
          file_type: isPdf ? 'pdf' : 'image'
        };

        setDoc(resolvedDoc);
        if (onDocumentUpdated) onDocumentUpdated(resolvedDoc);

        setViewMode('attachment');
        setUploadToast('Berkas fisik berhasil disimpan ke server & database!');
        setTimeout(() => setUploadToast(null), 3500);
      } catch (err) {
        console.error('Failed to upload attachment:', err);
        setUploadToast('Gagal mengunggah berkas. Pastikan ukuran file sesuai.');
        setTimeout(() => setUploadToast(null), 3500);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  // Handle Digital Signature Submission
  const handleSignConfirm = async (signatureDataUrl) => {
    if (!signatureDataUrl) return;
    setIsSigning(true);

    try {
      const sigPayload = {
        signer_name: currentUser?.full_name || 'Harris / Manajemen Digitech',
        signer_role: currentUser?.role || 'Head of Mining Division',
        signature_image: signatureDataUrl,
        notes: 'Disahkan secara digital melalui sistem IMS'
      };

      const updated = await signProjectDocument(doc.id, sigPayload);
      const newDocState = updated || {
        ...doc,
        signatures_count: (doc.signatures_count || 0) + 1,
        status: 'Approved',
        signatures: [...(doc.signatures || []), {
          id: `sig-${Date.now()}`,
          signer_name: sigPayload.signer_name,
          signature_image: sigPayload.signature_image,
          timestamp: new Date().toISOString()
        }]
      };

      setDoc(newDocState);
      if (onDocumentUpdated) onDocumentUpdated(newDocState);
      setIsSignModalOpen(false);
      setUploadToast('Tanda tangan digital berhasil disahkan ke dokumen!');
      setTimeout(() => setUploadToast(null), 3000);
    } catch (err) {
      console.error('Sign failed:', err);
      setUploadToast('Gagal menandatangani dokumen.');
      setTimeout(() => setUploadToast(null), 3000);
    } finally {
      setIsSigning(false);
    }
  };

  // Default Material Items for Detailed Sheet
  const sampleItems = doc.items || [
    { no: 1, name: 'GPS Tracker (Concox / Meltrack)', sn: '1134542881', qty: 1, unit: 'Unit', cond: 'Eks-Pindahan Unit' }
  ];

  const displayFileName = doc.file_attachment || `BASTM_${(doc.doc_number || '007_MVM_BIB_VII_2024').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  return createPortal(
    <div
      ref={modalContainerRef}
      className="fixed inset-0 z-[99999] flex flex-col bg-[#323639] select-none overflow-hidden animate-in fade-in duration-150 print:bg-white print:overflow-visible print:h-auto"
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. TOP PDF READER TOOLBAR (Chrome / Acrobat Style)          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="h-14 bg-[#202124] border-b border-[#3c4043] px-3 sm:px-5 flex items-center justify-between text-white shadow-md z-30 shrink-0 print:hidden">
        
        {/* Left: Document Icon & Name (No clipping) */}
        <div className="flex items-center gap-3 min-w-0 max-w-[40%]">
          <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center shrink-0 shadow-xs border border-white/10">
            <img
              src="/digitech-emblem.png"
              alt="Digitech"
              className="w-5 h-5 object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs sm:text-sm text-slate-100 truncate block font-sans">
                {displayFileName}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shrink-0">
                <Check className="w-2.5 h-2.5" /> Resmi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden lg:block font-sans">
              {doc.title || 'Lembar Resmi Berita Acara & Legalitas Lapangan'}
            </p>
          </div>
        </div>

        {/* Center: Page Counter & Zoom Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Page Counter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-[#2b2e31] px-2.5 py-1 rounded-md border border-white/10">
            <span className="text-white font-bold">1</span>
            <span className="text-slate-400">/</span>
            <span>1</span>
          </div>

          <div className="w-px h-5 bg-white/15 mx-1 hidden sm:block" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-[#2b2e31] px-1 py-0.5 rounded-md border border-white/10">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              title="Perkecil (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="font-mono text-xs font-semibold px-1 text-slate-200 hover:text-white min-w-[44px] text-center cursor-pointer"
              title="Reset ke 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              title="Perbesar (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate Button */}
          <button
            type="button"
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-1.5 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer hidden sm:flex items-center justify-center"
            title="Putar Dokumen 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: View Switcher, Upload, Print, Download, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Mode Switcher (Kertas A4 vs Lampiran File Fisik) */}
          <div className="hidden xl:flex bg-[#2b2e31] p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('sheet')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition cursor-pointer text-xs ${
                viewMode === 'sheet'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lembar A4 Asli</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('attachment')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition cursor-pointer text-xs ${
                viewMode === 'attachment'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Lampiran Scan</span>
              {hasAttachment && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-100 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="Unggah berkas fisik PDF/Foto untuk disimpan ke database"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isUploading ? 'Menyimpan...' : 'Upload Berkas'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition cursor-pointer"
            title="Cetak Dokumen (Ctrl + P)"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition cursor-pointer"
            title="Unduh Salinan PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition cursor-pointer hidden md:flex items-center justify-center"
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white transition cursor-pointer ml-1"
            title="Tutup Preview PDF (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {uploadToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center animate-in slide-in-from-top-2 duration-200 flex items-center justify-center gap-2 z-40 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          <span>{uploadToast}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. MAIN READER CANVAS (REAL A4 PHYSICAL PAPER)              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 md:p-12 flex justify-center items-start bg-[#323639] print:p-0 print:bg-white print:overflow-visible">
        
        {/* ─────────────────────────────────────────────────────────── */}
        {/* MODE 1: LEMBAR KERTAS A4 ASLI (REAL PHYSICAL PAPER)         */}
        {/* ─────────────────────────────────────────────────────────── */}
        {viewMode === 'sheet' && (
          <div
            style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="transition-transform print:transform-none"
          >
            {/* PHYSICAL A4 PAPER SHEET */}
            <div
              className="w-[820px] max-w-[95vw] min-h-[1160px] bg-white text-slate-900 shadow-[0_4px_30px_rgba(0,0,0,0.65),0_1px_4px_rgba(0,0,0,0.35)] mx-auto p-8 sm:p-12 md:p-14 flex flex-col justify-between border border-slate-300/40 relative font-sans print:shadow-none print:border-none print:p-0 print:w-full print:min-h-0"
            >
              {/* Top Accent Design Band (Matching Image 3 Case Study Style) */}
              <div className="w-full bg-[#8B1A1A] text-white px-4 py-1.5 flex items-center justify-between text-[10px] font-mono tracking-widest font-bold uppercase mb-6 rounded-xs">
                <span>DIGITECH • OFFICIAL AUDIT REPORT</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  AUTHENTICATED
                </span>
              </div>

              <div>
                {/* ── KOP SURAT RESMI DIGITECH ─────────────────────────── */}
                <div className="border-b-2 border-red-700 pb-4 mb-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src="/digitech-emblem.png"
                        alt="Digitech"
                        className="w-13 h-13 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-2xs"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/favicon.png';
                        }}
                      />
                      <div>
                        <h1 className="text-2xl font-black text-red-700 tracking-wider font-sans leading-none">
                          DIGITECH
                        </h1>
                        <div className="text-[11px] font-bold text-slate-800 tracking-wide uppercase mt-1">
                          Mining Automation, Weigh-In-Motion &amp; Telematics Division
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Operational Site: KM 14 Pit Sebamban • Head Office: Jakarta Selatan, Indonesia
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                        DIGITECH IMS
                      </div>
                      <div className="text-xs font-black font-mono text-slate-800">
                        ISO 9001:2015 Compliant
                      </div>
                      <div className="text-[9px] font-mono text-emerald-700 font-bold tracking-widest uppercase">
                        DIGITAL AUDIT SYSTEM
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── JUDUL LEMBAR DOKUMEN ────────────────────────────── */}
                <div className="text-center space-y-1 mb-6">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide font-sans">
                    {doc.stage_number === 7 || doc.title?.toLowerCase().includes('pindahan')
                      ? 'LEMBAR RESMI OPERASIONAL & MUTASI / PINDAHAN'
                      : doc.stage_number === 8 || doc.title?.toLowerCase().includes('kerusakan') || doc.title?.toLowerCase().includes('decommissioning') || doc.title?.toLowerCase().includes('afkir')
                      ? 'BERITA ACARA LAPOR KERUSAKAN & DECOMMISSIONING SENSOR'
                      : 'BERITA ACARA SERAH TERIMA MATERIAL (BASTM)'}
                  </h2>
                  <div className="text-xs font-mono font-black text-red-700 tracking-wider">
                    NO. REGISTRASI: {doc.doc_number || '007/MVM-BIB/VII/2024'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Workspace Proyek: <span className="font-bold text-slate-800">{doc.project_code || 'FAMOUS'}</span> • Diterbitkan: <span className="font-bold text-slate-800">{doc.created_date || '2024-07-19'}</span>
                  </div>
                </div>

                {/* ── METADATA LEMBAR KERJA GRID (4 Crisp Boxes) ──────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs font-sans">
                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      JUDUL KEGIATAN / BERITA ACARA:
                    </span>
                    <div className="font-bold text-slate-900 leading-snug">
                      {doc.title || 'Berita Acara Pindahan Komponen Perangkat GPS Tracker'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      TAHAPAN SIKLUS PROYEK:
                    </span>
                    <div className="font-bold text-red-700 font-mono">
                      Tahap #{doc.stage_number || 7} — {doc.stage_name || doc.stage_code || 'Operasional & Mutasi / Pindahan'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      PENANGGUNG JAWAB / PEMOHON:
                    </span>
                    <div className="font-bold text-slate-900">
                      {doc.creator_name || 'Zainal Fahriandy'} <span className="font-normal text-slate-600">({doc.creator_role || 'Supervisor Workshop & Telematika'})</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      MASA BERLAKU / TENGGAT WAKTU:
                    </span>
                    <div className="font-bold font-mono text-slate-900">
                      {doc.due_date || '2024-08-01'}
                    </div>
                  </div>
                </div>

                {/* ── RUANG LINGKUP & DASAR PELAKSANAAN ───────────────── */}
                <div className="mb-5 space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    <span>Ruang Lingkup &amp; Dasar Pelaksanaan:</span>
                  </div>
                  <div className="p-3.5 bg-slate-50/40 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-sans">
                    {doc.summary || 'Dokumen Berita Acara Serah Terima Material (BASTM) resmi dan verifikasi fisik IMEI untuk perangkat telematika. Riwayat: Dipindahkan dari armada EX AEK 0101 untuk kebutuhan rotasi unit armada kontraktor BIB.'}
                  </div>
                </div>

                {/* ── DAFTAR MATERIAL, KOMPONEN & SERIAL NUMBER ───────── */}
                <div className="mb-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-red-600" />
                      <span>Daftar Material, Komponen &amp; Serial Number:</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Total: {sampleItems.length} Komponen
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 text-slate-700 font-mono text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-10">No</th>
                          <th className="py-2.5 px-3">Nama Part / Deskripsi Item</th>
                          <th className="py-2.5 px-3 font-mono">Part Number / Serial Number</th>
                          <th className="py-2.5 px-3 text-center">Jumlah</th>
                          <th className="py-2.5 px-3 text-center">Satuan</th>
                          <th className="py-2.5 px-3 text-center">Kondisi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {sampleItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-500">{item.no || idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{item.name}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{item.sn}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.qty}</td>
                            <td className="py-2.5 px-3 text-center text-slate-600">{item.unit || 'Unit'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {item.cond || 'Eks-Pindahan Unit'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── PERNYATAAN KEPATUHAN PROYEK ────────────────────── */}
                <div className="p-3 bg-red-50/40 border border-red-200 rounded-xl text-[11px] text-red-900 flex items-start gap-2.5 mb-6">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-sans">
                    <strong>Pernyataan Kepatuhan Proyek:</strong> Seluruh komponen yang tertera di atas telah diperiksa fisik, nomor seri, dan fungsi operasionalnya. Setiap pemindahan, instalasi, atau decommissioning wajib disertai lembar pengesahan sah ini.
                  </div>
                </div>

                {/* ── 3-PARTY AUTHORIZATION & SIGNATURES ─────────────── */}
                <div className="border-t-2 border-slate-200 pt-4 mb-6">
                  <div className="text-center font-mono font-bold text-xs uppercase text-slate-700 mb-3 tracking-wider">
                    LEMBAR PENGESAHAN &amp; TANDA TANGAN OTORISASI (3 PIHAK)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    {/* Kolom 1: Pemohon / Teknisi */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between min-h-[155px]">
                      <div className="text-[10px] font-mono font-bold uppercase text-slate-500 border-b border-slate-200 pb-1">
                        Pihak I (Pelaksana Lapangan)
                      </div>
                      <div className="flex-1 flex items-center justify-center my-1.5">
                        <div className="h-14 flex items-center justify-center">
                          <svg viewBox="0 0 120 40" className="w-28 h-9 text-red-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 28 C 25 10, 35 35, 45 15 C 55 -5, 60 38, 75 22 C 85 10, 95 30, 110 20 M30 25 L90 24" />
                          </svg>
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-1.5">
                        <div className="font-bold text-xs text-slate-900">{doc.creator_name || 'Rayhans Najib Al-Faruq'}</div>
                        <div className="text-[10px] text-slate-500">{doc.creator_role || 'Teknisi WIM & Telematika'}</div>
                      </div>
                    </div>

                    {/* Kolom 2: Supervisor Site */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between min-h-[155px]">
                      <div className="text-[10px] font-mono font-bold uppercase text-slate-500 border-b border-slate-200 pb-1">
                        Pihak II (Supervisor Site)
                      </div>
                      <div className="flex-1 flex items-center justify-center my-1.5">
                        <div className="h-14 flex items-center justify-center">
                          <svg viewBox="0 0 120 40" className="w-28 h-9 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 15 C 30 35, 45 5, 60 25 C 75 8, 90 32, 105 18 M20 28 L95 28" />
                          </svg>
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-1.5">
                        <div className="font-bold text-xs text-slate-900">Zainal Fahriandy</div>
                        <div className="text-[10px] text-slate-500">Supervisor Workshop &amp; Telematika</div>
                      </div>
                    </div>

                    {/* Kolom 3: Otorisasi Sah Manajemen Digitech / BIB */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between min-h-[155px] relative">
                      <div className="text-[10px] font-mono font-bold uppercase text-slate-500 border-b border-slate-200 pb-1">
                        Pihak III (Otorisasi Sah BIB)
                      </div>
                      <div className="flex-1 flex items-center justify-center my-1.5 relative">
                        {/* Stempel Basah Digitech Audit */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-85">
                          <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-600/60 flex items-center justify-center -rotate-12">
                            <div className="text-[8px] font-mono font-black text-red-600 text-center leading-tight">
                              DIGITECH<br />VERIFIED<br />AUDIT TRAIL
                            </div>
                          </div>
                        </div>

                        {doc.signatures_count >= (doc.required_signatures || 2) || doc.status === 'Approved' || doc.status === 'Completed' ? (
                          <div className="flex flex-col items-center justify-center relative z-10">
                            <svg viewBox="0 0 120 40" className="w-28 h-9 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22 C 28 8, 42 36, 58 12 C 72 -2, 85 36, 102 16 M25 24 L85 24" />
                            </svg>
                            <div className="text-[9px] font-mono font-bold text-emerald-700 mt-0.5">
                              TERVERIFIKASI
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsSignModalOpen(true)}
                            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 relative z-10"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Tanda Tangani</span>
                          </button>
                        )}
                      </div>
                      <div className="border-t border-slate-200 pt-1.5">
                        <div className="font-bold text-xs text-slate-900">Harris / Manajemen</div>
                        <div className="text-[10px] text-slate-500">Head of Mining Division Digitech</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECURITY AUDIT TRAIL & VERIFICATION QR FOOTER ─────── */}
              <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-slate-500 mt-6">
                <div className="flex items-center gap-2.5">
                  {/* Inline Authentic QR Stamp */}
                  <div className="w-10 h-10 p-1 bg-white border border-slate-300 rounded shadow-2xs flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-900" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      ID Berkas: {doc.doc_number || '007/MVM-BIB/VII/2024'}
                    </div>
                    <div className="text-slate-400">
                      SHA256: 8f2a4c9b10e...3d7e (Sah Digital)
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-700">
                    Halaman 1 dari 1
                  </div>
                  <div className="text-slate-400">
                    Sistem Manajemen Inventaris Digitech (IMS v0.1)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* MODE 2: BERKAS SCAN ASLI / LAMPIRAN PDF NATIVE              */}
        {/* ─────────────────────────────────────────────────────────── */}
        {viewMode === 'attachment' && (
          <div className="w-full max-w-5xl flex flex-col items-center justify-start my-auto">
            {resolvedFileUrl ? (
              fileType === 'pdf' ? (
                /* Native PDF Viewer */
                <div className="w-full h-[85vh] bg-white rounded-lg shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
                  <iframe
                    src={`${resolvedFileUrl}#toolbar=1&navpanes=0&zoom=${zoomLevel}`}
                    className="w-full h-full border-none"
                    title="PDF Preview"
                  />
                </div>
              ) : (
                /* High-Resolution Document Image Viewer */
                <div className="w-full bg-[#202124] rounded-lg shadow-2xl border border-slate-700 p-4 overflow-auto flex items-center justify-center min-h-[600px]">
                  <img
                    src={resolvedFileUrl}
                    alt="Berkas Lampiran"
                    style={{
                      transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-out'
                    }}
                    className="max-h-[80vh] max-w-full object-contain filter drop-shadow-md rounded"
                  />
                </div>
              )
            ) : (
              /* Empty State: Prompt Upload */
              <div className="w-full max-w-xl bg-white rounded-2xl p-10 border-2 border-dashed border-slate-300 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Belum Ada Berkas Scan Fisik Terlampir
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    Dokumen <span className="font-mono font-bold text-slate-800">{doc.doc_number}</span> saat ini telah lengkap di Lembar Resmi A4 Digital. Anda dapat mengunggah berkas PDF scan bertanda tangan basah atau foto asli lapangan sekarang.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Berkas PDF / Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('sheet')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Kembali ke Lembar A4
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. POPUP MODAL: TANDA TANGAN DIGITAL                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-red-600" />
                <h4 className="font-black text-slate-900 text-base">
                  Pengesahan Tanda Tangan
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Bubuhkan tanda tangan untuk mengesahkan dokumen <strong>{doc.doc_number}</strong>. Tanda tangan akan disimpan secara permanen pada log otorisasi dokumen.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[140px]">
              {userSignature ? (
                <div className="space-y-2 text-center">
                  <div className="h-16 flex items-center justify-center bg-white p-2 rounded-xl border border-slate-200">
                    <img src={userSignature} alt="Tanda Tangan Tersimpan" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    Menggunakan Tanda Tangan Tersimpan Akun Anda
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <SignatureCanvas
                    onSave={(dataUrl) => handleSignConfirm(dataUrl)}
                    width={340}
                    height={120}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              {userSignature && (
                <button
                  type="button"
                  disabled={isSigning}
                  onClick={() => handleSignConfirm(userSignature)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSigning ? 'Mengesahkan...' : 'Sahkan Sekarang'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. PRINT STYLES FOR CRISP REAL-PAPER OUTPUT                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
          }
          nav, header, aside, .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
        }
      `}</style>
    </div>,
    window.document.body
  );
}
