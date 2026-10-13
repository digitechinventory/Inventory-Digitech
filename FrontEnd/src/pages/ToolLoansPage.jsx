import React, { useState, useEffect } from 'react';
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
  X,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ParallelogramCard from '../components/common/ParallelogramCard.jsx';

export default function ToolLoansPage() {
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(null); // tool item to return
  const [returnCondition, setReturnCondition] = useState('Baik');
  const [returnNotes, setReturnNotes] = useState('');

  // Checkbox selection & 3-dots action state
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [detailLoan, setDetailLoan] = useState(null);
  const [editLoan, setEditLoan] = useState(null);
  const [editForm, setEditForm] = useState({
    borrower_name: '',
    expected_return_date: '',
    condition: 'Baik',
    notes: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Selection handlers
  const filteredIds = filtered.map(l => l.id);
  const isAllSelected = filtered.length > 0 && filteredIds.every(id => selectedIds.includes(id));
  const isSomeSelected = filtered.length > 0 && filteredIds.some(id => selectedIds.includes(id)) && !isAllSelected;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleToggleRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Close kebab menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  // Open edit modal
  const handleOpenEdit = (loan) => {
    setEditLoan(loan);
    setEditForm({
      borrower_name: loan.borrower_name || '',
      expected_return_date: loan.expected_return_date || '',
      condition: loan.condition || 'Baik',
      notes: loan.notes || ''
    });
    setActiveMenuId(null);
  };

  // Save edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editLoan) return;
    setIsUpdating(true);
    try {
      await api.patch(`/tools/loans/${editLoan.id}`, editForm);
      refetch();
      addToast('Informasi peminjaman perkakas berhasil diperbarui.', 'success');
      setEditLoan(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memperbarui peminjaman.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Execute delete (single or bulk)
  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'bulk') {
        await api.post('/tools/loans/bulk-delete', { ids: deleteConfirm.ids });
        setSelectedIds(prev => prev.filter(id => !deleteConfirm.ids.includes(id)));
        addToast(`${deleteConfirm.ids.length} catatan peminjaman berhasil dihapus.`, 'success');
      } else {
        await api.delete(`/tools/loans/${deleteConfirm.item.id}`);
        setSelectedIds(prev => prev.filter(id => id !== deleteConfirm.item.id));
        addToast('Catatan peminjaman berhasil dihapus.', 'success');
      }
      refetch();
      setDeleteConfirm(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghapus catatan peminjaman.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

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
      addToast('Pengembalian perkakas berhasil dikonfirmasi.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal mengembalikan alat.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0 pr-0 sm:pr-4">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tool Tracking (Peminjaman Alat Kerja)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan peralatan non-habis pakai, batas waktu pengembalian &amp; deteksi overdue
          </p>
        </div>

        <button
          onClick={() => setShowBorrowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-950/30 cursor-pointer ml-auto shrink-0 justify-end"
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

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl ml-auto shrink-0 justify-end">
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

      {/* Bulk Action Bar (When loans are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-4 shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-red-600 text-white text-xs font-black shadow-sm">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedIds.length} catatan peminjaman dipilih
              </p>
              <p className="text-[11px] text-slate-400">
                Pilih aksi massal untuk catatan peminjaman alat yang ditandai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Batal Pilih
            </button>

            <button
              onClick={() =>
                setDeleteConfirm({
                  type: 'bulk',
                  count: selectedIds.length,
                  ids: [...selectedIds]
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Terpilih ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                {/* Checkbox Header */}
                <th className="px-3.5 py-3 text-center w-10">
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="p-1 rounded hover:bg-slate-200 transition cursor-pointer text-slate-500 hover:text-slate-800 inline-flex items-center justify-center"
                    title={isAllSelected ? 'Batalkan semua pilihan' : 'Pilih semua di halaman ini'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-red-600" />
                    ) : isSomeSelected ? (
                      <MinusSquare className="w-4 h-4 text-red-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Nama Perkakas / Alat Kerja</th>
                <th className="px-4 py-3 text-left">No. Seri</th>
                <th className="px-4 py-3 text-left">Personel Peminjam</th>
                <th className="px-4 py-3 text-left">Tanggal Pinjam</th>
                <th className="px-4 py-3 text-left">Estimasi Kembali</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center w-24">Aksi Cepat</th>
                <th className="px-4 py-3 text-center w-14">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada catatan peminjaman alat yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isOverdue = item.status === 'overdue' || (item.status === 'borrowed' && item.expected_return_date < today);
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        isSelected ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox Cell */}
                      <td className="px-3.5 py-3 text-center w-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRow(item.id);
                          }}
                          className="p-1 rounded hover:bg-slate-200 transition cursor-pointer text-slate-500 inline-flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-red-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

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

                      {/* Quick Return Button */}
                      <td className="px-4 py-3 text-center w-24">
                        {item.status !== 'returned' ? (
                          <button
                            onClick={() => setShowReturnModal(item)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Kembalikan
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Kondisi: {item.condition || 'Baik'}</span>
                        )}
                      </td>

                      {/* 3-Dots Action Cell */}
                      <td className="px-4 py-3 text-center relative w-14">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === item.id ? null : item.id);
                          }}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            activeMenuId === item.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                          }`}
                          title="Opsi Peminjaman"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-3 top-10 z-40 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-150"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setDetailLoan(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Lihat Detail Pinjam</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit Data Pinjam</span>
                            </button>

                            {item.status !== 'returned' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowReturnModal(item);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Kembalikan Alat</span>
                              </button>
                            )}

                            <div className="border-t border-slate-100 my-1"></div>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirm({ type: 'single', item });
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-bold transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span>Hapus Catatan</span>
                            </button>
                          </div>
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

      {/* MODAL: DETAIL PEMINJAMAN ALAT */}
      {detailLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Detail Peminjaman Alat</h3>
                  <p className="text-[11px] font-mono text-slate-500">ID: {detailLoan.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailLoan(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">NAMA ALAT</span>
                <h4 className="text-sm font-black text-slate-900">{detailLoan.tool_name}</h4>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400">NO. SERI:</span>
                    <p className="font-bold text-slate-800">{detailLoan.serial_number || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">STATUS:</span>
                    <p className="font-bold uppercase text-slate-800">{detailLoan.status}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">Peminjam:</span>
                  <span className="font-bold text-slate-900">{detailLoan.borrower_name}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl font-mono text-[11px]">
                  <span className="text-slate-500">Tanggal Pinjam:</span>
                  <span className="font-semibold text-slate-800">{detailLoan.loan_date}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl font-mono text-[11px]">
                  <span className="text-slate-500">Estimasi Kembali:</span>
                  <span className="font-semibold text-slate-800">{detailLoan.expected_return_date}</span>
                </div>
                {detailLoan.actual_return_date && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl font-mono text-[11px] text-emerald-800">
                    <span>Dikembalikan Tanggal:</span>
                    <span className="font-bold">{detailLoan.actual_return_date}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Catatan Peminjaman</span>
                  <div className="mt-1 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-slate-700">
                    {detailLoan.notes || 'Tidak ada catatan khusus.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDetailLoan(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INFORMASI PEMINJAMAN */}
      {editLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Data Peminjaman</h3>
                  <p className="text-[11px] font-mono text-slate-500">{editLoan.tool_name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditLoan(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Peminjam / Teknisi
                  </label>
                  <input
                    type="text"
                    value={editForm.borrower_name}
                    onChange={(e) => setEditForm({ ...editForm, borrower_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Estimasi Tanggal Pengembalian
                  </label>
                  <input
                    type="date"
                    value={editForm.expected_return_date}
                    onChange={(e) => setEditForm({ ...editForm, expected_return_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kondisi Perkakas
                  </label>
                  <select
                    value={editForm.condition}
                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                  >
                    <option value="Baik">Baik / Siap Pakai</option>
                    <option value="Perlu Kalibrasi">Perlu Kalibrasi</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Catatan / Keperluan Operasional
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditLoan(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS (SINGLE / BULK) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {deleteConfirm.type === 'bulk'
                  ? `Hapus ${deleteConfirm.count} Catatan Peminjaman?`
                  : 'Hapus Catatan Peminjaman Ini?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {deleteConfirm.type === 'bulk'
                  ? `Anda akan menghapus ${deleteConfirm.count} data peminjaman alat secara permanen.`
                  : `Catatan peminjaman "${deleteConfirm.item?.tool_name}" oleh "${deleteConfirm.item?.borrower_name}" akan dihapus permanen.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer flex-1"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex-1 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

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
  const { addToast } = useToast();
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
      addToast('Peminjaman alat kerja berhasil dicatat.', 'success');
      onSuccess();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal meminjam alat.', 'error');
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
