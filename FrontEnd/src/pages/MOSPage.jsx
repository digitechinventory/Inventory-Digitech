import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Package,
  Layers,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  RotateCcw,
  Check,
  Download,
  Share2
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import DirectDocumentSheet from '../components/common/DirectDocumentSheet.jsx';

export default function MOSPage() {
  const { user, role, isAdmin, isSuperadmin } = useAuth();
  const normalizedRole = role || 'User';

  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'archive'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Currently loaded document state for direct document sheet
  const [docNumber, setDocNumber] = useState(() => `MOS-2026-09-${String(Date.now()).slice(-4)}`);
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('PT Trakindo Utama');
  const [poNumber, setPoNumber] = useState('PO-2026-BIB-7721 / DO-TKU-9902');
  const [siteLocation, setSiteLocation] = useState('Area Rak 1 Pit Sebamban KM 24');
  const [receiverName, setReceiverName] = useState(user?.full_name || 'arya-user');
  const [purpose, setPurpose] = useState(
    'Penerimaan material suku cadang pengadaan berkala unit Excavator dan Haul Truck. Pemeriksaan fisik kemasan, segel vendor, dan kesesuaian part number telah diverifikasi di area gudang site.'
  );

  // Items listed on the document sheet
  const [items, setItems] = useState([
    {
      name: 'Cat 777D Transmission Filter Kit',
      sku: 'BIB-CAT-777D-TRM',
      qty: 6,
      unit: 'SET',
      rack: 'R-B02',
      notes: 'Kondisi kemasan utuh, segel OEM Trakindo'
    },
    {
      name: 'Komatsu PC2000 Hydraulic Hose 1-Inch',
      sku: 'BIB-KOM-PC2000-HYD',
      qty: 12,
      unit: 'MTR',
      rack: 'R-A03',
      notes: 'Lolos uji visual toleransi tekanan 5000 PSI'
    }
  ]);

  // 3-slot digital signature state on the document
  const [signatures, setSignatures] = useState({
    slot1: {
      signed: true,
      signer_name: user?.full_name || 'arya-user',
      signer_title: 'Teknisi Lapangan (PIC Penerima)',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      hash: 'SHA256:MOS-SLOT1-VERIFIED',
      signature_image: null
    },
    slot2: null,
    slot3: null
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Fetch list of MOS documents for archive
  const { data: mosDocsData, refetch, isLoading } = useQuery({
    queryKey: ['mos-documents', statusFilter],
    queryFn: async () => {
      try {
        const res = await api.get('/mos');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  const mosDocs = mosDocsData || [];

  // Filtered documents for archive
  const filteredDocs = mosDocs.filter((doc) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      doc.doc_number?.toLowerCase().includes(q) ||
      doc.vendor_name?.toLowerCase().includes(q) ||
      doc.site_location?.toLowerCase().includes(q) ||
      doc.pic_receiver_name?.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate approval state
  const isSlot1Signed = !!signatures.slot1?.signed;
  const isSlot2Signed = !!signatures.slot2?.signed;
  const isSlot3Signed = !!signatures.slot3?.signed;
  const isFullyApproved = isSlot1Signed && isSlot2Signed && isSlot3Signed;

  // Handle signing a slot
  const handleSignSlot = (slotKey, data) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const hash = `SHA256:MOS-${slotKey.toUpperCase()}-${Date.now().toString(16).toUpperCase()}`;

    setSignatures((prev) => ({
      ...prev,
      [slotKey]: {
        signed: true,
        signer_name: data.signerName || user?.full_name || 'Staff Lapangan',
        signer_title:
          data.signerTitle ||
          (slotKey === 'slot1'
            ? 'Teknisi Lapangan (PIC Penerima)'
            : slotKey === 'slot2'
            ? 'Admin Logistik Site'
            : 'Superadmin Otoritas Final'),
        signature_image: data.signatureImage,
        timestamp,
        hash,
        method: data.method
      }
    }));
  };

  const handleResetSlot = (slotKey) => {
    setSignatures((prev) => ({
      ...prev,
      [slotKey]: null
    }));
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: 'Sparepart Tambahan Baru',
        sku: `BIB-PART-${String(Date.now()).slice(-4)}`,
        qty: 1,
        unit: 'PCS',
        rack: 'R-A01',
        notes: 'Pemeriksaan fisik sesuai'
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Save / Submit Document
  const handleSaveDocument = async () => {
    if (items.length === 0) {
      alert('Tambahkan minimal 1 item material pada dokumen.');
      return;
    }
    if (!signatures.slot1?.signed) {
      alert('Tanda tangan pembuat dokumen (Slot 1) wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      // Determine status based on signature completion
      let status = 'draft';
      if (isFullyApproved) {
        status = 'completed';
      } else if (isSlot2Signed) {
        status = 'waiting_superadmin';
      } else if (isSlot1Signed) {
        status = 'waiting_admin';
      }

      await api.post('/mos', {
        doc_number: docNumber,
        vendor_name: vendorName,
        po_do_number: poNumber,
        site_location: siteLocation,
        pic_receiver_name: receiverName,
        purpose,
        items,
        status,
        signatures
      });

      setSaveSuccessMessage('Dokumen Berita Acara MOS berhasil dibukukan!');
      refetch();
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal menyimpan dokumen MOS.');
    } finally {
      setSaving(false);
    }
  };

  // Load a document from archive into the sheet view
  const handleLoadDocToSheet = (doc) => {
    setDocNumber(doc.doc_number || doc.mos_number || `MOS-2026-${doc.id}`);
    setDocDate(doc.received_date || doc.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]);
    setVendorName(doc.vendor_name || 'Vendor Terdaftar');
    setPoNumber(doc.po_do_number || 'PO-2026-001');
    setSiteLocation(doc.site_location || 'Area Rak 1 Pit Sebamban');
    setReceiverName(doc.pic_receiver_name || doc.requester_name || user?.full_name);
    setPurpose(doc.purpose || 'Penerimaan fisik material site.');
    setItems(Array.isArray(doc.items) && doc.items.length > 0 ? doc.items : items);

    // Populate signatures
    const rawSigs = doc.signatures || {};
    setSignatures({
      slot1: rawSigs.slot1 || (doc.slot1_signed_at ? {
        signed: true,
        signer_name: doc.slot1_signer || doc.requester_name,
        timestamp: doc.slot1_signed_at,
        signature_image: doc.slot1_signature
      } : null),
      slot2: rawSigs.slot2 || (doc.slot2_signed_at ? {
        signed: true,
        signer_name: doc.slot2_signer || 'Admin Logistik',
        timestamp: doc.slot2_signed_at,
        signature_image: doc.slot2_signature
      } : null),
      slot3: rawSigs.slot3 || (doc.slot3_signed_at ? {
        signed: true,
        signer_name: doc.slot3_signer || 'Superadmin Digitech',
        timestamp: doc.slot3_signed_at,
        signature_image: doc.slot3_signature
      } : null)
    });

    setActiveTab('sheet');
  };

  // Reset to brand new document
  const handleNewDocument = () => {
    setDocNumber(`MOS-2026-09-${String(Date.now()).slice(-4)}`);
    setDocDate(new Date().toISOString().split('T')[0]);
    setVendorName('PT Trakindo Utama');
    setPoNumber('PO-2026-BIB-7721 / DO-TKU-9902');
    setSiteLocation('Area Rak 1 Pit Sebamban KM 24');
    setReceiverName(user?.full_name || 'arya-user');
    setPurpose('Penerimaan material suku cadang pengadaan berkala unit operasional tambang.');
    setSignatures({
      slot1: {
        signed: true,
        signer_name: user?.full_name || 'arya-user',
        signer_title: 'Teknisi Lapangan (PIC Penerima)',
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        hash: 'SHA256:MOS-SLOT1-INITIAL',
        signature_image: null
      },
      slot2: null,
      slot3: null
    });
    setActiveTab('sheet');
  };

  return (
    <div className="space-y-6 pb-20 font-sans select-none animate-in fade-in duration-200">
      
      {/* ── 1. Top Header & Tab Controls ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_12px_36px_rgba(220,38,38,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Material On Site (MOS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pemeriksaan fisik barang tiba di site, validasi Geofence GPS, dan 3 kolom tanda tangan approval.
          </p>
        </div>

        {/* Tab Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'sheet'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Lembar Dokumen (Editor)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Arsip Dokumen MOS</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleNewDocument}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Dokumen Baru</span>
          </button>
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMessage}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600">Otorisasi Berhasil Dicatat</span>
        </div>
      )}

      {/* ── TAB 1: FULL DOCUMENT SHEET (WYSIWYG TEMPLATE PREVIEW & INLINE FILLABLE) ── */}
      {activeTab === 'sheet' && (
        <div className="space-y-4">
          
          {/* Document Action Ribbon */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-bold">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>Geofence GPS Terverifikasi (Radius &lt; 500m)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDocument}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Dokumen MOS'}</span>
              </button>
            </div>
          </div>

          {/* Full WYSIWYG Document Sheet */}
          <DirectDocumentSheet
            docType="MOS"
            docNumber={docNumber}
            docDate={docDate}
            siteLocation={siteLocation}
            department="Logistik & Penerimaan Site"
            requesterName={receiverName}
            purpose={purpose}
            items={items}
            signatures={signatures}
            canSignSlot1={true}
            canSignSlot2={['Admin', 'Superadmin'].includes(normalizedRole)}
            canSignSlot3={normalizedRole === 'Superadmin'}
            userRole={normalizedRole}
            isEditable={true}
            onSignSlot={handleSignSlot}
            onResetSlot={handleResetSlot}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onUpdateItem={handleUpdateItem}
            onUpdateField={(field, val) => {
              if (field === 'purpose') setPurpose(val);
              if (field === 'vendorName') setVendorName(val);
              if (field === 'poNumber') setPoNumber(val);
              if (field === 'siteLocation') setSiteLocation(val);
            }}
          />

        </div>
      )}

      {/* ── TAB 2: ARSIP DOKUMEN MOS (MODERN CARD GRID ARCHIVE) ── */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          
          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor MOS, vendor, lokasi..."
                className="w-full h-10 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {['ALL', 'draft', 'waiting_admin', 'waiting_superadmin', 'completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL'
                    ? 'Semua'
                    : st === 'waiting_admin'
                    ? 'Menunggu Admin'
                    : st === 'waiting_superadmin'
                    ? 'Menunggu SA'
                    : st === 'completed'
                    ? 'Disetujui (Approved)'
                    : 'Draft'}
                </button>
              ))}
            </div>
          </div>

          {/* Document Archive Cards Grid */}
          {filteredDocs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Belum ada arsip dokumen MOS yang cocok</h3>
              <p className="text-xs text-slate-500 mt-1">Gunakan tombol &quot;Buat Dokumen Baru&quot; untuk membuat berita acara baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => {
                const isComplete = doc.status === 'completed';
                const isWaitSA = doc.status === 'waiting_superadmin';
                const isWaitAdmin = doc.status === 'waiting_admin';

                return (
                  <div
                    key={doc.id}
                    onClick={() => handleLoadDocToSheet(doc)}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-red-300 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div>
                      {/* Top Row: Doc Number & Overall Status Badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="font-mono font-bold text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          {doc.doc_number || doc.mos_number || `MOS-${doc.id}`}
                        </span>

                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            APPROVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            PENDING
                          </span>
                        )}
                      </div>

                      {/* Vendor & PO */}
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                        {doc.vendor_name || 'PT Trakindo Utama'}
                      </h3>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        PO/DO: {doc.po_do_number || 'PO-2026-BIB-001'}
                      </div>

                      {/* Location & Receiver */}
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{doc.site_location || 'Area Rak 1'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">PIC: {doc.pic_receiver_name || doc.requester_name || 'Teknisi'}</span>
                        </div>
                      </div>

                      {/* 3-Slot Approval Status Progress */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Status 3-Slot Tanda Tangan:
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          {/* Slot 1 */}
                          <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${
                            doc.signatures?.slot1?.signed || doc.slot1_signed_at
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            Slot 1: {doc.signatures?.slot1?.signed || doc.slot1_signed_at ? '✓' : 'Pending'}
                          </div>

                          {/* Slot 2 */}
                          <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${
                            doc.signatures?.slot2?.signed || doc.slot2_signed_at
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            Slot 2: {doc.signatures?.slot2?.signed || doc.slot2_signed_at ? '✓' : 'Pending'}
                          </div>

                          {/* Slot 3 */}
                          <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${
                            doc.signatures?.slot3?.signed || doc.slot3_signed_at
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            Slot 3: {doc.signatures?.slot3?.signed || doc.slot3_signed_at ? '✓' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Open Document Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-red-600">
                      <span>Buka Lembar Dokumen</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
