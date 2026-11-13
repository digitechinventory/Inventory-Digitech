import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Scale,
  Boxes,
  Cpu,
  Layers,
  CheckCircle2,
  Check,
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
  ChevronDown,
  Info,
  X,
  ShieldAlert,
  Plus,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
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

// Data Rekapitulasi 28 Sheet Control Stock Part WIM (2. Detail_Control_Stock_Part_WIM.xlsx)
const WIM_CONTROL_STOCK_DATA = [
  { category: 'Load Cell', baru_in: 38, baru_out: 40, sisa_baru: 4, status_baru: 'Ready', bekas_in: 14, bekas_out: 8, sisa_bekas: 6, status_bekas: 'Ready', terpasang: 10, dilepas: 18, spare: 0 },
  { category: 'Saddle', baru_in: 24, baru_out: 26, sisa_baru: 0, status_baru: 'Out of Stock', bekas_in: 19, bekas_out: 4, sisa_bekas: 15, status_bekas: 'Ready', terpasang: 8, dilepas: 15, spare: 0 },
  { category: 'Strip Sensor High Speed', baru_in: 28, baru_out: 24, sisa_baru: 4, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 24, dilepas: 0, spare: 4 },
  { category: 'Dudukan Load Cell', baru_in: 16, baru_out: 13, sisa_baru: 3, status_baru: 'Ready', bekas_in: 9, bekas_out: 4, sisa_bekas: 5, status_bekas: 'Ready', terpasang: 12, dilepas: 8, spare: 3 },
  { category: 'Mounting Platform LS', baru_in: 20, baru_out: 12, sisa_baru: 8, status_baru: 'Ready', bekas_in: 4, bekas_out: 0, sisa_bekas: 4, status_bekas: 'Ready', terpasang: 8, dilepas: 4, spare: 8 },
  { category: 'Light Curtain', baru_in: 12, baru_out: 12, sisa_baru: 0, status_baru: 'Out of Stock', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 10, dilepas: 6, spare: 0 },
  { category: 'Mini PC', baru_in: 8, baru_out: 7, sisa_baru: 1, status_baru: 'Ready', bekas_in: 1, bekas_out: 0, sisa_bekas: 1, status_bekas: 'Ready', terpasang: 6, dilepas: 1, spare: 1 },
  { category: 'RFID Reader', baru_in: 7, baru_out: 7, sisa_baru: 0, status_baru: 'Out of Stock', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 5, dilepas: 2, spare: 0 },
  { category: 'Loop Detector', baru_in: 7, baru_out: 5, sisa_baru: 2, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 5, dilepas: 0, spare: 2 },
  { category: 'CCTV', baru_in: 6, baru_out: 5, sisa_baru: 1, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 5, dilepas: 0, spare: 1 },
  { category: 'Batterai Lithium', baru_in: 5, baru_out: 5, sisa_baru: 0, status_baru: 'Out of Stock', bekas_in: 2, bekas_out: 2, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 3, dilepas: 2, spare: 0 },
  { category: 'Switch', baru_in: 5, baru_out: 4, sisa_baru: 1, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 3, dilepas: 1, spare: 1 },
  { category: 'Inverter', baru_in: 5, baru_out: 4, sisa_baru: 1, status_baru: 'Ready', bekas_in: 1, bekas_out: 1, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 3, dilepas: 1, spare: 1 },
  { category: 'Frame Low Speed', baru_in: 4, baru_out: 3, sisa_baru: 1, status_baru: 'Ready', bekas_in: 1, bekas_out: 0, sisa_bekas: 1, status_bekas: 'Ready', terpasang: 2, dilepas: 1, spare: 1 },
  { category: 'Platform Low Speed', baru_in: 3, baru_out: 3, sisa_baru: 0, status_baru: 'Out of Stock', bekas_in: 1, bekas_out: 0, sisa_bekas: 1, status_bekas: 'Ready', terpasang: 2, dilepas: 1, spare: 0 },
  { category: 'PLC', baru_in: 3, baru_out: 3, sisa_baru: 0, status_baru: 'Out of Stock', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 3, dilepas: 0, spare: 0 },
  { category: 'WIM Logix HS', baru_in: 3, baru_out: 3, sisa_baru: 0, status_baru: 'Out of Stock', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 3, dilepas: 0, spare: 0 },
  { category: 'WIM Logix LS', baru_in: 3, baru_out: 2, sisa_baru: 1, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 2, dilepas: 0, spare: 1 },
  { category: 'Stabilizer', baru_in: 3, baru_out: 3, sisa_baru: 0, status_baru: 'Out of Stock', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 3, dilepas: 0, spare: 0 },
  { category: 'Resin Kit', baru_in: 3, baru_out: 0, sisa_baru: 3, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 0, dilepas: 0, spare: 3 },
  { category: 'PSU', baru_in: 2, baru_out: 2, sisa_baru: 0, status_baru: 'Out of Stock', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 2, dilepas: 0, spare: 0 },
  { category: 'Baut Load Cell', baru_in: 81, baru_out: 41, sisa_baru: 40, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 0, dilepas: 0, spare: 0 },
  { category: 'Ring Adjuster', baru_in: 44, baru_out: 24, sisa_baru: 20, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 0, dilepas: 0, spare: 0 },
  { category: 'Mur Adjuster', baru_in: 40, baru_out: 36, sisa_baru: 4, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 0, dilepas: 0, spare: 0 },
  { category: 'Rubber Adjuster', baru_in: 20, baru_out: 12, sisa_baru: 8, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 0, dilepas: 0, spare: 0 },
  { category: 'Bolt Adjuster Platform', baru_in: 16, baru_out: 8, sisa_baru: 8, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 0, dilepas: 0, spare: 0 },
  { category: 'Longrat Adjuster', baru_in: 12, baru_out: 6, sisa_baru: 6, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 0, dilepas: 0, spare: 0 },
  { category: 'Junction Box', baru_in: 3, baru_out: 2, sisa_baru: 1, status_baru: 'Ready', bekas_in: 0, bekas_out: 0, sisa_bekas: 0, status_bekas: 'Out of Stock', terpasang: 0, dilepas: 0, spare: 0 }
];

