import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PackagePlus,
  Plus,
  Clock,
  Layers,
  ShieldCheck,
  FileText,
  Trash2,
  Sparkles,
  PenTool,
  ChevronLeft
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import DocumentWaitingList from '../components/common/DocumentWaitingList.jsx';
import InteractiveDocumentSheet from '../components/common/InteractiveDocumentSheet.jsx';
import SignatureUploadExtractorModal from '../components/common/SignatureUploadExtractorModal.jsx';

export default function MaterialRequestPage() {
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'waiting_list' | 'history' | 'sheet'
  const [selectedMrDoc, setSelectedMrDoc] = useState(null);

  // User transparent signature (Usign background-removed ink PNG)
  const [userSignature, setUserSignature] = useState(() => {
    try {
      return localStorage.getItem(`digitech_signature_${user?.id || 'current_user'}`) || null;
    } catch {
      return null;
    }
  });
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Sync user's transparent signature from backend on mount
  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const res = await api.get('/users/signature');
        if (res.data?.data?.signature) {
          setUserSignature(res.data.data.signature);
          localStorage.setItem(`digitech_signature_${user?.id || 'current_user'}`, res.data.data.signature);
        }
      } catch {}
    };
    if (user?.id) {
      fetchSignature();
    }
  }, [user?.id]);

  // New MR form fields
  const [siteLocation, setSiteLocation] = useState('Pit South Site BIB-02');
  const [department, setDepartment] = useState(user?.department || 'Maintenance & Operasional Pit');
  const [purpose, setPurpose] = useState('Pengambilan suku cadang pemeliharaan berkala unit operasional site');
  const [checkerName, setCheckerName] = useState('Zainal Fahriandy');
  const [approverName, setApproverName] = useState('Harris');
  const [docItems, setDocItems] = useState([
    {
      name: 'Cat 777D Engine Oil Filter',
      sku: 'BIB-CAT-777D-FLTR',
      qty: 4,
      unit: 'PCS',
      rack: 'R-A01',
      notes: 'Penggantian oli 250 jam'
    },
    {
      name: 'Komatsu PC2000 Hydraulic Seal Kit',
      sku: 'BIB-KOM-PC2000-HYD',
      qty: 1,
      unit: 'SET',
      rack: 'R-A02',
      notes: 'Perbaikan silinder boom'
    }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch warehouse catalog for quick-pick
  const { data: invItems = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      try {
        const res = await api.get('/inventory');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  // Fetch Usign approval documents & filter MR documents
  const { data: allApprovalDocs = [], isLoading: docsLoading, refetch: refetchDocs } = useQuery({
    queryKey: ['approval-documents'],
    queryFn: async () => {
      try {
        const res = await api.get('/mos');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  const mrDocs = allApprovalDocs.filter(
    (d) => d.template_type === 'MR' || String(d.doc_number || '').includes('/MR/')
  );
  const pendingMrCount = mrDocs.filter((d) => d.status !== 'completed').length;

  // Fetch completed MR stock movement history
  const { data: ledgerItems = [], refetch: refetchMrHistory } = useQuery({
    queryKey: ['material-requests-history'],
    queryFn: async () => {
      const res = await api.get('/inventory/mr');
      return res.data?.data || [];
    }
  });

  const handleAddItem = () => {
    const defaultItem = invItems?.[0] || {
      name: 'Filter Cadangan Lapangan',
      sku: 'BIB-GEN-SPARE',
      rack: 'R-A01'
    };
    setDocItems((prev) => [
      ...prev,
      {
        name: defaultItem.name || 'Suku Cadang Site',
        sku: defaultItem.sku || 'SKU-NEW',
        qty: 1,
        unit: 'PCS',
        rack: defaultItem.rack || 'R-A01',
        notes: 'Kebutuhan operasional'
      }
    ]);
  };

  const handlePickCatalogItem = (index, sku) => {
    const found = invItems.find((i) => i.sku === sku);
    if (!found) return;
    setDocItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        name: found.name,
        sku: found.sku,
        rack: found.rack || next[index].rack || 'R-A01',
        unit: found.unit || 'PCS'
      };
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setDocItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    setDocItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Submit MR into Usign Waiting List & immediately open Interactive Sheet for drag-drop signature placement
  const handleCreateMrToWaitingList = async (e) => {
    e.preventDefault();
    if (docItems.length === 0) {
      addToast('Tambahkan minimal 1 item material pada dokumen MR.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        template_type: 'MR',
        title: 'MATERIAL REQUEST & PENGELUARAN GUDANG',
        subtitle: 'SURAT PERMINTAAN MATERIAL & PENGAMBILAN SUKU CADANG SITE',
        purpose,
        origin_location: 'Gudang Site / Buffer',
        destination_location: siteLocation,
        site_location: siteLocation,
        department,
        sender_name: user?.full_name || 'Staff Lapangan',
        sender_role: role || 'Teknisi Lapangan',
        approval_maker_name: user?.full_name || 'Staff Lapangan',
        approval_maker_role: role === 'Admin' ? 'Logistik Gudang' : 'Teknisi Lapangan',
        approval_checker_name: checkerName,
        approval_checker_role: 'Supervisor Logistik Site',
        approval_approver_name: approverName,
        approval_approver_role: 'Head of Operation',
        orientation: 'landscape',
        items: docItems.map((it) => ({
          name: it.name,
          item_name: it.name,
          spec: it.sku,
          part_number: it.sku,
          qty_received: Number(it.qty) || 1,
          qty_do: Number(it.qty) || 1,
          unit: it.unit || 'PCS',
          bin_location: it.rack || 'R-A01',
          condition: 'Siap Pakai',
          notes: it.notes || ''
        })),
        signatures_placed: []
      };

      const res = await api.post('/mos', payload);
      const createdDoc = res.data?.data;
      await refetchDocs();
      queryClient.invalidateQueries({ queryKey: ['approval-documents'] });

      addToast(
        'Dokumen MR masuk ke Waiting List. Silakan atur posisi tanda tangan Anda di lokasi nama.',
        'success'
      );

      if (createdDoc) {
        setSelectedMrDoc(createdDoc);
        setActiveTab('sheet');
      } else {
        setActiveTab('waiting_list');
      }
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal mengajukan dokumen MR ke Waiting List.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMrDoc = (doc) => {
    setSelectedMrDoc(doc);
    setActiveTab('sheet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDocumentUpdated = (updatedDoc) => {
    setSelectedMrDoc(updatedDoc);
    refetchDocs();
    refetchMrHistory();
    queryClient.invalidateQueries({ queryKey: ['approval-documents'] });
  };

  return (
    <div className="w-full space-y-5 pb-12 font-sans select-none">

      {/* ── Top Header & Tab Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-red-100 shadow-xs">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            Otorisasi Usign &bull; Waiting List MR
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            Surat Permintaan Material (MR)
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Ajukan material ke Waiting List lalu atur posisi tanda tangan transparan tepat di atas lokasi nama Anda.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 lg:inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-[11px] sm:text-xs font-bold w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 lg:py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Buat MR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('waiting_list')}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 lg:py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'waiting_list' || activeTab === 'sheet'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Waiting List</span>
            {pendingMrCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-mono">
                {pendingMrCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 lg:py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Riwayat</span>
          </button>
        </div>
      </div>

      {/* ── Transparent Signature Registration Card (Required for Usign Flow) ── */}
      {activeTab !== 'sheet' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              userSignature ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}>
              <PenTool className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Spesimen Tanda Tangan Transparan (Usign)
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  userSignature
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {userSignature ? 'SIAP DIGUNAKAN' : 'BELUM TERDAFTAR'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {userSignature
                  ? 'Latar belakang foto tanda tangan telah dihapus otomatis. Siap digeser dan ditempatkan di lokasi nama Anda.'
                  : 'Unggah gambar/PDF tanda tangan Anda. Sistem akan menghapus latar belakang dan mengambil coretan tanda tangannya saja.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            {userSignature && (
              <div className="h-10 w-24 px-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                <img src={userSignature} alt="Tanda tangan transparan" className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                userSignature
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{userSignature ? 'Perbarui TTD' : 'Upload & Hapus Background TTD'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 1: Create MR Document -> Send to Waiting List ── */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateMrToWaitingList} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Draft Pengajuan Material Request (MR)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nomor dokumen dibuat otomatis sesuai standar site dan langsung masuk antrean tanda tangan berjenjang.
              </p>
            </div>
            <span className="self-start sm:self-auto text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Alur: Pemohon &rarr; Admin &rarr; Superadmin
            </span>
          </div>

          {/* Metadata & Approver Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Lokasi Site Tujuan
              </label>
              <input
                type="text"
                value={siteLocation}
                onChange={(e) => setSiteLocation(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Departemen / Divisi
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Nama Pemohon (Slot 1)
              </label>
              <input
                type="text"
                value={user?.full_name || 'Teknisi Lapangan'}
                readOnly
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Diperiksa Oleh (Admin - Slot 2)
              </label>
              <input
                type="text"
                value={checkerName}
                onChange={(e) => setCheckerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Diketahui Oleh (Superadmin - Slot 3)
              </label>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Keperluan / Tujuan Penggunaan
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Requested Material Items Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Material yang Diminta ({docItems.length} Item)
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3">Pilih Katalog / Nama Material</th>
                    <th className="py-2.5 px-3">Part Number / SKU</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-24">Rak</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 space-y-1">
                        {invItems.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => handlePickCatalogItem(idx, e.target.value)}
                            className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-[11px] text-slate-600"
                          >
                            <option value="">-- Pilih dari stok gudang (opsional) --</option>
                            {invItems.slice(0, 40).map((inv) => (
                              <option key={inv.id || inv.sku} value={inv.sku}>
                                {inv.name} ({inv.sku})
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          required
                          className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.sku}
                          onChange={(e) => handleUpdateItem(idx, 'sku', e.target.value)}
                          required
                          className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                          required
                          className="w-16 px-2 py-1 text-center rounded bg-slate-50 border border-slate-200 text-xs font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.rack}
                          onChange={(e) => handleUpdateItem(idx, 'rack', e.target.value)}
                          className="w-20 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleUpdateItem(idx, 'notes', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Setelah masuk Waiting List, Anda akan diarahkan ke lembar dokumen untuk mengatur posisi tanda tangan transparan pada lokasi nama.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Memproses...' : 'Masukkan ke Waiting List & Tanda Tangani'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Tab 2: MR Waiting List (Shared Usign Queue) ── */}
      {activeTab === 'waiting_list' && (
        <DocumentWaitingList
          documents={mrDocs}
          loading={docsLoading}
          currentUser={user}
          userSignature={userSignature}
          onSelectDocument={handleOpenMrDoc}
          onOpenUploadModal={() => setActiveTab('create')}
          onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
        />
      )}

      {/* ── Tab 3: Interactive Usign Drag & Drop Sheet ── */}
      {activeTab === 'sheet' && selectedMrDoc && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('waiting_list')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Waiting List MR</span>
            </button>
            <span className="text-[11px] font-mono text-slate-500">
              Mode Penempatan TTD (Usign): Geser coretan ke lokasi nama Anda
            </span>
          </div>

          <InteractiveDocumentSheet
            documentData={selectedMrDoc}
            currentUser={user}
            userSignature={userSignature}
            onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
            onDocumentUpdated={handleDocumentUpdated}
            onBackToList={() => setActiveTab('waiting_list')}
          />
        </div>
      )}

      {/* ── Tab 4: History & Ledger (MR_OUT) ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600 shrink-0" />
                <span>Riwayat Pengambilan Material (MR_OUT)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tercatat otomatis setelah dokumen MR disetujui lengkap oleh Pemohon, Admin, dan Superadmin
              </p>
            </div>
            <span className="self-start sm:self-auto text-xs font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 shrink-0">
              {ledgerItems?.filter((i) => i.transaction_type === 'MR_OUT' || i.reference_doc_id?.startsWith('MR-') || i.reference_doc_id?.includes('/MR/')).length || 0} Transaksi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ledgerItems && ledgerItems.length > 0 ? (
              ledgerItems
                .filter((i) => i.transaction_type === 'MR_OUT' || i.reference_doc_id?.startsWith('MR-') || i.reference_doc_id?.includes('/MR/'))
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-red-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          {item.reference_doc_id || `MR-2026-00${idx + 1}`}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          {item.qty_change} PCS
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.item_name}</h4>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">Part: {item.part_number || '-'}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                        <span>Rak: <strong className="font-mono text-slate-800">{item.bin_location || 'R-A01'}</strong></span>
                        <span>•</span>
                        <span>PIC: <strong>{item.performed_by || 'Teknisi'}</strong></span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>Waktu Pengambilan</span>
                      <span>{item.created_at?.slice(0, 16).replace('T', ' ') || 'Hari ini'}</span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Belum ada riwayat mutasi pengambilan barang tercatat.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── User Transparent Signature Upload & Background Removal Modal ── */}
      <SignatureUploadExtractorModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(newSigDataUrl) => {
          setUserSignature(newSigDataUrl);
          addToast('Tanda tangan transparan berhasil disimpan untuk pengesahan Usign.', 'success');
        }}
        currentUser={user}
      />
    </div>
  );
}
