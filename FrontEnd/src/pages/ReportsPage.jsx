import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  PackageCheck,
  PackageMinus,
  AlertTriangle,
  Building2,
  FileCheck2,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Eye,
  ShieldCheck,
  X,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ParallelogramCard from '../components/common/ParallelogramCard.jsx';
import { INITIAL_SITES, INVENTORY_LEDGER } from '../mockData.js';

export default function ReportsPage() {
  const { role, user } = useAuth();
  const { addToast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'week' | 'month' | 'quarter' | 'year'
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [activeReportTab, setActiveReportTab] = useState('summary'); // 'summary' | 'documents' | 'analytics'
  const [previewDoc, setPreviewDoc] = useState(null);

  // Fetch live ledger transactions for reports calculation
  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['reports-ledger'],
    queryFn: async () => {
      try {
        const res = await api.get('/inventory/ledger');
        const items = res.data?.data || res.data;
        return Array.isArray(items) && items.length > 0 ? items : null;
      } catch {
        return null;
      }
    }
  });

  // Fallback combined transactions if database ledger is empty
  const transactions = useMemo(() => {
    if (ledgerData && ledgerData.length > 0) return ledgerData;
    return [
      { id: 'tx-01', item_name: 'Cat 777D Engine Oil Filter', part_number: 'BIB-CAT-777D-FLTR', bin_location: 'R-A01', qty_change: 24, transaction_type: 'MOS_IN', reference_doc_id: 'MOS-2026-09-001', category: 'Heavy Equipment Parts', performed_by: 'arya-admin', created_at: '2026-10-14T09:15:00.000Z' },
      { id: 'tx-02', item_name: 'Komatsu PC2000 Seal Kit', part_number: 'BIB-KOM-PC2000-HYD', bin_location: 'R-A02', qty_change: -4, transaction_type: 'MR_OUT', reference_doc_id: 'MR-2026-10-012', category: 'Hydraulics', performed_by: 'budi-teknisi', created_at: '2026-10-12T14:20:00.000Z' },
      { id: 'tx-03', item_name: 'Volvo FMX Brake Lining Assm', part_number: 'BIB-VOL-FMX-BRK', bin_location: 'R-B01', qty_change: 18, transaction_type: 'MOS_IN', reference_doc_id: 'MOS-2026-09-003', category: 'Hauling Fleet', performed_by: 'arya-admin', created_at: '2026-10-10T11:00:00.000Z' },
      { id: 'tx-04', item_name: 'Shell Tellus S2 V 68 Drum', part_number: 'BIB-LUB-SHL-T68', bin_location: 'R-C01', qty_change: -8, transaction_type: 'MR_OUT', reference_doc_id: 'MR-2026-10-008', category: 'Lubricants & Fuel', performed_by: 'doni-lubricator', created_at: '2026-10-08T08:45:00.000Z' },
      { id: 'tx-05', item_name: 'Bucket Tooth Tip 777D', part_number: 'BIB-GET-CAT-TIP', bin_location: 'R-B03', qty_change: 40, transaction_type: 'MOS_IN', reference_doc_id: 'MOS-2026-08-019', category: 'Ground Engaging Tools', performed_by: 'arya-admin', created_at: '2026-10-05T16:30:00.000Z' },
      { id: 'tx-06', item_name: 'Delco Remy 24V Alternator', part_number: 'BIB-ELE-ALT-24V', bin_location: 'R-D01', qty_change: -2, transaction_type: 'MR_OUT', reference_doc_id: 'MR-2026-10-002', category: 'Electrical & Sensor', performed_by: 'dani-electrician', created_at: '2026-10-02T10:15:00.000Z' }
    ];
  }, [ledgerData]);

  // Aggregate metrics (Strictly operational logistics: Quantities, Movements & Accuracy)
  const metrics = useMemo(() => {
    let totalInflowQty = 0;
    let totalOutflowQty = 0;

    transactions.forEach(t => {
      const qty = Math.abs(t.qty_change || 0);
      if (t.transaction_type === 'MOS_IN' || (t.qty_change || 0) > 0) {
        totalInflowQty += qty;
      } else {
        totalOutflowQty += qty;
      }
    });

    const totalMovementQty = totalInflowQty + totalOutflowQty;

    return {
      totalInflowQty,
      totalOutflowQty,
      totalMovementQty,
      accuracyRate: '98.6%',
      activeSkuCount: 649,
      turnoverRatio: '3.4x'
    };
  }, [transactions]);

  // Monthly breakdown trend (Last 6 Months) - Focusing purely on physical logistics movements
  const monthlyTrends = [
    { month: 'Mei 2026', mos: 64, mr: 52, totalActivity: '116 Mutasi Fisik' },
    { month: 'Jun 2026', mos: 78, mr: 68, totalActivity: '146 Mutasi Fisik' },
    { month: 'Jul 2026', mos: 95, mr: 84, totalActivity: '179 Mutasi Fisik' },
    { month: 'Agu 2026', mos: 88, mr: 91, totalActivity: '179 Mutasi Fisik' },
    { month: 'Sep 2026', mos: 110, mr: 98, totalActivity: '208 Mutasi Fisik' },
    { month: 'Okt 2026', mos: 82, mr: 56, totalActivity: '138 Mutasi Fisik' }
  ];

  // Category Distribution
  const categoryDist = [
    { name: 'Heavy Equipment Parts', pct: 38, count: '246 Item', color: 'bg-red-600', text: 'text-red-700' },
    { name: 'Hydraulics & Hoses', pct: 24, count: '155 Item', color: 'bg-amber-500', text: 'text-amber-700' },
    { name: 'Bulk Lubricants & Fuel', pct: 18, count: '117 Item', color: 'bg-blue-600', text: 'text-blue-700' },
    { name: 'Ground Engaging Tools', pct: 12, count: '78 Item', color: 'bg-emerald-600', text: 'text-emerald-700' },
    { name: 'Electrical & Automation', pct: 8, count: '53 Item', color: 'bg-purple-600', text: 'text-purple-700' }
  ];

  // Formal Official Documents Available for Preview & Printing
  const officialDocuments = [
    {
      id: 'BAM-2026-10-001',
      title: 'Berita Acara Rekonsiliasi Opname Fisik Bulanan (BAM)',
      type: 'Berita Acara Resmi',
      period: 'Periode Oktober 2026',
      site: 'BIB Pit Sebamban KM 24 (Base Workshop)',
      signer: 'Superadmin & Supervisor Gudang',
      status: 'Terverifikasi (Digital Signature Valid)',
      summary: 'Hasil audit fisik 649 SKU suku cadang tambang dengan match rate 98.6%. Ditemukan 2 deviasi buffer tercatat dan disesuaikan.'
    },
    {
      id: 'LMB-2026-10-002',
      title: 'Laporan Rekapitulasi Mutasi Masuk (MOS) & Pengeluaran (MR)',
      type: 'Laporan Logistik Bulanan',
      period: 'Periode 1 - 17 Oktober 2026',
      site: 'Semua Site Terintegrasi BIB',
      signer: 'Staff Logistik & Pengawas Material',
      status: 'Aktif & Final',
      summary: 'Rekap 82 transaksi penerimaan material on site (MOS) dan 56 pengeluaran material (MR) untuk perawatan unit hauling tambang.'
    },
    {
      id: 'LBP-2026-10-003',
      title: 'Laporan Evaluasi Stok Minimum & Rekomendasi Reorder PR',
      type: 'Rekomendasi Pengadaan',
      period: 'Pekan ke-3 Oktober 2026',
      site: 'BIB Central Heavy Equipment Warehouse',
      signer: 'Kepala Gudang & Inventory Controller',
      status: 'Menunggu Persetujuan PR',
      summary: 'Daftar 3 item berstatus kritis di bawah safety stock (Engine Oil Filter 777D, Shell Tellus Drum, Seal Kit) siap diproses PO vendor.'
    },
    {
      id: 'LPA-2026-10-004',
      title: 'Laporan Alokasi Suku Cadang per Fleet Tambang (Mining Fleet Usage)',
      type: 'Analisa Biaya Unit',
      period: 'Kuartal 3 - 4 Tahun 2026',
      site: 'Pit Sebamban Base Workshop',
      signer: 'Maintenance Head & Planner Tambang',
      status: 'Arsip Resmi',
      summary: 'Analisis konsumsi komponen per fleet 825 unit tambang (Hauler Caterpillar 777D, Komatsu HD785, Excavator PC2000, Volvo FMX).'
    }
  ];

  // Export to Excel handler
  const handleExportExcel = () => {
    try {
      const rows = transactions.map(t => ({
        'ID Transaksi': t.id || '-',
        'Waktu': t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '-',
        'Nama Material': t.item_name || '-',
        'Part Number': t.part_number || '-',
        'Kategori': t.category || 'General Mining',
        'Lokasi Rak': t.bin_location || '-',
        'Tipe Mutasi': t.transaction_type || '-',
        'Qty Mutasi': t.qty_change || 0,
        'Status Fisik': 'Kondisi Baik & Terverifikasi',
        'No. Dokumen Ref': t.reference_doc_id || '-',
        'Petugas': t.performed_by || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Laporan Logistik');

      XLSX.writeFile(workbook, `DIGITECH_Laporan_Resmi_Logistik_${new Date().toISOString().split('T')[0]}.xlsx`);
      addToast('Laporan resmi berhasil diekspor ke format Excel (.xlsx).', 'success');
    } catch {
      addToast('Gagal mengekspor laporan Excel.', 'error');
    }
  };

  // Trigger print
  const handlePrintDocument = (doc) => {
    setPreviewDoc(doc);
  };

  const handleExecuteBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 font-sans">
      {/* ── Top Header Banner ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_12px_36px_rgba(220,38,38,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0 pr-0 sm:pr-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase">
              Modul Laporan &amp; Audit Resmi
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Peran: {role || 'Admin'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Laporan Logistik &amp; Dokumen Resmi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi berkala mutasi stok, berita acara rekonsiliasi (BAM), analitik arus material tambang, dan evaluasi buffer inventaris.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 ml-auto shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handlePrintDocument(officialDocuments[0])}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs shadow-red-900/20 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Berita Acara (BAM)</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar & Tab Selector ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveReportTab('summary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'summary'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ringkasan Eksekutif
          </button>
          <button
            onClick={() => setActiveReportTab('documents')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'documents'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dokumen &amp; Berita Acara
          </button>
          <button
            onClick={() => setActiveReportTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analitik &amp; Tren Arus
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Site Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Site Tambang BIB</option>
              {INITIAL_SITES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="week">Pekan Ini (7 Hari Terakhir)</option>
              <option value="month">Bulan Ini (Oktober 2026)</option>
              <option value="quarter">Kuartal 3 - 4 (Tahun 2026)</option>
              <option value="year">Tahun Berjalan (2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4 Executive Parallelogram KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 py-1">
        <ParallelogramCard
          title="TOTAL PENERIMAAN (MOS)"
          value={String(metrics.totalInflowQty).padStart(2, '0')}
          unit="UNIT"
          subtitle="Penerimaan Fisik Masuk Site"
          subtitleIcon={PackageCheck}
          subtitleColor="text-emerald-700"
          icon={PackageCheck}
          iconColor="text-emerald-600"
          accentColor="border-emerald-600"
          valueColor="text-emerald-600"
        />

        <ParallelogramCard
          title="TOTAL PENGELUARAN (MR)"
          value={String(metrics.totalOutflowQty).padStart(2, '0')}
          unit="UNIT"
          subtitle="Material Keluar untuk Pemeliharaan"
          subtitleIcon={PackageMinus}
          subtitleColor="text-blue-700"
          icon={PackageMinus}
          iconColor="text-blue-600"
          accentColor="border-blue-600"
          valueColor="text-blue-600"
        />

        <ParallelogramCard
          title="AKURASI OPNAME FISIK"
          value="98.6"
          unit="%"
          subtitle="Tingkat Kesesuaian Rak Gudang"
          subtitleIcon={CheckCircle2}
          subtitleColor="text-amber-700"
          icon={CheckCircle2}
          iconColor="text-amber-600"
          accentColor="border-amber-600"
          valueColor="text-amber-600"
        />

        <ParallelogramCard
          title="TOTAL AKTIVITAS MUTASI"
          value={String(metrics.totalMovementQty).padStart(2, '0')}
          unit="ITEM"
          subtitle="Total Perputaran Fisik Suku Cadang"
          subtitleIcon={Boxes}
          subtitleColor="text-red-700"
          icon={Boxes}
          iconColor="text-red-600"
          accentColor="border-red-600"
          valueColor="text-red-600"
        />
      </div>

      {/* ── TAB CONTENT 1: RINGKASAN EKSEKUTIF ── */}
      {activeReportTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Trend Chart: Inflow vs Outflow */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    Tren Arus Material: Masuk (MOS) vs Keluar (MR)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbandingan kuantitas pergerakan barang suku cadang selama 6 bulan terakhir di site tambang
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-slate-600 font-medium text-[11px]">MOS (Masuk)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-slate-600 font-medium text-[11px]">MR (Keluar)</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="space-y-4 pt-2">
                {monthlyTrends.map((item, idx) => {
                  const maxVal = 120;
                  const mosWidth = Math.round((item.mos / maxVal) * 100);
                  const mrWidth = Math.round((item.mr / maxVal) * 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-800">
                        <span>{item.month}</span>
                        <span className="font-mono text-[11px] text-slate-500">{item.totalActivity}</span>
                      </div>
                      <div className="space-y-1">
                        {/* MOS bar */}
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${mosWidth}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-emerald-700 w-12 text-right">
                            +{item.mos} pcs
                          </span>
                        </div>
                        {/* MR bar */}
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${mrWidth}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-blue-700 w-12 text-right">
                            -{item.mr} pcs
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Distribusi Kategori Inventaris
                </h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Proporsi suku cadang terdata berdasarkan kelompok operasional
                </p>

                <div className="space-y-3.5">
                  {categoryDist.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate">{cat.name}</span>
                        <span className={`font-mono font-bold ${cat.text}`}>{cat.pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${cat.color} rounded-full`}
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] font-mono text-slate-400">
                        {cat.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="font-bold text-slate-900 mb-0.5">Catatan Evaluasi Audit</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Stok suku cadang unit Caterpillar 777D dan pelumas hidrolik memiliki rotasi keluar (MR) tertinggi untuk memenuhi target jam kerja alat berat.
                </p>
              </div>
            </div>
          </div>

          {/* Quick List of Official Documents */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-red-600" />
                  Dokumen Berita Acara &amp; Laporan Siap Cetak
                </h3>
                <p className="text-[11px] text-slate-500">
                  Dokumen laporan resmi yang telah ditandatangani secara digital dan siap untuk keperluan audit operasional
                </p>
              </div>
              <button
                onClick={() => setActiveReportTab('documents')}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua ({officialDocuments.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officialDocuments.slice(0, 2).map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-red-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        {doc.id}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {doc.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                      {doc.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">{doc.period}</span>
                    <button
                      onClick={() => handlePrintDocument(doc)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      Pratinjau &amp; Cetak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: DOKUMEN & BERITA ACARA ── */}
      {activeReportTab === 'documents' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Berita Acara &amp; Dokumen Resmi Logistik
                </h3>
                <p className="text-[11px] text-slate-500">
                  Dokumen standar legal tambang dengan stempel validasi dan tanda tangan 3-slot otorisasi
                </p>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Total {officialDocuments.length} Dokumen Tersedia
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {officialDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 pr-0 md:pr-4">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        {doc.id}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {doc.type}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {doc.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {doc.summary}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {doc.site}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {doc.period}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Otorisasi: {doc.signer}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handlePrintDocument(doc)}
                      className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-red-900/20 active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Buka &amp; Cetak</span>
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                      title="Unduh Data Mentah Excel"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: ANALITIK & TREN ARUS ── */}
      {activeReportTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Rasio Perputaran Stok (Turnover)
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">3.4x / Tahun</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Kategori cepat berputar: Fuel Filter, Oil Drum, &amp; Tooth Bucket
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Rasio Kesesuaian Fisik (Opname)
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">98.6% Sesuai</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Deviasi 1.4% diselesaikan melalui penyesuaian kartu stok digital
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Rata-rata Waktu Lead Time MOS
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono">3.2 Hari Kerja</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Dari penerimaan surat jalan vendor sampai verifikasi rak penyimpanan
              </p>
            </div>
          </div>

          {/* Site Operational Coverage */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Kapasitas &amp; Utilisasi Gudang Tambang Terintegrasi
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Tingkat keterisian rak pada masing-masing lokasi fasilitas penyimpanan site
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                  <span>Area Rak 1 (Pit Base)</span>
                  <span className="font-mono text-emerald-600">56%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '56%' }} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">134 / 240 Rak Terisi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                  <span>Area Rak 2 (Workshop)</span>
                  <span className="font-mono text-emerald-600">52%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '52%' }} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">95 / 180 Rak Terisi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                  <span>Area Rak 3 (Port Hub)</span>
                  <span className="font-mono text-emerald-600">55%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '55%' }} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">110 / 200 Rak Terisi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                  <span>Area Rak 4 (Angsana Depot)</span>
                  <span className="font-mono text-blue-600">40%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">48 / 120 Rak Terisi</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT & PREVIEW OFFICIAL DOCUMENT MODAL ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="font-bold text-sm leading-tight">Pratinjau Dokumen Berita Acara Resmi</h3>
                  <p className="text-[10px] font-mono text-slate-400">{previewDoc.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteBrowserPrint}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Paper Style) */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 print:p-0">
              {/* Formal Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <div className="text-lg font-black tracking-tight text-slate-900">
                    PT DIGITECH INVENTORY SYSTEMS
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    DEPARTEMEN LOGISTIK &amp; MATERIAL MANAGEMENT — SITE OPERASIONAL BIB
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Jl. Kodeco KM 24, Area Konsesi Batulicin, Tanah Bumbu, Kalimantan Selatan (WITA)
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-red-50 border border-red-300 text-red-700 font-mono text-xs font-black rounded">
                    DOKUMEN RESMI
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    ISO-9001:2026 AUDITED
                  </div>
                </div>
              </div>

              {/* Document Title Header */}
              <div className="text-center py-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                  {previewDoc.title}
                </h2>
                <p className="text-xs font-mono text-slate-600 mt-0.5">
                  Nomor Registrasi: <span className="font-bold text-red-700">{previewDoc.id}</span>
                </p>
              </div>

              {/* Meta Details Table */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Fasilitas / Site:</span>
                  <p className="font-bold text-slate-900">{previewDoc.site}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Periode Audit:</span>
                  <p className="font-bold text-slate-900">{previewDoc.period}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Klasifikasi Dokumen:</span>
                  <p className="font-bold text-slate-900">{previewDoc.type}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Status Validasi:</span>
                  <p className="font-bold text-emerald-700">{previewDoc.status}</p>
                </div>
              </div>

              {/* Content Description */}
              <div className="space-y-2 text-xs leading-relaxed text-slate-700">
                <p className="font-bold text-slate-900">Ringkasan Eksekutif &amp; Temuan:</p>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  {previewDoc.summary}
                </p>
              </div>

              {/* Sample Table in Document */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-mono text-[10px] uppercase text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Item Suku Cadang</th>
                      <th className="p-2.5">Part Number</th>
                      <th className="p-2.5 text-center">Fisik</th>
                      <th className="p-2.5 text-center">Sistem</th>
                      <th className="p-2.5 text-center">Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr>
                      <td className="p-2.5">01</td>
                      <td className="p-2.5 font-sans font-bold">Cat 777D Engine Oil Filter</td>
                      <td className="p-2.5 text-slate-500">BIB-CAT-777D-FLTR</td>
                      <td className="p-2.5 text-center font-bold">24 PCS</td>
                      <td className="p-2.5 text-center">24 PCS</td>
                      <td className="p-2.5 text-center text-emerald-600 font-bold">0</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">02</td>
                      <td className="p-2.5 font-sans font-bold">Komatsu PC2000 Seal Kit</td>
                      <td className="p-2.5 text-slate-500">BIB-KOM-PC2000-HYD</td>
                      <td className="p-2.5 text-center font-bold">18 SET</td>
                      <td className="p-2.5 text-center">18 SET</td>
                      <td className="p-2.5 text-center text-emerald-600 font-bold">0</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">03</td>
                      <td className="p-2.5 font-sans font-bold">Shell Tellus S2 V 68 Drum</td>
                      <td className="p-2.5 text-slate-500">BIB-LUB-SHL-T68</td>
                      <td className="p-2.5 text-center font-bold">6 DRUM</td>
                      <td className="p-2.5 text-center">6 DRUM</td>
                      <td className="p-2.5 text-center text-emerald-600 font-bold">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Official 3-Slot Signature Block */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="text-slate-500 text-[11px] mb-8">Dibuat Oleh (Staff Gudang):</p>
                  <p className="font-bold text-slate-900 border-b border-slate-300 pb-1">
                    {user?.full_name || 'Arya Staff'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Logistics Officer</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px] mb-8">Diperiksa (Supervisor Logistik):</p>
                  <p className="font-bold text-slate-900 border-b border-slate-300 pb-1">
                    Surya Hendrawan, S.T.
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Warehouse Supervisor</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px] mb-8">Disetujui (Kepala Operasional):</p>
                  <p className="font-bold text-slate-900 border-b border-slate-300 pb-1">
                    Ir. Bambang Prakoso
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Head of Site Operations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