const WIM_CONDITION_DATA = [
  { name: 'Baru', value: 140, color: '#10b981' },
  { name: 'Aus', value: 19, color: '#f59e0b' },
  { name: 'Rusak', value: 13, color: '#ef4444' },
  { name: 'Bekas', value: 7, color: '#3b82f6' },
  { name: 'Dummy', value: 6, color: '#8b5cf6' },
  { name: 'Belum dipakai', value: 3, color: '#06b6d4' },
  { name: 'Patah', value: 1, color: '#f43f5e' }
];

const WIM_LANE_DATA = [
  { name: 'Gudang / Office VGT', value: 70, color: '#f59e0b' },
  { name: 'Lane 3 (KM-14)', value: 51, color: '#3b82f6' },
  { name: 'Lane 1 (KM-14)', value: 47, color: '#10b981' },
  { name: 'Office HO / Lainnya', value: 21, color: '#64748b' }
];

const WIM_WARRANTY_SECTOR_DATA = [
  { sector: 'Sensor Low Speed (LS)', short: 'Sensor LS', jenis_item: 17, estimasi_2thn: 459, lead_1bln: 12, lead_3bln: 5 },
  { sector: 'PC & Server', short: 'PC & Server', jenis_item: 11, estimasi_2thn: 100, lead_1bln: 11, lead_3bln: 0 },
  { sector: 'Sensor High Speed (HS)', short: 'Sensor HS', jenis_item: 5, estimasi_2thn: 60, lead_1bln: 2, lead_3bln: 3 },
  { sector: 'Sensor Light Curtain (LC)', short: 'Light Curtain', jenis_item: 3, estimasi_2thn: 8, lead_1bln: 2, lead_3bln: 1 },
  { sector: 'RFID Reader', short: 'RFID Reader', jenis_item: 2, estimasi_2thn: 804, lead_1bln: 2, lead_3bln: 0 },
  { sector: 'CCTV', short: 'CCTV', jenis_item: 2, estimasi_2thn: 12, lead_1bln: 2, lead_3bln: 0 }
];

