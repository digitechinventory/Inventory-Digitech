import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  FileSpreadsheet,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  CheckSquare,
  Square,
  MinusSquare,
  AlertTriangle,
  X,
  Check,
  FileText,
  MapPin,
  User,
  Clock,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

export default function InventoryLedgerPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Kebab action menu state (id of currently opened row menu)
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modals state
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'single', item } | { type: 'bulk', count, ids }
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    reference_doc_id: '',
    bin_location: '',
    notes: '',
    performed_by: ''
  });

  const { data: ledgerData, isLoading, refetch } = useQuery({
    queryKey: ['ledger'],
    queryFn: async () => {
      const res = await api.get('/inventory/ledger');
      return res.data?.data || [];
    }
  });

  const transactions = ledgerData || [];

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchQ =
      t.item_name?.toLowerCase().includes(q) ||
      t.part_number?.toLowerCase().includes(q) ||
      t.bin_location?.toLowerCase().includes(q) ||
      t.reference_doc_id?.toLowerCase().includes(q);
    const matchT = typeFilter === 'ALL' || t.transaction_type === typeFilter;
    return matchQ && matchT;
  });

  // Selection handlers
  const filteredIds = filtered.map((t) => t.id);
  const isAllSelected = filtered.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = filtered.length > 0 && filteredIds.some((id) => selectedIds.includes(id)) && !isAllSelected;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleToggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Close kebab menu when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  // Open edit modal
  const handleOpenEdit = (item) => {
    setEditItem(item);
    setEditForm({
      reference_doc_id: item.reference_doc_id || '',
      bin_location: item.bin_location || '',
      notes: item.notes || '',
      performed_by: item.performed_by || ''
    });
    setActiveMenuId(null);
  };

  // Submit edit form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    setIsUpdating(true);
    try {
      await api.patch(`/inventory/ledger/${editItem.id}`, editForm);
      await queryClient.invalidateQueries(['ledger']);
      addToast('Data catatan & referensi mutasi berhasil diperbarui.', 'success');
      setEditItem(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memperbarui mutasi stok.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm delete (single or bulk)
  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);

    try {
      if (deleteConfirm.type === 'bulk') {
        await api.post('/inventory/ledger/bulk-delete', { ids: deleteConfirm.ids });
        setSelectedIds((prev) => prev.filter((id) => !deleteConfirm.ids.includes(id)));
        addToast(`${deleteConfirm.ids.length} baris mutasi stok berhasil dihapus.`, 'success');
      } else {
        await api.delete(`/inventory/ledger/${deleteConfirm.item.id}`);
        setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirm.item.id));
        addToast('Baris mutasi stok berhasil dihapus.', 'success');
      }
      await queryClient.invalidateQueries(['ledger']);
      setDeleteConfirm(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghapus baris mutasi.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Excel Export
  const exportToExcel = (onlySelected = false) => {
    const listToExport = onlySelected
      ? filtered.filter((t) => selectedIds.includes(t.id))
      : filtered;

    if (listToExport.length === 0) {
      addToast('Tidak ada data mutasi untuk diekspor.', 'warning');
      return;
    }

    const rows = listToExport.map((t) => ({
      'Waktu Transaksi': t.created_at,
      'Nama Material': t.item_name,
      'Part Number': t.part_number || '-',
      'Lokasi Rak': t.bin_location,
      'Tipe Transaksi': t.transaction_type,
      'Kuantitas Mutasi': t.qty_change,
      'No. Dokumen Referensi': t.reference_doc_id || '-',
      'Keterangan / Notes': t.notes || '-',
      'Eksekutor': t.performed_by || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Ledger');
    XLSX.writeFile(
      workbook,
      `IMS_Ledger_${onlySelected ? 'Selected_' : ''}${new Date().toISOString().split('T')[0]}.xlsx`
    );
    addToast(`${rows.length} baris berhasil diekspor ke Excel.`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0 pr-0 sm:pr-4">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Buku Besar Mutasi Stok (Inventory Ledger)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Jejak audit digital seluruh perpindahan fisik material masuk (MOS), keluar (MR), dan rekonsiliasi opname
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 ml-auto shrink-0">
          <button
            onClick={() => exportToExcel(false)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari material, part no, rak bin, atau no dokumen..."
            className="w-full bg-transparent text-xs outline-none font-semibold text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl ml-auto shrink-0 justify-end">
          {['ALL', 'MOS_IN', 'MR_OUT', 'OPNAME_ADJUSTMENT'].map((st) => (
            <button
              key={st}
              onClick={() => setTypeFilter(st)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                typeFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar (When rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-4 shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-red-600 text-white text-xs font-black shadow-sm">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedIds.length} baris mutasi stok dipilih
              </p>
              <p className="text-[11px] text-slate-400">
                Pilih aksi massal untuk baris-baris yang telah ditandai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToExcel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-700"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Ekspor Terpilih
            </button>

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

      {/* Ledger Table */}
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
                <th className="px-4 py-3 text-left">Waktu Mutasi</th>
                <th className="px-4 py-3 text-left">Nama Material</th>
                <th className="px-4 py-3 text-left">Part Number</th>
                <th className="px-4 py-3 text-left">Lokasi Rak</th>
                <th className="px-4 py-3 text-center">Tipe Transaksi</th>
                <th className="px-4 py-3 text-right">Mutasi Qty</th>
                <th className="px-4 py-3 text-left">Dokumen Referensi</th>
                <th className="px-4 py-3 text-left">Eksekutor</th>
                {/* 3-Dots Action Column Header */}
                <th className="px-4 py-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada transaksi mutasi stok yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((tr) => {
                  const isPositive = tr.qty_change > 0;
                  const isSelected = selectedIds.includes(tr.id);

                  return (
                    <tr
                      key={tr.id}
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
                            handleToggleRow(tr.id);
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

                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {tr.created_at ? new Date(tr.created_at).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{tr.item_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{tr.part_number || '-'}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">{tr.bin_location}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                            tr.transaction_type === 'MOS_IN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tr.transaction_type === 'MR_OUT'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {tr.transaction_type}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-black whitespace-nowrap ${
                          isPositive ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? `+${tr.qty_change}` : tr.qty_change}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 text-[11px] max-w-xs truncate">
                        {tr.reference_doc_id || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{tr.performed_by || '-'}</td>

                      {/* 3-Dots Action Cell */}
                      <td className="px-4 py-3 text-center relative w-16">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === tr.id ? null : tr.id);
                          }}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            activeMenuId === tr.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                          }`}
                          title="Opsi Transaksi"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === tr.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-3 top-10 z-40 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-150"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setDetailItem(tr);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Lihat Jejak Audit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(tr)}
                              className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit Catatan & Ref</span>
                            </button>

                            <div className="border-t border-slate-100 my-1"></div>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirm({ type: 'single', item: tr });
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-bold transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span>Hapus Baris Ini</span>
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

      {/* MODAL 1: LIHAT JEJAK AUDIT DETAIL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" style={{ clipPath: "polygon(0 14px, 100% 0, 100% calc(100% - 14px), 0 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(220,38,38,0.10)" }}>
            {/* Modal Header */}
            <div className="px-6 pt-7 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Detail Jejak Audit Mutasi Stok</h3>
                  <p className="text-[11px] font-mono text-slate-500">ID: {detailItem.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-red-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Nama Material</span>
                    <h4 className="text-sm font-black text-slate-900 mt-0.5">{detailItem.item_name}</h4>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold ${
                      detailItem.transaction_type === 'MOS_IN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : detailItem.transaction_type === 'MR_OUT'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {detailItem.transaction_type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">PART NUMBER</span>
                    <p className="font-mono font-bold text-slate-800">{detailItem.part_number || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">LOKASI RAK</span>
                    <p className="font-mono font-bold text-slate-800">{detailItem.bin_location}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">KUANTITAS MUTASI</span>
                    <p className={`font-mono text-sm font-black ${detailItem.qty_change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {detailItem.qty_change > 0 ? `+${detailItem.qty_change}` : detailItem.qty_change} Unit
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">WAKTU AUDIT</span>
                    <p className="font-mono text-slate-700">{detailItem.created_at ? new Date(detailItem.created_at).toLocaleString('id-ID') : '-'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 px-1">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">No. Dokumen Referensi</span>
                  <div className="mt-1 p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl font-mono text-slate-800 font-semibold break-all">
                    {detailItem.reference_doc_id || 'Tidak ada nomor referensi terlampir'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Eksekutor / Penanggung Jawab</span>
                  <div className="mt-1 flex items-center gap-2 p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{detailItem.performed_by || 'Sistem Otomatis (Batch Sync)'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Catatan / Alasan Mutasi</span>
                  <div className="mt-1 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-slate-700 leading-relaxed">
                    {detailItem.notes || 'Tidak ada catatan tambahan untuk mutasi ini.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pt-3 pb-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CATATAN & REFERENSI */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Catatan & Referensi Mutasi</h3>
                  <p className="text-[11px] font-mono text-slate-500 truncate max-w-xs">{editItem.item_name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. Dokumen Referensi (MOS / MR / SO)
                  </label>
                  <input
                    type="text"
                    value={editForm.reference_doc_id}
                    onChange={(e) => setEditForm({ ...editForm, reference_doc_id: e.target.value })}
                    placeholder="Contoh: 001/VGT/MOS/... atau MR-2026-..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lokasi Rak (Bin Location)
                  </label>
                  <input
                    type="text"
                    value={editForm.bin_location}
                    onChange={(e) => setEditForm({ ...editForm, bin_location: e.target.value })}
                    placeholder="Contoh: R-A01, R-B02"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Eksekutor / Penanggung Jawab Mutasi
                  </label>
                  <input
                    type="text"
                    value={editForm.performed_by}
                    onChange={(e) => setEditForm({ ...editForm, performed_by: e.target.value })}
                    placeholder="Nama user atau sistem"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Keterangan / Catatan Operasional
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Tuliskan catatan rekonsiliasi atau alasan koreksi..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
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

      {/* MODAL 3: KONFIRMASI HAPUS (SINGLE ATAU BULK) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-center p-6 pt-8 pb-8" style={{ clipPath: "polygon(0 14px, 100% 0, 100% calc(100% - 14px), 0 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(220,38,38,0.12)" }}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {deleteConfirm.type === 'bulk'
                  ? `Hapus ${deleteConfirm.count} Baris Mutasi?`
                  : 'Hapus Baris Mutasi Ini?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {deleteConfirm.type === 'bulk'
                  ? `Anda akan menghapus ${deleteConfirm.count} catatan mutasi dari Buku Besar. Data riwayat yang dihapus tidak dapat dipulihkan.`
                  : `Transaksi mutasi "${deleteConfirm.item?.item_name}" (${deleteConfirm.item?.reference_doc_id || 'Tanpa Ref'}) akan dihapus permanen dari audit ledger.`}
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
    </div>
  );
}



