import React, { useState, useRef, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { uploadProjectDocumentAttachment, signProjectDocument } from '../../api/projectInventoryApi';
import SignatureCanvas from './SignatureCanvas';

/**
 * FullDocumentPreviewModal
 * 
 * Full-screen / expansive document previewer supporting:
 * 1. Mode "Lembar Resmi Digital (KOP Surat Digitech)":
 *    - Standardized official corporate header (PT Digitech Kharisma Indonesia)
 *    - Complete item / equipment breakdown with serial numbers
 *    - Official legal authorization blocks
 * 2. Mode "Berkas PDF / Lampiran Gambar Asli":
 *    - Embedded PDF reader or interactive high-res image viewer
 *    - Zoom in/out, fit width, rotate, download, and print
 *    - Drag & drop file upload to persist PDFs / images directly to the server & database
 * 3. Digital Signatures:
 *    - One-click or drawn digital sign without displaying person names inside the signature stamp box
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
      // If doc has a real file_url or file_data, default to attachment if user prefers
      if (initialDoc.file_url || initialDoc.file_data) {
        setViewMode('attachment');
      } else {
        setViewMode('sheet');
      }
      setZoomLevel(100);
      setRotation(0);
    }
  }, [initialDoc]);

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

  // Handle Zoom In / Out
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 200));
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
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
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
      }
    };

    reader.readAsDataURL(file);
  };

  // Handle Digital Signing (1-Click or Stamped)
  const handleSignConfirm = async (signatureDataUrl) => {
    setIsSigning(true);
    try {
      const sigPayload = {
        signature_image: signatureDataUrl || userSignature,
        signer_name: currentUser?.full_name || 'Staff Lapangan',
        signer_role: currentUser?.role || 'Staff',
        slot: 'slot1',
        x_percent: 50,
        y_percent: 85
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

  // Mock / Default Material Items for Detailed Sheet
  const sampleItems = doc.items || [
    { no: 1, name: 'Sensor Loadcell 50T Double Ended Shear Beam', sn: 'LC-50T-2026-081', qty: 4, unit: 'Unit', cond: 'Baru / Terkalibrasi' },
    { no: 2, name: 'Mounting Base Platform AX920 Heavy Duty', sn: 'AX920-BASE-04', qty: 2, unit: 'Set', cond: 'Baru' },
    { no: 3, name: 'Kabel Shielded Polyurethane High Temp 15M', sn: 'CBL-SHLD-15M-09', qty: 8, unit: 'Roll', cond: 'Baru' },
    { no: 4, name: 'Junction Box IP68 Stainless Steel 4-Channel', sn: 'JB-IP68-SS-02', qty: 2, unit: 'Unit', cond: 'Baru' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        ref={modalContainerRef}
        className={`bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 flex flex-col transition-all overflow-hidden my-auto ${
          isFullscreen ? 'fixed inset-0 rounded-none max-w-none h-full z-50' : 'max-h-[94vh]'
        }`}
      >
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HEADER BAR: METADATA & QUICK ACTIONS                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-white border-b border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase">
                  Tahap #{doc.stage_number || 5} • {doc.stage_code}
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                  {doc.doc_number}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  doc.status === 'Approved' || doc.status === 'Completed' || doc.status === 'Certified'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {doc.status || 'Active'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug truncate max-w-xl">
                {doc.title}
              </h3>
            </div>
          </div>

          {/* Mode Switcher & Tools */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* View Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === 'sheet'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-red-600" />
                <span>Lembar Resmi Digital</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('attachment')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === 'attachment'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Berkas PDF / Scan</span>
                {hasAttachment && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="Unggah berkas fisik PDF atau Gambar untuk disimpan ke database"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Menyimpan...' : 'Upload Berkas'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Print & Download Buttons */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Cetak Lembar Dokumen"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Unduh Berkas Salinan"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upload Notification Toast */}
        {uploadToast && (
          <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center animate-fade-in flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{uploadToast}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TOOLBAR CONTROLS (FOR ATTACHMENT VIEW)                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {viewMode === 'attachment' && (
          <div className="flex items-center justify-between px-6 py-2 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-600 truncate">
              <span className="font-bold text-slate-800">Lampiran:</span>
              <span className="truncate max-w-sm">{doc.file_attachment || 'Berkas Dokumen'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 uppercase font-bold text-slate-700">
                {fileType.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Perkecil (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold text-slate-700 text-[11px] min-w-[42px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Perbesar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer ml-1"
                title="Putar 90 Derajat"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[10px] transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MAIN VIEWER CONTAINER                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 min-h-[500px] flex justify-center">

          {/* ─────────────────────────────────────────────────────────── */}
          {/* MODE 1: LEMBAR RESMI DIGITAL (KOP STANDAR DIGITECH)        */}
          {/* ─────────────────────────────────────────────────────────── */}
          {viewMode === 'sheet' && (
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border border-slate-200/90 p-8 sm:p-12 space-y-6 text-slate-800">
              
              {/* Corporate Kop Surat PT Digitech Kharisma Indonesia */}
              <div className="border-b-2 border-red-700 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-black text-2xl shadow-md">
                      D
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl font-black text-red-700 tracking-tight">
                        PT DIGITECH KHARISMA INDONESIA
                      </h1>
                      <div className="text-[11px] font-bold text-slate-700 tracking-wide">
                        MINING AUTOMATION, WEIGH-IN-MOTION &amp; TELEMATICS DIVISION
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Operational Site: KM 14 Pit Sebamban • Head Office: Jakarta Selatan, Indonesia
                      </div>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-mono text-slate-400">DIGITECH IMS CERTIFIED</div>
                    <div className="text-xs font-mono font-bold text-slate-800">ISO 9001:2015 Compliant</div>
                    <div className="text-[10px] font-mono text-emerald-700 font-bold">DIGITAL AUDIT SYSTEM</div>
                  </div>
                </div>

                {/* Double Official Line */}
                <div className="mt-3 border-t-2 border-red-700 pt-0.5">
                  <div className="border-t border-red-400" />
                </div>
              </div>

              {/* Document Title & Reference Block */}
              <div className="text-center space-y-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                  LEMBAR RESMI {doc.stage_name ? doc.stage_name.toUpperCase() : 'VERIFIKASI & OTORISASI KEGIATAN'}
                </h2>
                <div className="font-mono text-xs font-bold text-red-700">
                  NO. REGISTRASI: {doc.doc_number}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Workspace Proyek: <span className="font-bold text-slate-800">{doc.project_code || 'WIM / FAMOUS'}</span> • Diterbitkan: <span className="font-bold text-slate-800">{doc.created_date}</span>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Judul Kegiatan / Berita Acara:</div>
                  <div className="font-bold text-slate-900 mt-0.5">{doc.title}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Tahapan Siklus Proyek:</div>
                  <div className="font-bold text-red-700 mt-0.5">Tahap #{doc.stage_number || 5} — {doc.stage_name || doc.stage_code}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Penanggung Jawab / Pemohon:</div>
                  <div className="font-bold text-slate-800 mt-0.5">{doc.creator_name || 'Staff Lapangan'} ({doc.creator_role || 'Teknisi'})</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Masa Berlaku / Tenggat Waktu:</div>
                  <div className="font-bold text-slate-800 mt-0.5">{doc.due_date || 'Permanen / Terarsip'}</div>
                </div>
              </div>

              {/* Ringkasan & Ruang Lingkup */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Ruang Lingkup &amp; Dasar Pelaksanaan:</span>
                </label>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-sans shadow-2xs">
                  {doc.summary || 'Kajian dan verifikasi material lapangan sesuai kontrak pengadaan dan standar operasi Digitech.'}
                </div>
              </div>

              {/* Tabel Rincian Material & Serial Number */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-red-600" />
                    <span>Daftar Material, Komponen &amp; Serial Number:</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    Total: {sampleItems.length} Komponen
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-center w-10">No</th>
                        <th className="py-2 px-3">Nama Part / Deskripsi Item</th>
                        <th className="py-2 px-3">Part Number / Serial Number</th>
                        <th className="py-2 px-3 text-center">Jumlah</th>
                        <th className="py-2 px-3 text-center">Satuan</th>
                        <th className="py-2 px-3 text-center">Kondisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sampleItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center font-mono text-slate-500">{item.no || idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-700">{item.sn}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">{item.qty}</td>
                          <td className="py-2 px-3 text-center text-slate-500">{item.unit}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.cond}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Syarat & Ketentuan Teknis Lapangan */}
              <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl text-[11px] text-red-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Pernyataan Kepatuhan Proyek:</strong> Seluruh komponen yang tertera di atas telah diperiksa fisik, nomor seri, dan fungsi operasionalnya. Setiap pemindahan, instalasi, atau afkir wajib disertai lembar pengesahan sah ini.
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* KOLOM PENGESAHAN TANDA TANGAN (TANPA NAMA DALAM KOTAK DRAG)*/}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="pt-4 border-t-2 border-slate-200">
                <div className="text-center font-mono font-bold text-xs uppercase text-slate-700 mb-3">
                  LEMBAR PENGESAHAN &amp; TANDA TANGAN OTORISASI
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  
                  {/* Kolom 1: Pemohon / Teknisi Lapangan */}
                  <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 flex flex-col justify-between min-h-[160px]">
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-500 border-b border-slate-200 pb-1">
                      Diajukan Oleh (Teknisi Lapangan)
                    </div>

                    <div className="flex-1 flex items-center justify-center my-2">
                      {/* Clean Vector Signature Ink Only */}
                      <div className="h-16 flex items-center justify-center">
                        <svg viewBox="0 0 120 40" className="w-28 h-10 text-red-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 28 C 25 10, 35 35, 45 15 C 55 -5, 60 38, 75 22 C 85 10, 95 30, 110 20 M30 25 L90 24" />
                        </svg>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-1.5">
                      <div className="font-bold text-xs text-slate-900">{doc.creator_name || 'Rayhans Najib Al-Faruq'}</div>
                      <div className="text-[10px] text-slate-500">{doc.creator_role || 'Teknisi WIM & Telematika'}</div>
                    </div>
                  </div>

                  {/* Kolom 2: Diperiksa Oleh (Supervisor Site) */}
                  <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 flex flex-col justify-between min-h-[160px]">
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-500 border-b border-slate-200 pb-1">
                      Diperiksa Oleh (Supervisor Site)
                    </div>

                    <div className="flex-1 flex items-center justify-center my-2">
                      <div className="h-16 flex items-center justify-center">
                        <svg viewBox="0 0 120 40" className="w-28 h-10 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 15 C 30 35, 45 5, 60 25 C 75 8, 90 32, 105 18 M20 28 L95 28" />
                        </svg>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-1.5">
                      <div className="font-bold text-xs text-slate-900">Zainal Fahriandy</div>
                      <div className="text-[10px] text-slate-500">Supervisor Operasional VGT</div>
                    </div>
                  </div>

                  {/* Kolom 3: Otorisasi Manajemen Digitech */}
                  <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 flex flex-col justify-between min-h-[160px]">
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-500 border-b border-slate-200 pb-1">
                      Otorisasi Sah (Digitech Pusat)
                    </div>

                    <div className="flex-1 flex items-center justify-center my-2">
                      {doc.signatures_count >= (doc.required_signatures || 2) ? (
                        <div className="flex flex-col items-center justify-center">
                          <svg viewBox="0 0 120 40" className="w-28 h-10 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22 C 28 8, 42 36, 58 12 C 72 -2, 85 36, 102 16 M25 24 L85 24" />
                          </svg>
                          <div className="text-[9px] font-mono font-bold text-emerald-700 mt-0.5">
                            ✓ TERVERIFIKASI
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsSignModalOpen(true)}
                          className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
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
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* MODE 2: BERKAS PDF / LAMPIRAN GAMBAR ASLI                  */}
          {/* ─────────────────────────────────────────────────────────── */}
          {viewMode === 'attachment' && (
            <div className="w-full flex flex-col items-center justify-start space-y-4">
              
              {resolvedFileUrl ? (
                fileType === 'pdf' ? (
                  /* PDF Embedded Reader */
                  <div className="w-full max-w-5xl h-[700px] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
                    <iframe
                      src={`${resolvedFileUrl}#toolbar=1&navpanes=0&zoom=${zoomLevel}`}
                      className="w-full h-full border-none"
                      title="PDF Preview"
                    />
                  </div>
                ) : (
                  /* High-Resolution Image Viewer with Zoom & Pan */
                  <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg border border-slate-200 p-4 overflow-auto flex items-center justify-center min-h-[550px]">
                    <img
                      src={resolvedFileUrl}
                      alt="Berkas Lampiran"
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease-out'
                      }}
                      className="max-h-[650px] max-w-full object-contain filter drop-shadow-md rounded-lg"
                    />
                  </div>
                )
              ) : (
                /* Empty State: Prompt Upload */
                <div className="w-full max-w-2xl bg-white rounded-3xl p-10 border-2 border-dashed border-red-200 text-center space-y-4 my-auto shadow-sm">
                  <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Belum Ada Salinan Berkas Fisik Terlampir
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                      Dokumen <span className="font-mono font-bold text-slate-800">{doc.doc_number}</span> ini telah tercatat secara digital. Anda dapat mengunggah berkas PDF resmi atau scan foto dokumen sekarang untuk disimpan ke database.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/20 cursor-pointer inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Pilih Berkas PDF / Gambar dari Komputer</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FOOTER BAR: AUDIT TRAIL & STATUS                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tersimpan di Database &amp; Server IMS: </span>
            <span className="font-bold text-slate-800">
              {doc.file_attachment ? `[ ${doc.file_attachment} ]` : 'Lembar Data Digital'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
            >
              Tutup Pratinjau
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* POPUP MODAL: TANDA TANGAN DIGITAL                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
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
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bubuhkan tanda tangan untuk mengesahkan dokumen <strong>{doc.doc_number}</strong>. Tanda tangan akan disimpan secara permanen pada log otorisasi dokumen.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[140px]">
              {userSignature ? (
                <div className="space-y-2 text-center">
                  <div className="h-16 flex items-center justify-center bg-white p-2 rounded-xl border border-slate-200">
                    <img src={userSignature} alt="Tanda Tangan Tersimpan" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    ✓ Menggunakan Tanda Tangan Tersimpan Akun Anda
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

    </div>
  );
}