export default function WimInteractiveDashboard({ onOpenDocuments, onOpenMos }) {
  const navigate = useNavigate();
  // Navigation tabs: 'components' | 'lanes' | 'warranty' | 'transactions' | 'documents'
  const [activeTab, setActiveTab] = useState('components');
  // Chart View Mode: 'distribusi' | 'mutasi' | 'garansi'
  const [wimChartView, setWimChartView] = useState('distribusi');

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
      const rawItems = res.warranty_items || [];
      const normalized = rawItems
        .filter((it) => it && it.item_name !== 'Nama Item' && it.part_number !== 'Part Number')
        .map((it) => {
          // Normalize if legacy shifted columns exist
          if (it.section === 'General' && typeof it.qty_estimated_2yr === 'string' && isNaN(Number(it.qty_estimated_2yr))) {
            return {
              ...it,
              part_number: it.item_name,
              item_name: it.qty_estimated_2yr,
              qty_estimated_2yr: Number(it.lead_time) || 2,
              lead_time: String(it.warranty_period || '1 Bulan'),
              warranty_period: '1 Tahun'
            };
          }
          return it;
        });
      setWarrantyItems(normalized);
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
    { code: 'ALL', name: 'Semua Dokumen' },
    { code: 'RFI', name: 'RFI' },
    { code: 'PR', name: 'PR' },
    { code: 'PO', name: 'PO' },
    { code: 'Delivery', name: 'Ekspedisi / DO' },
    { code: 'MOS', name: 'Material On-Site (MOS)' },
    { code: 'QC', name: 'QC & Commissioning' },
    { code: 'Operational', name: 'Operasional & Relokasi' },
    { code: 'Decommissioning', name: 'Decommissioning' },
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
            {summary?.by_lane?.['Gudang / Site Office'] || summary?.by_lane?.['Gudang Buffer'] || summary?.by_lane?.['Gudang'] || 70} <span className="text-sm font-normal text-slate-400">unit</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Gudang Buffer &amp; Workshop KM 14
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

      {/* ── Visualisasi Interaktif Control Stock Part WIM (28 Kategori & Garansi) ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Visualisasi Data Control Stock Part WIM
            </h3>
            <p className="text-xs text-slate-500">
              Grafik rekapitulasi status komponen fisik, mutasi stok baru vs bekas/dummy (28 sheet komponen), dan estimasi garansi sparepart WIM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setWimChartView('distribusi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                wimChartView === 'distribusi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Distribusi Status &amp; Kondisi
            </button>
            <button
              type="button"
              onClick={() => setWimChartView('mutasi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                wimChartView === 'mutasi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Control Stock (Baru vs Bekas)
            </button>
            <button
              type="button"
              onClick={() => setWimChartView('garansi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                wimChartView === 'garansi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Garansi &amp; Estimasi 2 Tahun
            </button>
          </div>
        </div>

        {/* View 1: Distribusi Status Komponen Fisik + Kondisi + Lokasi Lane */}
        {wimChartView === 'distribusi' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Bar Chart Status per Kategori */}
            <div className="lg:col-span-2 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                    Distribusi Komponen Fisik WIM per Kategori (Terpasang, Dilepas &amp; Sisa Stock)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Klik batang grafik untuk menyaring tabel komponen di bawah berdasarkan kategori
                  </p>
                </div>
                {selectedCategory !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold cursor-pointer hover:bg-emerald-100"
                  >
                    Filter Aktif: {selectedCategory} &times;
                  </button>
                )}
              </div>

              <div className="h-[310px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={WIM_CONTROL_STOCK_DATA.slice(0, 18)}
                    margin={{ top: 10, right: 12, left: -10, bottom: 55 }}
                    onClick={(state) => {
                      if (state && state.activeLabel) {
                        setSelectedCategory(state.activeLabel);
                        setActiveTab('components');
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="category"
                      angle={-32}
                      textAnchor="end"
                      interval={0}
                      height={65}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#334155' }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '6px' }} />
                    <Bar dataKey="terpasang" name="Terpasang di Lane" fill="#10b981" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                    <Bar dataKey="dilepas" name="Dilepas (Dismantle)" fill="#f59e0b" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                    <Bar dataKey="sisa_baru" name="Sisa Stock Baru" fill="#3b82f6" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                    <Bar dataKey="sisa_bekas" name="Sisa Stock Bekas/Dummy" fill="#8b5cf6" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side Breakdown: Kondisi Fisik & Sebaran Lokasi */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-emerald-600" />
                  Komposisi Kondisi Fisik (189 Unit)
                </h4>
                <div className="h-[155px] w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={WIM_CONDITION_DATA}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={60}
                        paddingAngle={2}
                      >
                        {WIM_CONDITION_DATA.map((entry, index) => (
                          <Cell key={`cond-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} unit`, 'Jumlah']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {WIM_CONDITION_DATA.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-2.5 py-1 bg-white rounded-lg border border-slate-200/80 text-[11px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                  Sebaran Posisi &amp; Lane WIM
                </div>
                <div className="space-y-1.5">
                  {WIM_LANE_DATA.map((lane, idx) => {
                    const pct = Math.round((lane.value / 189) * 100);
                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700">{lane.name}</span>
                          <span className="font-mono font-bold text-slate-900">{lane.value} unit ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: lane.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Mutasi Control Stock (Baru vs Bekas/Dummy) dari 28 Sheet */}
        {wimChartView === 'mutasi' && (
          <div className="space-y-4">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                    Grafik Mutasi Control Stock Part WIM (Barang Masuk, Keluar &amp; Sisa Stock)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Data riil rekapitulasi 28 lembar kerja (sheet) pada file 2. Detail_Control_Stock_Part_WIM.xlsx
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    Ready: {WIM_CONTROL_STOCK_DATA.filter(d => d.status_baru === 'Ready').length} Kategori
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                    Out of Stock: {WIM_CONTROL_STOCK_DATA.filter(d => d.status_baru === 'Out of Stock').length} Kategori
                  </span>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={WIM_CONTROL_STOCK_DATA}
                    margin={{ top: 10, right: 12, left: -10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="category"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      height={70}
                      tick={{ fontSize: 9.5, fontWeight: 700, fill: '#334155' }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '6px' }} />
                    <Bar dataKey="baru_in" name="Stock Baru Masuk (In)" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="baru_out" name="Stock Baru Keluar (Out)" fill="#f97316" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="sisa_baru" name="Sisa Stock Baru" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="sisa_bekas" name="Sisa Stock Bekas/Dummy" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabel Rekapitulasi Control Stock 28 Kategori */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[280px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase">
                    <th className="px-3.5 py-2.5">Kategori Part WIM (28 Sheet)</th>
                    <th className="px-3 py-2.5 text-center">Baru Masuk</th>
                    <th className="px-3 py-2.5 text-center">Baru Keluar</th>
                    <th className="px-3 py-2.5 text-center">Sisa Stock Baru</th>
                    <th className="px-3 py-2.5 text-center">Status Stock Baru</th>
                    <th className="px-3 py-2.5 text-center">Sisa Bekas / Dummy</th>
                    <th className="px-3 py-2.5 text-center">Terpasang</th>
                    <th className="px-3 py-2.5 text-center">Dilepas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {WIM_CONTROL_STOCK_DATA.map((row) => (
                    <tr
                      key={row.category}
                      onClick={() => {
                        setSelectedCategory(row.category);
                        setActiveTab('components');
                      }}
                      className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-3.5 py-2 font-bold text-slate-900">{row.category}</td>
                      <td className="px-3 py-2 text-center font-mono text-sky-700 font-semibold">{row.baru_in}</td>
                      <td className="px-3 py-2 text-center font-mono text-orange-700 font-semibold">{row.baru_out}</td>
                      <td className="px-3 py-2 text-center font-mono font-extrabold text-emerald-700 bg-emerald-50/40">{row.sisa_baru}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          row.status_baru === 'Ready'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {row.status_baru}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-purple-700">{row.sisa_bekas}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-blue-700">{row.terpasang}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-amber-700">{row.dilepas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 3: Visualisasi Garansi & Estimasi 2 Tahun (Sheet Warranty Sparepart) */}
        {wimChartView === 'garansi' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                  Jumlah Item Garansi &amp; Waktu Tunggu (Lead Time) per Sektor WIM
                </h4>
                <p className="text-[11px] text-slate-500">
                  Perbandingan item dengan waktu tunggu pengadaan 1 Bulan vs 3 Bulan (Garansi 1 Tahun)
                </p>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={WIM_WARRANTY_SECTOR_DATA}
                    margin={{ top: 10, right: 12, left: -10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="short" tick={{ fontSize: 10.5, fontWeight: 700, fill: '#334155' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                    <Bar dataKey="jenis_item" name="Total Jenis Sparepart" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lead_1bln" name="Lead Time 1 Bulan" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lead_3bln" name="Lead Time 3 Bulan" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                  Rekapitulasi Estimasi Kebutuhan Sparepart 2 Tahun per Sektor
                </h4>
                <p className="text-[11px] text-slate-500">
                  Klik baris sektor untuk langsung membuka tab Garansi &amp; Lead Time sesuai sektor
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase">
                      <th className="px-3.5 py-2.5">Sektor Perangkat WIM</th>
                      <th className="px-3 py-2.5 text-center">Jenis Item</th>
                      <th className="px-3 py-2.5 text-center">Estimasi 2 Thn</th>
                      <th className="px-3 py-2.5 text-center">Lead Time 1 Bln</th>
                      <th className="px-3 py-2.5 text-center">Lead Time 3 Bln</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {WIM_WARRANTY_SECTOR_DATA.map((sec) => (
                      <tr
                        key={sec.sector}
                        onClick={() => {
                          setSelectedSection(sec.sector.replace(' (LS)', '').replace(' (HS)', '').replace(' (LC)', ''));
                          setActiveTab('warranty');
                        }}
                        className="hover:bg-purple-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-3.5 py-2.5 font-bold text-slate-800">{sec.sector}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-purple-700">{sec.jenis_item} item</td>
                        <td className="px-3 py-2.5 text-center font-mono font-extrabold text-slate-900">{sec.estimasi_2thn} pcs</td>
                        <td className="px-3 py-2.5 text-center font-mono text-emerald-700 font-semibold">{sec.lead_1bln}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-amber-700 font-semibold">{sec.lead_3bln}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                <span>Sumber: Sheet Warranty Sparepart (40 Jenis Part Resmi)</span>
                <span className="font-bold text-emerald-700">Masa Garansi Standar: 1 Tahun</span>
              </div>
            </div>
          </div>
        )}
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
            <span>Dokumen Operasional &amp; MOS</span>
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
                <option value="Gudang">Gudang Site / Buffer</option>
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

            <div className="flex items-center gap-3 ml-auto">
              <div className="text-xs text-slate-500 font-medium">
                Ditemukan <span className="font-bold text-slate-800">{compPagination.total}</span> komponen
              </div>

              <button
                type="button"
                onClick={() => navigate('/mos?project=wim&action=create_mos')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 transition cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                title="Input penerimaan barang baru via Dokumen Berita Acara MOS"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Komponen</span>
              </button>
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
                  <th className="px-4 py-3 text-center">Aksi &amp; Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingComponents ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      Memuat daftar komponen WIM...
                    </td>
                  </tr>
                ) : components.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
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
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemDetail(item)}
                        className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">{item.serial_number}</div>
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-mono font-bold text-[10px] border border-purple-200 shadow-2xs">
                              <ArrowRightLeft className="w-3 h-3 text-purple-600" />
                              <span className="font-bold">{item.transferred_from !== '-' ? item.transferred_from : 'Pindahan Antar-Lane'}</span>
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

                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedItemDetail(item)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-200 transition flex items-center gap-1 mx-auto cursor-pointer"
                            title="Buka rincian spesifikasi & bukti"
                          >
                            <Info className="w-3 h-3 text-emerald-600" />
                            Detail
                          </button>
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
                  <span>Junction Box: Summing Box JB-241</span>
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
                  <span>Junction Box: Summing Box JB-241</span>
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
                  <th className="px-4 py-3">Part Number</th>
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

      {/* ── TAB 5: DOKUMEN OPERASIONAL WIM (TERMASUK MOS) ── */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Header & Stage Pipeline */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Dokumentasi Operasional Project WIM
                </h3>
                <p className="text-xs text-slate-500">
                  Prinsip "No Document, No Movement": Setiap pengadaan, penerimaan MOS, hingga decommissioning wajib memiliki berkas digital sah.
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
                Memuat dokumen operasional WIM...
              </div>
            ) : documents.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                Tidak ada dokumen pada kategori ini.
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
                          {doc.stage_code}
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

      {/* ── Modal Detail Komponen WIM & Tracking Histori ── */}
      {selectedItemDetail && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] my-auto overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 pt-1">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs shrink-0 bg-slate-100 text-slate-700 border border-slate-200">
                  <Scale className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      {selectedItemDetail.category}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                      {selectedItemDetail.status}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      Kondisi: {selectedItemDetail.condition}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedItemDetail.name}</h3>
                  <p className="text-xs font-mono text-slate-500">
                    Serial Number: <span className="font-bold text-slate-800">{selectedItemDetail.serial_number}</span> | Kode: {selectedItemDetail.item_code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Alasan Dismantle / Status Kondisi */}
            <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 text-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase font-mono tracking-wider text-slate-800">
                {selectedItemDetail.status === 'Dilepas' ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Alasan Dismantle: Pelepasan Komponen &amp; Penggantian Suku Cadang</span>
                  </>
                ) : selectedItemDetail.is_pindahan ? (
                  <>
                    <ArrowRightLeft className="w-4 h-4 text-red-600" />
                    <span>Alasan Dismantle: Mutasi Antar Jembatan Timbang / Lane</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Status Operasional: Terpasang Aktif di Jembatan Timbang</span>
                  </>
                )}
              </div>

              <div className="text-xs leading-relaxed font-normal text-slate-700">
                {selectedItemDetail.status === 'Dilepas' ? (
                  <div>
                    Komponen ini telah dibongkar/dilepas (dismantle) dari platform jembatan timbang karena proses kalibrasi, pemeliharaan rutin, atau penggantian dengan part baru.
                    {selectedItemDetail.notes && selectedItemDetail.notes !== '-' && (
                      <div className="mt-2.5 p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
                        <span className="font-bold text-slate-900">Keterangan Catatan Lapangan:</span> "{selectedItemDetail.notes}"
                      </div>
                    )}
                  </div>
                ) : selectedItemDetail.is_pindahan ? (
                  <div>
                    Komponen ini sebelumnya dimutasi dari posisi{' '}
                    <span className="font-bold font-mono bg-slate-200 text-slate-900 px-2 py-0.5 rounded border border-slate-300">
                      {selectedItemDetail.transferred_from}
                    </span>{' '}
                    menuju alokasi timbangan WIM terkini.
                  </div>
                ) : (
                  <div>
                    Komponen beroperasi normal dan terpasang kokoh pada{' '}
                    <span className="font-bold font-mono text-slate-900">
                      {selectedItemDetail.lane !== '-' ? selectedItemDetail.lane : selectedItemDetail.location}
                    </span>.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Visual Tracking Riwayat (Lifecycle & History Timeline) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-700" />
                  Tracking Riwayat &amp; Posisi Komponen:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Audit Trail WIM</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">1. Penerimaan Onsite</div>
                  <div className="text-xs font-bold text-slate-900 font-mono">{selectedItemDetail.tanggal_onsite !== '-' ? selectedItemDetail.tanggal_onsite : '2024-05-10'}</div>
                  <div className="text-[11px] text-slate-500">Pit Sebamban KM-14</div>
                  <div className="text-[10px] text-emerald-700 font-mono font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Fisik Terverifikasi
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">2. Terpasang Sebelumnya</div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {selectedItemDetail.transferred_from !== '-' ? selectedItemDetail.transferred_from : 'Instalasi Awal'}
                  </div>
                  <div className="text-[11px] text-slate-500">Origin Site</div>
                  <div className="text-[10px] text-slate-600 font-mono font-semibold">Fresh Asset</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">3. Waktu Dismantle</div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {selectedItemDetail.tanggal_dismantle !== '-' ? selectedItemDetail.tanggal_dismantle : 'Belum Dilepas'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedItemDetail.tanggal_dismantle !== '-' ? 'Dilepas oleh Teknisi' : 'Aktif Terpasang'}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono font-semibold">
                    {selectedItemDetail.tanggal_dismantle !== '-' ? 'Dismantled' : 'Mounted'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">4. Posisi Terkini</div>
                  <div className="text-xs font-bold font-mono text-slate-900 truncate">
                    {selectedItemDetail.lane !== '-' ? selectedItemDetail.lane : selectedItemDetail.location}
                  </div>
                  <div className="text-[11px] text-slate-500">Pasang: {selectedItemDetail.tanggal_instal}</div>
                  <div className="text-[10px] text-slate-600 font-mono font-semibold">Aktif Operasional</div>
                </div>
              </div>
            </div>

            {/* 3. Spesifikasi Teknis */}
            <div className="space-y-2">
              <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                Spesifikasi Teknis:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block tracking-wider font-bold">KATEGORI</span>
                  <span className="font-bold text-slate-900">{selectedItemDetail.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block tracking-wider font-bold">MODEL / TIPE</span>
                  <span className="font-bold text-slate-900">{selectedItemDetail.model_type || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block tracking-wider font-bold">SERIAL NUMBER</span>
                  <span className="font-bold text-slate-900">{selectedItemDetail.serial_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block tracking-wider font-bold">NO. PO REFERENSI</span>
                  <span className="font-bold text-slate-800">{selectedItemDetail.po_number || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block tracking-wider font-bold">LOKASI FISIK</span>
                  <span className="font-bold text-slate-800">{selectedItemDetail.location}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block tracking-wider font-bold">KONDISI FISIK</span>
                  <span className="font-bold text-slate-800">{selectedItemDetail.condition}</span>
                </div>
              </div>
            </div>

            {/* 4. Dokumen Bukti & Akses Dokumen Proyek */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-mono">DOKUMEN PEMBUKTIAN &amp; KONTRAK</h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      No. PO: <span className="font-bold font-mono text-red-700">{selectedItemDetail.po_number || 'PO-WIM-2024-001'}</span>
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                  Tersertifikasi
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemDetail(null);
                    onOpenDocuments?.();
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Dokumen Operasional Proyek (PR/PO/MOS/Decommissioning)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemDetail(null);
                    onOpenMos?.();
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  Buka Portal Digital MOS &amp; Tanda Tangan
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                ID Item: {selectedItemDetail.id} | Project: WIM
              </span>
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
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
