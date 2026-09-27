import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Eye,
  Check,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function StockOpnamePage() {
  const { user, role, isSuperadmin } = useAuth();
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [showBlindCountModal, setShowBlindCountModal] = useState(null);

  // Fetch opname sessions
  const { data: opnameData, refetch, isLoading } = useQuery({
    queryKey: ['opname'],
    queryFn: async () => {
      const res = await api.get('/opname');
      return res.data?.data || [];
    }
  });

  const opnames = opnameData || [];

  // Superadmin approves variance
  const handleApproveVariance = async (opnameId) => {
    try {
      await api.put(`/opname/${opnameId}/approve-variance`);
      alert('Otorisasi varians disetujui. Penyesuaian stok telah dibukukan ke buku besar mutasi secara otomatis.');
      refetch();
      setSelectedOpname(null);
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal menyetujui varians.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Audit Fisik &amp; Rekonsiliasi Varians
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Stock Opname & Variance Approval
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit fisik berkala dengan mekanisme Hitung Buta (Blind Count) & Otorisasi Manajemen Akhir
          </p>
        </div>

        {['Admin', 'Superadmin'].includes(role) && (
          <button
            onClick={() => setShowStartModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-950/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Mulai Sesi Opname Baru
          </button>
        )}
      </div>

      {/* Info Card: Konsep Blind Count */}
      <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
        <ClipboardList className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Prinsip Integritas Blind Count:</strong> Staf gudang menginput jumlah fisik riil di rak tanpa melihat saldo komputer di layar. Mencegah bias data dan kecurangan. Jika ditemukan selisih, sistem otomatis menerbitkan berkas <em>Variance Approval</em> untuk dievaluasi oleh Superadmin.
        </div>
      </div>

      {/* Table of Sessions */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Riwayat Sesi Audit Stock Opname</h3>
          <span className="text-[11px] font-mono text-slate-400">Total: {opnames.length} Sesi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                <th className="px-4 py-3 text-left">No. Sesi Opname</th>
                <th className="px-4 py-3 text-left">Zona Rak Diaudit</th>
                <th className="px-4 py-3 text-left">Auditor Pelaksana</th>
                <th className="px-4 py-3 text-left">Tanggal Sesi</th>
                <th className="px-4 py-3 text-left">Status Audit</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opnames.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Belum ada sesi stock opname yang dibuat.
                  </td>
                </tr>
              ) : (
                opnames.map((so) => (
                  <tr key={so.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{so.opname_number}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{so.zone}</td>
                    <td className="px-4 py-3 text-slate-600">{so.auditor_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{so.created_at?.split('T')[0]}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                        so.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : so.status === 'pending_approval'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {so.status === 'completed' ? '✓ Selesai Direkonsiliasi' : so.status === 'pending_approval' ? '⚠️ Menunggu Otorisasi Varians' : 'Sedang Berjalan'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {so.status === 'in_progress' ? (
                          <button
                            onClick={() => setShowBlindCountModal(so)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            Input Blind Count
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedOpname(so)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Detail & Varians
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: MULAI SESI OPNAME BARU */}
      {showStartModal && (
        <StartOpnameModal
          onClose={() => setShowStartModal(false)}
          onSuccess={() => {
            setShowStartModal(false);
            refetch();
          }}
        />
      )}

      {/* MODAL 2: INPUT BLIND COUNT */}
      {showBlindCountModal && (
        <BlindCountInputModal
          opname={showBlindCountModal}
          onClose={() => setShowBlindCountModal(null)}
          onSuccess={() => {
            setShowBlindCountModal(null);
            refetch();
          }}
        />
      )}

      {/* MODAL 3: DETAIL VARIAN & OTORISASI SUPERADMIN */}
      {selectedOpname && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-white text-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono text-red-600 font-bold uppercase">Laporan Varians Opname</span>
                <h3 className="text-base font-bold">{selectedOpname.opname_number} — {selectedOpname.zone}</h3>
              </div>
              <button onClick={() => setSelectedOpname(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                      <th className="px-3 py-2 text-left">SKU & Nama Barang</th>
                      <th className="px-3 py-2 text-left">Rak</th>
                      <th className="px-3 py-2 text-center">Sistem</th>
                      <th className="px-3 py-2 text-center">Fisik Riil</th>
                      <th className="px-3 py-2 text-center">Selisih</th>
                      <th className="px-3 py-2 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedOpname.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-900">{it.item_name}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{it.rack}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold">{it.system_qty}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700">{it.physical_qty}</td>
                        <td className={`px-3 py-2.5 text-center font-mono font-black ${it.variance === 0 ? 'text-slate-400' : it.variance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {it.variance > 0 ? `+${it.variance}` : it.variance}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-[11px]">{it.variance_reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedOpname(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Tutup
              </button>

              {isSuperadmin && selectedOpname.status === 'pending_approval' && (
                <button
                  type="button"
                  onClick={() => handleApproveVariance(selectedOpname.id)}
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/20"
                >
                  Setujui Varians & Mutasi Ledger
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StartOpnameModal({ onClose, onSuccess }) {
  const [zone, setZone] = useState('Zona A (Fast Moving)');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/opname/start', { zone, notes });
      alert('Sesi stock opname baru berhasil dimulai.');
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal memulai opname.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
        <h3 className="text-base font-black text-slate-900">Mulai Sesi Stock Opname</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Pilih Zona Rak Penyimpanan
            </label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="Zona A (Fast Moving)">Zona A (Fast Moving - Filter & Seal)</option>
              <option value="Zona B (Heavy Mechanical)">Zona B (Heavy Mechanical - Brake & Tooth)</option>
              <option value="Zona C (Fluids & Lubricants)">Zona C (Fluids & Lubricants - Drum Oli)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Catatan / Alasan Audit
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Audit fisik berkala triwulan III"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold"
            >
              {loading ? 'Memproses...' : 'Mulai Audit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlindCountInputModal({ opname, onClose, onSuccess }) {
  const [items, setItems] = useState([
    { sku: 'BIB-CAT-777D-FLTR', item_name: 'Cat 777D Engine Oil Filter', rack: 'R-A01', physical_qty: 4, variance_reason: '' },
    { sku: 'BIB-KOM-PC2000-HYD', item_name: 'Komatsu PC2000 Seal Kit', rack: 'R-A02', physical_qty: 18, variance_reason: '' },
    { sku: 'BIB-VOL-FMX-BRK', item_name: 'Volvo FMX 440 Brake Lining Assm', rack: 'R-B01', physical_qty: 32, variance_reason: '' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/opname/${opname.id}/submit-count`, { items });
      alert('Hasil cacah fisik (Blind Count) berhasil disimpan dan selisih varians telah dikalkulasi.');
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal menyimpan hasil cacah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 space-y-4">
        <div>
          <span className="text-[10px] font-mono text-amber-600 font-bold uppercase">Formulir Hitung Buta</span>
          <h3 className="text-base font-black text-slate-900">Input Hasil Cacah Fisik: {opname.opname_number}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Masukkan kuantitas fisik riil yang Anda hitung langsung pada rak (saldo komputer sengaja disembunyikan).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            {items.map((it, idx) => (
              <div key={it.sku} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{it.item_name}</div>
                    <div className="text-[10px] font-mono text-red-700">{it.sku} • Lokasi: {it.rack}</div>
                  </div>
                  <div className="w-24">
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase">Jml Fisik</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={it.physical_qty}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].physical_qty = Number(e.target.value);
                        setItems(copy);
                      }}
                      className="w-full px-2 py-1 text-xs font-mono font-bold border border-slate-200 bg-white rounded-lg text-center"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Catatan fisik jika ada kerusakan atau kelebihan..."
                  value={it.variance_reason}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx].variance_reason = e.target.value;
                    setItems(copy);
                  }}
                  className="w-full px-2 py-1 text-[11px] border border-slate-200 bg-white rounded-lg outline-none"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold"
            >
              {loading ? 'Menghitung Varians...' : 'Kirim Hasil Cacah Fisik'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
