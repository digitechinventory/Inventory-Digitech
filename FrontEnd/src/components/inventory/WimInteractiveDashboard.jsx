import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Boxes,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Calendar,
  Tag,
  ArrowRightLeft,
  FileText,
  FileCheck2,
  HardHat,
  Warehouse,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import {
  getWimSummary,
  getWimComponents,
  getWimTransactions,
  getWimWarranty,
  getProjectDocuments
} from '../../api/projectInventoryApi';
import FullDocumentPreviewModal from '../common/FullDocumentPreviewModal';

const WIM_CATEGORIES = [
  'ALL',
  'Load Cell',
  'Saddle',
  'Baut Load Cell',
  'Mounting Platform LS',
  'Dudukan Load Cell',
  'Bolt Adjuster Platform',
  'Longrat Adjuster',
  'Ring Adjuster',
  'Rubber Adjuster',
  'Mur Adjuster',
  'Platform Low Speed',
  'Frame Low Speed',
  'Junction Box',
  'RFID Reader',
  'CCTV',
  'Strip Sensor High Speed',
  'Switch',
  'PLC',
  'Batterai Lithium',
  'WIM Logix HS',
  'WIM Logix LS',
  'Light Curtain',
  'Mini PC',
  'Stabilizer',
  'Inverter',
  'Loop Detector',
  'Resin Kit',
  'PSU',
  'History Static LS'
];

