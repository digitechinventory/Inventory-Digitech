import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api/client.js';

export default function InventoryLedgerPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['ledger'],
    queryFn: async () => {
      const res = await api.get('/inventory/ledger');
      return res.data?.data || [];
    }
  });

  const transactions = ledgerData || [];

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchQ =
      t.item_name?.toLowerCase().includes(q) ||
      t.part_number?.toLowerCase().includes(q) ||
      t.bin_location?.toLowerCase().includes(q) ||
      t.reference_doc_id?.toLowerCase().includes(q);
    const matchT = typeFilter === 'ALL' || t.transaction_type === typeFilter;
    return matchQ && matchT;
  });

  const exportToExcel = () => {
    const rows = filtered.map(t => ({
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
    XLSX.writeFile(workbook, `IMS_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Audit Trail Terpadu
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Buku Besar Mutasi Stok (Inventory Ledger)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Jejak audit digital seluruh perpindahan fisik material masuk (MOS), keluar (MR), dan rekonsiliasi opname
          </p>
        </div>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor Excel (.xlsx)
        </button>
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

        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
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

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                <th className="px-4 py-3 text-left">Waktu Mutasi</th>
                <th className="px-4 py-3 text-left">Nama Material</th>
                <th className="px-4 py-3 text-left">Part Number</th>
                <th className="px-4 py-3 text-left">Lokasi Rak</th>
                <th className="px-4 py-3 text-center">Tipe Transaksi</th>
                <th className="px-4 py-3 text-right">Mutasi Qty</th>
                <th className="px-4 py-3 text-left">Dokumen Referensi</th>
                <th className="px-4 py-3 text-left">Eksekutor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada transaksi mutasi stok yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((tr) => {
                  const isPositive = tr.qty_change > 0;
                  return (
                    <tr key={tr.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {tr.created_at ? new Date(tr.created_at).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{tr.item_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{tr.part_number || '-'}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{tr.bin_location}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                          tr.transaction_type === 'MOS_IN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tr.transaction_type === 'MR_OUT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {tr.transaction_type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-black ${
                        isPositive ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {isPositive ? `+${tr.qty_change}` : tr.qty_change}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 text-[11px]">{tr.reference_doc_id || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{tr.performed_by || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
