import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Calendar,
  User,
  ShieldCheck,
  X
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ParallelogramCard from '../components/common/ParallelogramCard.jsx';

export default function ToolLoansPage() {
  const { user, role } = useAuth();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(null); // tool item to return
  const [returnCondition, setReturnCondition] = useState('Baik');
  const [returnNotes, setReturnNotes] = useState('');

  // Fetch loans
  const { data: loansData, refetch, isLoading } = useQuery({
    queryKey: ['tools', statusFilter],
    queryFn: async () => {
      const res = await api.get(`/tools/loans${statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''}`);
      return res.data?.data || [];
    }
  });

  const loans = loansData || [];
  const filtered = loans.filter(l => {
    const q = search.toLowerCase();
    const matchQ = l.tool_name?.toLowerCase().includes(q) || l.borrower_name?.toLowerCase().includes(q) || l.serial_number?.toLowerCase().includes(q);
    const matchS = statusFilter === 'ALL' || l.status === statusFilter;
    return matchQ && matchS;
  });

  const today = new Date().toISOString().split('T')[0];
  const borrowedCount = loans.filter(l => l.status === 'borrowed' && l.expected_return_date >= today).length;
  const overdueCount = loans.filter(l => l.status === 'overdue' || (l.status === 'borrowed' && l.expected_return_date < today)).length;
  const returnedCount = loans.filter(l => l.status === 'returned').length;

  // Handle Return Tool
  const handleConfirmReturn = async () => {
    if (!showReturnModal) return;
    try {
      await api.put(`/tools/loans/${showReturnModal.id}/return`, {
        condition: returnCondition,
        notes: returnNotes
      });
      setShowReturnModal(null);
      setReturnNotes('');
      refetch();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal mengembalikan alat.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tool Tracking (Peminjaman Alat Kerja)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan peralatan non-habis pakai, batas waktu pengembalian &amp; deteksi overdue
          </p>
        </div>

        <button
          onClick={() => setShowBorrowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-950/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Pinjam Alat Baru
        </button>
      </div>

      {/* Metrics Row (Parallelogram Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ParallelogramCard
          title="SEDANG DIPINJAM"
          value={borrowedCount}
          unit="Unit"
          subtitle="Dalam batas waktu aman"
          subtitleIcon={Clock}
          subtitleColor="text-blue-600"
          icon={Wrench}
          iconColor="text-blue-500"
          accentColor="border-blue-600"
          onClick={() => setStatusFilter('borrowed')}
        />

        <ParallelogramCard
          title="JATUH TEMPO (OVERDUE)"
          value={overdueCount}
          unit="Unit"
          valueColor="text-red-700"
          subtitle="Peringatan bot otomatis aktif"
          subtitleIcon={AlertTriangle}
          subtitleColor="text-red-600"
          icon={AlertTriangle}
          iconColor="text-red-600"
          accentColor="border-red-700"
          badgeDotColor="bg-red-600 ring-4 ring-red-100"
          onClick={() => setStatusFilter('overdue')}
        />

        <ParallelogramCard
          title="SELESAI DIKEMBALIKAN"
          value={returnedCount}
          unit="Riwayat"
          valueColor="text-emerald-700"
          subtitle="Kondisi fisik telah diverifikasi"
          subtitleIcon={CheckCircle2}
          subtitleColor="text-emerald-600"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          accentColor="border-emerald-600"
          onClick={() => setStatusFilter('returned')}
        />
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama alat, no seri, nama peminjam..."
            className="w-full bg-transparent text-xs outline-none font-semibold text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {['ALL', 'borrowed', 'overdue', 'returned'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st === 'borrowed' ? 'Dipinjam' : st === 'overdue' ? 'Overdue' : 'Dikembalikan'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                <th className="px-4 py-3 text-left">Nama Perkakas / Alat Kerja</th>
                <th className="px-4 py-3 text-left">No. Seri</th>
                <th className="px-4 py-3 text-left">Personel Peminjam</th>
                <th className="px-4 py-3 text-left">Tanggal Pinjam</th>
                <th className="px-4 py-3 text-left">Estimasi Kembali</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada catatan peminjaman alat yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isOverdue = item.status === 'overdue' || (item.status === 'borrowed' && item.expected_return_date < today);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{item.tool_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{item.serial_number || '-'}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{item.borrower_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{item.loan_date}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{item.expected_return_date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                          item.status === 'returned'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isOverdue
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {item.status === 'returned' ? 'Kembali' : isOverdue ? '⚠️ Overdue' : 'Dipinjam'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.status !== 'returned' ? (
                          <button
                            onClick={() => setShowReturnModal(item)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Kembalikan
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Kondisi: {item.condition || 'Baik'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PINJAM ALAT BARU */}
      {showBorrowModal && (
        <BorrowToolModal
          user={user}
          onClose={() => setShowBorrowModal(false)}
          onSuccess={() => {
            setShowBorrowModal(false);
            refetch();
          }}
        />
      )}

      {/* MODAL: KONFIRMASI PENGEMBALIAN ALAT */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900">Konfirmasi Pengembalian Alat</h3>
            <p className="text-xs text-slate-500">
              Alat: <strong>{showReturnModal.tool_name}</strong> ({showReturnModal.serial_number})
            </p>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Kondisi Fisik Pasca Pemakaian
              </label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="Baik">Baik (Normal & Bersih)</option>
                <option value="Rusak Ringan">Rusak Ringan / Butuh Kalibrasi</option>
                <option value="Rusak Berat">Rusak Berat / Afkir</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Catatan Pengembalian
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Contoh: Baterai terisi penuh, kabel lengkap"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20"
              >
                Konfirmasi Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BorrowToolModal({ user, onClose, onSuccess }) {
  const [toolName, setToolName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tools/loans', {
        tool_name: toolName,
        serial_number: serialNumber,
        expected_return_date: returnDate,
        notes
      });
      alert('Peminjaman alat kerja berhasil dicatat.');
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal meminjam alat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Form Peminjaman Alat Kerja</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Nama Alat / Perkakas
            </label>
            <input
              type="text"
              required
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="Contoh: Digital Torque Wrench 1/2 Inch"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Nomor Seri / Tag Barcode (Opsional)
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Contoh: TW-2026-089"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono text-slate-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Estimasi Tanggal Pengembalian
            </label>
            <input
              type="date"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Keperluan Pekerjaan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Overhaul unit DT-12 Pit South"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/20"
            >
              {loading ? 'Menyimpan...' : 'Ajukan Peminjaman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