export default function WimInteractiveDashboard({ onOpenMos }) {
  // Navigation tabs: 'components' | 'lanes' | 'warranty' | 'transactions' | 'documents'
  const [activeTab, setActiveTab] = useState('components');

  // Summary State
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Components State (189 items)
  const [components, setComponents] = useState([]);
  const [compPagination, setCompPagination] = useState({ page: 1, limit: 30, total: 0, total_pages: 1 });
  const [compSearch, setCompSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [selectedLane, setSelectedLane] = useState('ALL');
  const [loadingComponents, setLoadingComponents] = useState(false);

  // Warranty State (41 items)
  const [warrantyItems, setWarrantyItems] = useState([]);
  const [warrantySearch, setWarrantySearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [loadingWarranty, setLoadingWarranty] = useState(false);

  // Transactions State (268 transactions)
  const [transactions, setTransactions] = useState([]);
  const [txPagination, setTxPagination] = useState({ page: 1, limit: 30, total: 0, total_pages: 1 });
  const [txSearch, setTxSearch] = useState('');
  const [txCategory, setTxCategory] = useState('ALL');
  const [txStockType, setTxStockType] = useState('ALL');
  const [loadingTx, setLoadingTx] = useState(false);

  // 8-Stage Documents State
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [selectedDocDetail, setSelectedDocDetail] = useState(null);

  // Modal Detail Item
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  // 1. Fetch Summary
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await getWimSummary();
      setSummary(res);
    } catch (err) {
      console.error('Error fetching WIM summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // 2. Fetch Components
  const fetchComponentsData = async (page = 1) => {
    try {
      setLoadingComponents(true);
      const res = await getWimComponents({
        page,
        limit: compPagination.limit,
        search: compSearch,
        category: selectedCategory,
        status: selectedStatus,
        condition: selectedCondition,
        lane: selectedLane
      });
      setComponents(res.components || []);
      setCompPagination(res.pagination || { page: 1, limit: 30, total: 0, total_pages: 1 });
    } catch (err) {
      console.error('Error fetching WIM components:', err);
    } finally {
      setLoadingComponents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'components' || activeTab === 'lanes') {
      fetchComponentsData(1);
    }
  }, [selectedCategory, selectedStatus, selectedCondition, selectedLane, activeTab]);

  useEffect(() => {
    if (activeTab !== 'components') return;
    const t = setTimeout(() => fetchComponentsData(1), 350);
    return () => clearTimeout(t);
  }, [compSearch]);

  // 3. Fetch Warranty
  const fetchWarrantyData = async () => {
    try {
      setLoadingWarranty(true);
      const res = await getWimWarranty({
        search: warrantySearch,
        section: selectedSection
      });
      setWarrantyItems(res.warranty_items || []);
    } catch (err) {
      console.error('Error fetching WIM warranty:', err);
    } finally {
      setLoadingWarranty(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'warranty') {
      fetchWarrantyData();
    }
  }, [selectedSection, activeTab]);

  useEffect(() => {
    if (activeTab !== 'warranty') return;
    const t = setTimeout(() => fetchWarrantyData(), 350);
    return () => clearTimeout(t);
  }, [warrantySearch]);

  // 4. Fetch Transactions
  const fetchTxData = async (page = 1) => {
    try {
      setLoadingTx(true);
      const res = await getWimTransactions({
        page,
        limit: txPagination.limit,
        search: txSearch,
        category: txCategory,
        stock_type: txStockType
      });
      setTransactions(res.transactions || []);
      setTxPagination(res.pagination || { page: 1, limit: 30, total: 0, total_pages: 1 });
    } catch (err) {
      console.error('Error fetching WIM transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTxData(1);
    }
  }, [txCategory, txStockType, activeTab]);

  useEffect(() => {
    if (activeTab !== 'transactions') return;
    const t = setTimeout(() => fetchTxData(1), 350);
    return () => clearTimeout(t);
  }, [txSearch]);

  // 5. Fetch 8-Stage Documents
  const fetchDocsData = async () => {
    try {
      setLoadingDocs(true);
      const res = await getProjectDocuments({
        project_id: 'proj-wim',
        stage_code: selectedStageFilter
      });
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Error fetching WIM documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocsData();
    }
  }, [selectedStageFilter, activeTab]);

  const STAGES_LIST = [
    { code: 'ALL', name: 'Semua 8 Tahap' },
    { code: 'RFI', num: 1, name: '1. RFI' },
    { code: 'PR', num: 2, name: '2. PR' },
    { code: 'PO', num: 3, name: '3. PO' },
    { code: 'Delivery', num: 4, name: '4. Ekspedisi / DO' },
    { code: 'MOS', num: 5, name: '5. MOS (Penerimaan Site)' },
    { code: 'QC', num: 6, name: '6. QC & Commissioning' },
    { code: 'Operational', num: 7, name: '7. Operasional & Pindahan' },
    { code: 'Decommissioning', num: 8, name: '8. Afkir' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Top Executive KPI Cards (Real WIM Dataset) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Komponen Fisik */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Total Komponen Real</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            {summary?.total_components ? Number(summary.total_components).toLocaleString('id-ID') : '189'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            28 Kategori Komponen Timbangan
          </div>
        </div>

        {/* Terpasang di Lane */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Terpasang di Lane</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">
            {summary?.by_status?.['Terpasang'] || 116} <span className="text-sm font-normal text-slate-400">unit</span>
          </div>
          <div className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
            <span className="font-bold">Lane 1:</span> {summary?.by_lane?.['Lane 1'] || 47} | <span className="font-bold">Lane 3:</span> {summary?.by_lane?.['Lane 3'] || 51}
          </div>
        </div>

        {/* Stok Gudang & Office */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Stok Gudang / Cadangan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {summary?.by_lane?.['Gudang / Office VGT'] || 70} <span className="text-sm font-normal text-slate-400">unit</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Office VGT &amp; Workshop KM 14
          </div>
        </div>

        {/* Item Katalog Garansi */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Katalog Garansi Resmi</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">
            {summary?.total_warranty_items || 41} <span className="text-sm font-normal text-slate-400">part</span>
          </div>
          <div className="text-[11px] text-purple-600 mt-1 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Lead time 1 s/d 3 bulan
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('components')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'components'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>Katalog Komponen Fisik ({summary?.total_components || 189})</span>
          </button>

          <button
            onClick={() => setActiveTab('lanes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'lanes'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Matrix Status Lane 1 &amp; 3</span>
          </button>

          <button
            onClick={() => setActiveTab('warranty')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'warranty'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Garansi &amp; Lead Time ({summary?.total_warranty_items || 41})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Log Mutasi Stok ({summary?.total_transactions || 268})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-white text-red-700 shadow-sm border border-red-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Dokumen 8 Tahap (Termasuk MOS)</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: KOMPONEN FISIK WIM (189 ITEM) ── */}
      {activeTab === 'components' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                  placeholder="Cari Serial, Nama, Model, PO..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                {WIM_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'Semua 28 Kategori' : c}</option>
                ))}
              </select>

              {/* Lane Filter */}
              <select
                value={selectedLane}
                onChange={(e) => setSelectedLane(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Semua Lane / Lokasi</option>
                <option value="Lane 1">Lane 1</option>
                <option value="Lane 3">Lane 3</option>
                <option value="Office VGT">Office VGT / Gudang</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="Terpasang">Terpasang</option>
                <option value="Dilepas">Dilepas</option>
                <option value="Ready">Ready / Spare</option>
              </select>

              {/* Condition Filter */}
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Semua Kondisi</option>
                <option value="Baru">Baru</option>
                <option value="Bekas">Bekas</option>
                <option value="Dummy">Dummy</option>
                <option value="Rusak">Rusak</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Ditemukan <span className="font-bold text-slate-800">{compPagination.total}</span> komponen
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="px-4 py-3">ID &amp; Serial Number</th>
                  <th className="px-4 py-3">Kategori &amp; Komponen</th>
                  <th className="px-4 py-3">Status &amp; Kondisi</th>
                  <th className="px-4 py-3">Lokasi / Lane</th>
                  <th className="px-4 py-3">Pindahan Dari Mana</th>
                  <th className="px-4 py-3">Timestamp Pasang / Lepas</th>
                  <th className="px-4 py-3">PO &amp; Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingComponents ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      Memuat daftar komponen WIM...
                    </td>
                  </tr>
                ) : components.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      Tidak ditemukan komponen dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  components.map((item) => {
                    const isTerpasang = item.status === 'Terpasang';
                    const isDilepas = item.status === 'Dilepas';
                    const isBaru = item.condition === 'Baru';
                    const isPindahan = item.is_pindahan || (item.transferred_from && item.transferred_from !== '-');

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-slate-900 text-xs">{item.serial_number}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.item_code}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] border border-emerald-200 mb-0.5">
                            {item.category}
                          </span>
                          <div className="text-xs text-slate-700 font-medium truncate max-w-[200px]">{item.name}</div>
                          {item.model_type && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.model_type}</div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                              isTerpasang
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : (isDilepas ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200')
                            }`}>
                              {item.status}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                              isBaru ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.condition}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono">
                          <div className="font-bold text-slate-800">{item.lane !== '-' ? item.lane : item.location}</div>
                          <div className="text-[10px] text-slate-400">{item.location}</div>
                        </td>

                        <td className="px-4 py-3">
                          {isPindahan ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-mono font-bold text-[10px] border border-purple-200">
                              <ArrowRightLeft className="w-3 h-3 text-purple-600" />
                              {item.transferred_from !== '-' ? item.transferred_from : 'Pindahan Antar-Lane'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-600 text-[10px]">
                          <div>Pasang: <span className="font-bold text-slate-800">{item.tanggal_instal !== '-' ? item.tanggal_instal : '-'}</span></div>
                          <div>Lepas: <span className="font-bold text-amber-700">{item.tanggal_dismantle !== '-' ? item.tanggal_dismantle : '-'}</span></div>
                          {item.tanggal_onsite !== '-' && (
                            <div className="text-slate-400">Onsite: {item.tanggal_onsite}</div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs">
                          {item.po_number && item.po_number !== '-' && (
                            <div className="font-mono text-[10px] font-bold text-blue-600 mb-0.5">PO: {item.po_number}</div>
                          )}
                          <div className="truncate">{item.notes || '-'}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono">
              Halaman {compPagination.page} dari {compPagination.total_pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={compPagination.page <= 1 || loadingComponents}
                onClick={() => fetchComponentsData(compPagination.page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Sebelumnya
              </button>
              <button
                disabled={compPagination.page >= compPagination.total_pages || loadingComponents}
                onClick={() => fetchComponentsData(compPagination.page + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                Berikutnya <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MATRIX STATUS LANE 1 & 3 ── */}
      {activeTab === 'lanes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lane 1 Weighbridge */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Jembatan Timbang WIM — Lane 1</h3>
                    <p className="text-xs text-slate-500">Pit Sebamban KM-14 (Low Speed WIM 50T)</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  OPTIMAL (4/4 Loadcell)
                </span>
              </div>

              {/* Weighbridge Platform Visualization */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="text-xs font-mono text-slate-600 flex items-center justify-between">
                  <span className="font-bold text-slate-800">PLATFORM LOW SPEED 50T</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Status Normal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  {/* Loadcell 1 */}
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-mono font-bold text-slate-500">POSISI DEPAN KIRI</div>
                    <div className="font-bold text-xs text-emerald-800 mt-1">Loadcell #1</div>
                    <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">SN: 91913187</div>
                    <div className="text-[10px] text-slate-500">Intercomp Shear Beam (Baru)</div>
                  </div>

                  {/* Loadcell 2 */}
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-mono font-bold text-slate-500">POSISI DEPAN KANAN</div>
                    <div className="font-bold text-xs text-emerald-800 mt-1">Loadcell #2</div>
                    <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">SN: 92309683</div>
                    <div className="text-[10px] text-slate-500">Intercomp Shear Beam (Baru)</div>
                  </div>

                  {/* Loadcell 3 */}
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-mono font-bold text-slate-500">POSISI BELAKANG KIRI</div>
                    <div className="font-bold text-xs text-emerald-800 mt-1">Loadcell #3</div>
                    <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">SN: 92285794</div>
                    <div className="text-[10px] text-slate-500">Intercomp Shear Beam (Baru)</div>
                  </div>

                  {/* Loadcell 4 */}
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-mono font-bold text-slate-500">POSISI BELAKANG KANAN</div>
                    <div className="font-bold text-xs text-emerald-800 mt-1">Loadcell #4</div>
                    <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">SN: 91913138</div>
                    <div className="text-[10px] text-slate-500">Intercomp Shear Beam (Baru)</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono pt-1">
                  <span>Junction Box: Summing Box VGT241</span>
                  <span>CPU: WIM Logix LS</span>
                </div>
              </div>
            </div>

            {/* Lane 3 Weighbridge */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Jembatan Timbang WIM — Lane 3</h3>
                    <p className="text-xs text-slate-500">Pit Sebamban KM-14 (Low Speed WIM 50T)</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  OPTIMAL (4/4 Loadcell)
                </span>
              </div>

              {/* Weighbridge Platform Visualization */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="text-xs font-mono text-slate-600 flex items-center justify-between">
                  <span className="font-bold text-slate-800">PLATFORM LOW SPEED 50T</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Status Normal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  {/* Loadcell 1 */}
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-mono font-bold text-slate-500">POSISI DEPAN KIRI</div>
                    <div className="font-bold text-xs text-emerald-800 mt-1">Loadcell #1</div>
                    <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">SN: 92309753</div>
                    <div className="text-[10px] text-slate-500">Intercomp Shear Beam (Baru)</div>
                  </div>

                  {/* Loadcell 2 */}
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-mono font-bold text-slate-500">POSISI DEPAN KANAN</div>
                    <div className="font-bold text-xs text-emerald-800 mt-1">Loadcell #2</div>
                    <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">SN: 91913125</div>
                    <div className="text-[10px] text-slate-500">Intercomp Shear Beam (Baru)</div>
                  </div>

                  {/* Loadcell 3 */}
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-mono font-bold text-slate-500">POSISI BELAKANG KIRI</div>
                    <div className="font-bold text-xs text-emerald-800 mt-1">Loadcell #3</div>
                    <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">SN: 92309685</div>
                    <div className="text-[10px] text-slate-500">Intercomp Shear Beam (Baru)</div>
                  </div>

                  {/* Loadcell 4 */}
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-mono font-bold text-slate-500">POSISI BELAKANG KANAN</div>
                    <div className="font-bold text-xs text-emerald-800 mt-1">Loadcell #4</div>
                    <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">SN: 92285792</div>
                    <div className="text-[10px] text-slate-500">Intercomp Shear Beam (Baru)</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono pt-1">
                  <span>Junction Box: Summing Box VGT241</span>
                  <span>CPU: WIM Logix LS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: GARANSI & LEAD TIME SPAREPART (41 ITEM) ── */}
      {activeTab === 'warranty' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={warrantySearch}
                  onChange={(e) => setWarrantySearch(e.target.value)}
                  placeholder="Cari part number atau nama sparepart..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:bg-white transition"
                />
              </div>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Semua Sektor Perangkat</option>
                <option value="Sensor High Speed">Sensor High Speed (HS)</option>
                <option value="Sensor Low Speed">Sensor Low Speed (LS)</option>
                <option value="Sensor Light Curtain">Sensor Light Curtain (LC)</option>
                <option value="RFID Reader">RFID Reader</option>
                <option value="CCTV">CCTV</option>
                <option value="PC & Server">PC &amp; Server</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Total <span className="font-bold text-slate-800">{warrantyItems.length}</span> item terdata dari lembar resmi
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="px-4 py-3">Part Number (VGT)</th>
                  <th className="px-4 py-3">Nama Item Sparepart</th>
                  <th className="px-4 py-3">Sektor Komponen</th>
                  <th className="px-4 py-3 text-center">Estimasi 2 Thn</th>
                  <th className="px-4 py-3">Waktu Tunggu (Lead Time)</th>
                  <th className="px-4 py-3">Masa Garansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingWarranty ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
                      Memuat katalog garansi sparepart WIM...
                    </td>
                  </tr>
                ) : warrantyItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      Tidak ditemukan data garansi dengan kata kunci tersebut.
                    </td>
                  </tr>
                ) : (
                  warrantyItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.part_number}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.item_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                          {item.section}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                        {item.qty_estimated_2yr}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
                          {item.lead_time || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                          {item.warranty_period || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: LOG MUTASI STOK WIM (268 TRANSAKSI) ── */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Cari transaksi, tindakan, keterangan..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition"
                />
              </div>

              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                {WIM_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'Semua Kategori' : c}</option>
                ))}
              </select>

              <select
                value={txStockType}
                onChange={(e) => setTxStockType(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Semua Tipe Stok</option>
                <option value="BARU">Stock Baru</option>
                <option value="DUMMY">Stock Dummy / Bekas</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Total <span className="font-bold text-slate-800">{txPagination.total}</span> riwayat mutasi
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Tipe Stok</th>
                  <th className="px-4 py-3 text-center">Masuk (In)</th>
                  <th className="px-4 py-3 text-center">Keluar (Out)</th>
                  <th className="px-4 py-3">Tindakan / Action</th>
                  <th className="px-4 py-3">Lane Penggunaan</th>
                  <th className="px-4 py-3 text-center">Saldo Akhir</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingTx ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
                      Memuat data log transaksi...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      Tidak ditemukan riwayat mutasi dengan filter pencarian tersebut.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{tx.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{tx.category}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                          tx.stock_type === 'BARU' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {tx.stock_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">
                        {tx.qty_in > 0 ? `+${tx.qty_in}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">
                        {tx.qty_out > 0 ? `-${tx.qty_out}` : '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{tx.action}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{tx.lane}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                        {tx.final_stock}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px] max-w-xs truncate">{tx.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono">
              Halaman {txPagination.page} dari {txPagination.total_pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={txPagination.page <= 1 || loadingTx}
                onClick={() => fetchTxData(txPagination.page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Sebelumnya
              </button>
              <button
                disabled={txPagination.page >= txPagination.total_pages || loadingTx}
                onClick={() => fetchTxData(txPagination.page + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                Berikutnya <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: DOKUMEN 8 TAHAP SIKLUS ASET WIM (TERMASUK MOS) ── */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Header & Stage Pipeline */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Alur 8 Tahap Dokumen Siklus Aset Project WIM
                </h3>
                <p className="text-xs text-slate-500">
                  Prinsip "No Document, No Movement": Setiap pengadaan, penerimaan MOS, hingga afkir wajib memiliki berkas digital sah.
                </p>
              </div>

              {onOpenMos && (
                <button
                  onClick={onOpenMos}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Buka Portal Otorisasi MOS
                </button>
              )}
            </div>

            {/* Stage Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {STAGES_LIST.map((st) => {
                const isSelected = selectedStageFilter === st.code;
                return (
                  <button
                    key={st.code}
                    onClick={() => setSelectedStageFilter(st.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-red-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Documents Grid / List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingDocs ? (
              <div className="col-span-2 p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-red-600" />
                Memuat dokumen 8 tahap WIM...
              </div>
            ) : documents.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                Tidak ada dokumen pada tahap ini.
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:border-red-300 transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-mono font-bold text-[10px] border border-red-200">
                          Tahap {doc.stage_number}: {doc.stage_code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          doc.status === 'Completed' || doc.status === 'Approved' || doc.status === 'Certified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition">
                        {doc.title}
                      </h4>
                      <p className="font-mono text-xs text-slate-500 font-semibold">{doc.doc_number}</p>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      {doc.stage_number}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{doc.summary}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                    <div>Tgl: {doc.created_date} | Pembuat: {doc.creator_name}</div>
                    <div className="flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {doc.signatures_count}/{doc.required_signatures} Tanda Tangan
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedDocDetail(doc)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      Buka Lembar Dokumen
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Modal Pratinjau Dokumen Penuh & Berkas Fisik (PDF / Gambar) ── */}
      <FullDocumentPreviewModal
        isOpen={Boolean(selectedDocDetail)}
        onClose={() => setSelectedDocDetail(null)}
        document={selectedDocDetail}
        onDocumentUpdated={(updated) => {
          setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
          setSelectedDocDetail(updated);
        }}
      />
    </div>
  );
}
