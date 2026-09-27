import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PackagePlus,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  ArrowRight,
  ShieldCheck,
  Package,
  FileText,
  Printer,
  Sparkles,
  ChevronRight,
  Eye,
  Check
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import DirectDocumentSheet from '../components/common/DirectDocumentSheet.jsx';

export default function MaterialRequestPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('document'); // 'document' | 'history'
  
  // Document state for direct interaction
  const [docNumber, setDocNumber] = useState(() => `MR-2026-${String(Date.now()).slice(-4)}`);
  const [docDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [siteLocation, setSiteLocation] = useState('Pit South Site BIB-02');
  const [department, setDepartment] = useState('Maintenance & Operasional Pit');
  const [purpose, setPurpose] = useState('Pengambilan suku cadang pemeliharaan berkala unit Excavator EX-02 di Pit 2');
  
  // Items on the document
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

  // Signatures on the document
  const [signatures, setSignatures] = useState({
    slot1: {
      signed: true,
      signer_name: user?.full_name || 'arya-user',
      signer_title: 'Teknisi Lapangan',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      hash: 'SHA256:7B9C-MR-APPROVED-INITIAL',
      signature_image: null
    },
    slot2: null,
    slot3: null
  });

  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch inventory for item autocomplete/selection
  const { data: invItems } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory');
      return res.data?.data || [];
    }
  });

  // Fetch recent ledger for history tab
  const { data: ledgerItems } = useQuery({
    queryKey: ['inventory-ledger'],
    queryFn: async () => {
      const res = await api.get('/inventory/ledger');
      return res.data?.data || [];
    }
  });

  const handleSignSlot = (slotKey, data) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const hash = `SHA256:SIG-${Date.now().toString(16).toUpperCase()}-${slotKey.toUpperCase()}`;

    setSignatures(prev => ({
      ...prev,
      [slotKey]: {
        signed: true,
        signer_name: data.signerName || user?.full_name || 'Staff Lapangan',
        signer_title: data.signerTitle || (slotKey === 'slot1' ? 'Teknisi' : slotKey === 'slot2' ? 'Admin' : 'Superadmin'),
        signature_image: data.signatureImage,
        timestamp,
        hash,
        method: data.method
      }
    }));
  };

  const handleResetSlot = (slotKey) => {
    setSignatures(prev => ({
      ...prev,
      [slotKey]: null
    }));
  };

  const handleAddItem = () => {
    const defaultItem = invItems?.[0] || {
      name: 'Filter Cadangan Lapangan',
      sku: 'BIB-GEN-SPARE',
      rack: 'R-A01'
    };
    setDocItems(prev => [
      ...prev,
      {
        name: defaultItem.name,
        sku: defaultItem.sku,
        qty: 1,
        unit: 'PCS',
        rack: defaultItem.rack || 'R-A01',
        notes: 'Kebutuhan mendesak'
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    setDocItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    setDocItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Submit the completed official document to backend
  const handleSubmitDocument = async () => {
    if (docItems.length === 0) {
      alert('Tambahkan minimal 1 item material pada dokumen.');
      return;
    }
    if (!signatures.slot1?.signed) {
      alert('Tanda tangan pemohon (Slot 1) wajib diisi atau di-paste langsung pada kolom dokumen.');
      return;
    }

    setLoading(true);
    try {
      for (const item of docItems) {
        await api.post('/inventory/mr', {
          item_name: item.name,
          sku: item.sku,
          qty: Number(item.qty),
          rack: item.rack,
          purpose
        });
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setDocNumber(`MR-2026-${String(Date.now()).slice(-4)}`);
      }, 4000);
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal membukukan dokumen MR.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5 pb-12 font-sans select-none">
      
      {/* ── Top Header & Tab Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-red-100 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Surat Permintaan Material (MR)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tanda tangan dapat di-Copy atau di-Paste langsung pada kolom dokumen, bukan mengisi form terpisah.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'document'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dokumen Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Riwayat Pengeluaran</span>
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="text-xs font-black">
                Dokumen Permintaan Material Berhasil Disahkan!
              </div>
              <div className="text-[11px] text-emerald-700">
                Stok rak otomatis terpotong dan dibukukan ke Buku Besar Mutasi Stok (MR_OUT).
              </div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
            {docNumber}
          </span>
        </div>
      )}

      {/* ── Tab 1: Official Document Sheet (WYSIWYG Preview with Direct Signatures) ── */}
      {activeTab === 'document' && (
        <DirectDocumentSheet
          docType="MR"
          docNumber={docNumber}
          docDate={docDate}
          siteLocation={siteLocation}
          department={department}
          requesterName={user?.full_name || 'arya-user'}
          purpose={purpose}
          items={docItems}
          signatures={signatures}
          canSignSlot1={true}
          canSignSlot2={role === 'Admin' || role === 'Superadmin'}
          canSignSlot3={role === 'Superadmin'}
          userRole={role || 'User'}
          onSignSlot={handleSignSlot}
          onResetSlot={handleResetSlot}
          isEditable={true}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onUpdateItem={handleUpdateItem}
          onUpdateField={(field, val) => {
            if (field === 'purpose') setPurpose(val);
            if (field === 'siteLocation') setSiteLocation(val);
          }}
          actionButtons={
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitDocument}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Menyimpan...' : 'Sah & Bukukan Dokumen'}</span>
            </button>
          }
        />
      )}

      {/* ── Tab 2: History & Ledger (Modern Cards & Details) ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <span>Riwayat Pengambilan Material (MR_OUT)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Buku catatan pemotongan stok otomatis dari rak site tambang
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              {ledgerItems?.filter(i => i.transaction_type === 'MR_OUT' || i.reference_doc_id?.startsWith('MR-')).length || 0} Transaksi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ledgerItems && ledgerItems.length > 0 ? (
              ledgerItems
                .filter(i => i.transaction_type === 'MR_OUT' || i.reference_doc_id?.startsWith('MR-'))
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
                        <span>PIC: <strong>{item.performed_by || 'arya-user'}</strong></span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>Waktu Pengambilan</span>
                      <span>{item.created_at?.slice(0, 16).replace('T', ' ') || 'Hari ini'}</span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-3 bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Belum ada riwayat mutasi pengambilan barang tercatat.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
