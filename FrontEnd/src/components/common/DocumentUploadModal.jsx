import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileCheck,
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Building2,
  Calendar,
  Package,
  Plus
} from 'lucide-react';
import api from '../../api/client.js';

/**
 * DocumentUploadModal
 * 
 * Supports:
 * 1. Uploading approval documents from local PC (PDF or Image), auto-converting
 *    to rendered page sheets and detecting Portrait or Landscape orientation.
 * 2. Creating documents from the 3 official templates:
 *    - 001_VGT_MOS: Material On Site
 *    - 005_VGT_MDT: Material Dismantling
 *    - 006_VGT_MRP: Material Replacement
 */
export default function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('local'); // 'local' | 'template'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Local Upload State ──
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [orientation, setOrientation] = useState('landscape');
  const [convertedPages, setConvertedPages] = useState([]);
  const [localDocNumber, setLocalDocNumber] = useState('');
  const [localDocTitle, setLocalDocTitle] = useState('');
  const [localSite, setLocalSite] = useState('Office VGT');
  const [localPurpose, setLocalPurpose] = useState('');

  // ── Template Selection State ──
  const [selectedTemplate, setSelectedTemplate] = useState('MOS'); // 'MOS' | 'MDT' | 'MRP'
  const [tplDocNumber, setTplDocNumber] = useState('');
  const [tplSite, setTplSite] = useState('');
  const [tplReceiver, setTplReceiver] = useState(currentUser?.full_name || 'Rayhans Najib Al-Faruq');
  const [tplDate, setTplDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle local file picking
  const handleLocalFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSelectedFile(file);
    setFileName(file.name);
    setLoading(true);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setFileType(isPdf ? 'pdf' : 'image');

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    if (!localDocTitle) setLocalDocTitle(cleanTitle);

    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
    const year = new Date().getFullYear();
    if (!localDocNumber) {
      setLocalDocNumber(`${String(Math.floor(Math.random() * 800) + 100).padStart(3, '0')}/VGT/DOC/MNTOA/BIBOA/${monthRoman}/${year}`);
    }

    try {
      if (isPdf) {
        // Convert PDF via backend service
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Pdf = reader.result;
            const res = await api.post('/mos/convert-pdf', {
              pdf: base64Pdf,
              max_pages: 8
            });

            const data = res.data?.data;
            if (data?.pages?.length > 0) {
              setConvertedPages(data.pages);
              setOrientation(data.orientation || 'landscape');
            } else {
              throw new Error('Tidak ada halaman PDF yang berhasil diekstrak.');
            }
          } catch (err) {
            setErrorMsg(err.response?.data?.error?.message || err.message || 'Gagal memproses PDF lokal.');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Image file (PNG / JPG / WEBP)
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const isLandscape = img.width >= img.height;
            setOrientation(isLandscape ? 'landscape' : 'portrait');
            setConvertedPages([
              {
                page_index: 0,
                width: img.width,
                height: img.height,
                is_landscape: isLandscape,
                image_data: reader.result
              }
            ]);
            setLoading(false);
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setErrorMsg('Gagal membaca file: ' + err.message);
      setLoading(false);
    }
  };

  // Submit custom local uploaded document
  const handleSubmitLocalDoc = async (e) => {
    e.preventDefault();
    if (convertedPages.length === 0) {
      setErrorMsg('Silakan pilih file PDF atau Gambar dokumen terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        template_type: 'CUSTOM',
        doc_number: localDocNumber,
        title: localDocTitle || 'Dokumen Approval Lapangan',
        subtitle: `Diupload dari PC oleh ${currentUser?.full_name || 'User'}`,
        site_location: localSite,
        pic_receiver_name: currentUser?.full_name || 'Staff Lapangan',
        purpose: localPurpose || 'Approval dan otorisasi dokumen kerja lapangan.',
        orientation,
        pages: convertedPages,
        items: []
      };

      const res = await api.post('/mos', payload);
      onSuccess?.(res.data?.data);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Gagal mengunggah dokumen.');
    } finally {
      setLoading(false);
    }
  };

  // Submit template-based document (MOS, MDT, MRP)
  const handleSubmitTemplateDoc = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
      const year = new Date().getFullYear();

      let defaultDocNum = '';
      let defaultTitle = '';
      let defaultSiteVal = tplSite || 'Office VGT';

      if (selectedTemplate === 'MOS') {
        defaultDocNum = tplDocNumber || `001/VGT/MOS/MNTOA/BIBOA/${monthRoman}/${year}`;
        defaultTitle = 'MATERIAL ON SITE';
        defaultSiteVal = tplSite || 'Office VGT';
      } else if (selectedTemplate === 'MDT') {
        defaultDocNum = tplDocNumber || `005/VGT/MDT/MNTOA/BIBOA/${monthRoman}/${year}`;
        defaultTitle = 'MATERIAL DISMANTLING';
        defaultSiteVal = tplSite || 'WIM KM 13';
      } else if (selectedTemplate === 'MRP') {
        defaultDocNum = tplDocNumber || `006/VGT/MRP/MNTOA/BIBOA/${monthRoman}/${year}`;
        defaultTitle = 'MATERIAL REPLACEMENT';
        defaultSiteVal = tplSite || 'WIM KM 13';
      }

      // Fetch template definition
      const tplRes = await api.get('/mos/templates');
      const tplData = tplRes.data?.data?.[selectedTemplate] || {};

      const payload = {
        template_type: selectedTemplate,
        doc_number: defaultDocNum,
        title: defaultTitle,
        subtitle: tplData.subtitle || '',
        site_location: defaultSiteVal,
        pic_receiver_name: tplReceiver || currentUser?.full_name || 'Rayhans Najib Al-Faruq',
        received_date: tplDate,
        po_do_number: '-',
        package_condition: tplData.defaultCondition || 'Baik',
        orientation: 'landscape',
        items: tplData.defaultItems || []
      };

      const res = await api.post('/mos', payload);
      onSuccess?.(res.data?.data);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Gagal membuat dokumen template.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tambah Dokumen Approval ke Waiting List
              </h3>
              <p className="text-xs text-slate-500">
                Pilih unggah dokumen dari komputer lokal atau gunakan template resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/40">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'local'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Upload dari PC (PDF / Gambar)</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'template'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Gunakan Template Resmi (MOS / MDT / MRP)</span>
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ════════ TAB 1: UPLOAD LOCAL FILE ════════ */}
          {activeTab === 'local' && (
            <form onSubmit={handleSubmitLocalDoc} className="space-y-4">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-red-500 bg-slate-50/60 hover:bg-red-50/20 rounded-3xl p-6 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleLocalFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-600 group-hover:text-red-600 group-hover:border-red-200 flex items-center justify-center mx-auto mb-2 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {fileName ? fileName : 'Klik untuk mencari dokumen di komputer Anda'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung file PDF resmi, foto Berita Acara, atau scan dokumen
                </p>

                {convertedPages.length > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {convertedPages.length} Halaman Siap
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Format: {orientation.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Document Metadata Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Judul Dokumen Approval:
                  </label>
                  <input
                    type="text"
                    required
                    value={localDocTitle}
                    onChange={(e) => setLocalDocTitle(e.target.value)}
                    placeholder="Contoh: Berita Acara Penerimaan Generator"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    No. Dokumen:
                  </label>
                  <input
                    type="text"
                    required
                    value={localDocNumber}
                    onChange={(e) => setLocalDocNumber(e.target.value)}
                    placeholder="00X/VGT/DOC/MNTOA/BIBOA/..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Lokasi Site:
                  </label>
                  <input
                    type="text"
                    value={localSite}
                    onChange={(e) => setLocalSite(e.target.value)}
                    placeholder="Office VGT / WIM KM 13"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Orientasi Kertas:
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 bg-white"
                  >
                    <option value="landscape">Landscape (Mendatar - Standar Berita Acara)</option>
                    <option value="portrait">Portrait (Tegak - Standar Surat/Formulir)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Keperluan / Catatan Tambahan:
                  </label>
                  <textarea
                    rows={2}
                    value={localPurpose}
                    onChange={(e) => setLocalPurpose(e.target.value)}
                    placeholder="Catatan verifikasi fisik atau tujuan approval dokumen..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || convertedPages.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Masukkan ke Waiting List Dokumen</span>
                </button>
              </div>
            </form>
          )}

          {/* ════════ TAB 2: CHOOSE FROM TEMPLATES ════════ */}
          {activeTab === 'template' && (
            <form onSubmit={handleSubmitTemplateDoc} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 001 - MOS */}
                <div
                  onClick={() => setSelectedTemplate('MOS')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedTemplate === 'MOS'
                      ? 'border-red-600 bg-red-50/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      001_VGT_MOS
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Landscape</span>
                  </div>
                  <div className="text-xs font-black text-slate-900 uppercase">
                    Material On Site
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Verifikasi fisik dan penerimaan material/sparepart baru di area gudang site.
                  </p>
                </div>

                {/* 005 - MDT */}
                <div
                  onClick={() => setSelectedTemplate('MDT')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedTemplate === 'MDT'
                      ? 'border-red-600 bg-red-50/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      005_VGT_MDT
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Landscape</span>
                  </div>
                  <div className="text-xs font-black text-slate-900 uppercase">
                    Material Dismantling
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Pelepasan &amp; pembongkaran loadcell/material dummy atau rusak di site WIM.
                  </p>
                </div>

                {/* 006 - MRP */}
                <div
                  onClick={() => setSelectedTemplate('MRP')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedTemplate === 'MRP'
                      ? 'border-red-600 bg-red-50/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      006_VGT_MRP
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Landscape</span>
                  </div>
                  <div className="text-xs font-black text-slate-900 uppercase">
                    Material Replacement
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Pemasangan dan penggantian material suku cadang baru pada unit site.
                  </p>
                </div>
              </div>

              {/* Template Configurations */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  Parameter Dokumen Template ({selectedTemplate})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      No. Dokumen (Otomatis / Custom):
                    </label>
                    <input
                      type="text"
                      value={tplDocNumber}
                      onChange={(e) => setTplDocNumber(e.target.value)}
                      placeholder={
                        selectedTemplate === 'MOS'
                          ? '001/VGT/MOS/MNTOA/BIBOA/IV/2026'
                          : selectedTemplate === 'MDT'
                          ? '005/VGT/MDT/MNTOA/BIBOA/V/2026'
                          : '006/VGT/MRP/MNTOA/BIBOA/V/2026'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Tanggal Dokumen:
                    </label>
                    <input
                      type="date"
                      value={tplDate}
                      onChange={(e) => setTplDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Lokasi Site:
                    </label>
                    <input
                      type="text"
                      value={tplSite}
                      onChange={(e) => setTplSite(e.target.value)}
                      placeholder={selectedTemplate === 'MOS' ? 'Office VGT' : 'WIM KM 13'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      PIC Penerima / Pekerjaan:
                    </label>
                    <input
                      type="text"
                      value={tplReceiver}
                      onChange={(e) => setTplReceiver(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Dokumen ke Waiting List</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
