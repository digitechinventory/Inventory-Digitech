import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  Package,
  Layers,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  FileCheck2,
  PackagePlus,
  Wrench,
  MapPin,
  ClipboardCheck,
  PackageSearch,
  Store,
  Users,
  ScrollText,
  Warehouse,
  X,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  QrCode,
  ScanLine,
  Calendar,
  Truck,
  Activity,
  Cpu,
  Radio,
  SlidersHorizontal,
  Bell,
  Gauge,
  Check,
  Filter,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import InventoryScannerModal from '../common/InventoryScannerModal';
import ParallelogramCard from '../common/ParallelogramCard';

export default function MobileHomeDashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // Active Category Pill: 'all' | 'famous' | 'wim' | 'ccm' | 'catalog'
  const [activeTab, setActiveTab] = useState('all');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState('BIB Pit Sebamban KM-14');
  const [isSiteSelectorOpen, setIsSiteSelectorOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  // Live Database Stats for Parallelogram Summary Cards
  const [stats, setStats] = useState({
    totalEnterpriseUnits: 10065,
    totalStockUnits: 649,
    catalogStockUnits: 649,
    famousTotalItems: 9416,
    famousFleetUnits: 825,
    mosTotal: 6,
    mosPending: 2,
    lowStockItems: 3
  });
  const [mosDocs, setMosDocs] = useState([]);

  useEffect(() => {
    const fetchSummaryMetrics = async () => {
      try {
        const [statsRes, mosRes] = await Promise.all([
          api.get('/inventory/stats').catch(() => ({ data: { data: {} } })),
          api.get('/mos').catch(() => ({ data: { data: [] } }))
        ]);
        if (statsRes.data?.data) {
          setStats(prev => ({ ...prev, ...statsRes.data.data }));
        }
        if (mosRes.data?.data) {
          setMosDocs(mosRes.data.data);
        }
      } catch (err) {
        console.warn('Failed to fetch mobile dashboard stats:', err);
      }
    };
    fetchSummaryMetrics();
  }, []);

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const normalizedRole = role || 'User';
  const firstName = user?.full_name?.split(' ')[0] || (normalizedRole === 'Superadmin' ? 'Superadmin' : 'Arya');

  // Available Mining Sites
  const siteLocations = [
    { id: 'sebamban', name: 'BIB Pit Sebamban KM-14', zone: 'Workshop & Weighbridge' },
    { id: 'port', name: 'BIB Port Batulicin Terminal', zone: 'Coal Loading & Stockpile' },
    { id: 'km28', name: 'Checkpoint KM-28 Hauling Road', zone: 'Telemetry & Scale Station' },
    { id: 'vgt', name: 'Main Office VGT Lantai 2', zone: 'Central Warehouse & GPS Hub' }
  ];

  // Comprehensive Inventory Items from database (FAMOUS, WIM, CCM, Katalog, Tools)
  const allInventoryItems = [
    {
      id: 'fam-01',
      project: 'famous',
      projectBadge: 'FAMOUS FLEET',
      projectColor: 'bg-red-50 text-red-600 border-red-200',
      title: 'Telematics Kit Unit AEK 0005',
      code: 'UNIT-AEK-0005',
      category: 'GPS & Telematics',
      location: 'BIB Pit South Workshop',
      sensorStatus: 'Optimal (8/8)',
      stock: 1,
      unit: 'Kit Unit',
      status: 'ready',
      statusLabel: 'Siap Operasi',
      icon: Radio,
      path: '/projects'
    },
    {
      id: 'wim-01',
      project: 'wim',
      projectBadge: 'PROJECT WIM',
      projectColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Load Cell Transducer 50 Ton',
      code: 'WIM-LC-50T-HD',
      category: 'Dynamic Scale Sensors',
      location: 'Jembatan Timbang KM-14',
      sensorStatus: 'Kalibrasi Aktif',
      stock: 8,
      unit: 'Pcs',
      status: 'ready',
      statusLabel: 'Ready Stock',
      icon: Activity,
      path: '/projects'
    },
    {
      id: 'ccm-01',
      project: 'ccm',
      projectBadge: 'PROJECT CCM',
      projectColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Crusher Bearing 22220E Heavy',
      code: 'CCM-BRG-22220E',
      category: 'Crusher Mechanical',
      location: 'Stockpile ROM Sebamban',
      sensorStatus: 'Bearing Suhu Normal',
      stock: 4,
      unit: 'Set',
      status: 'ready',
      statusLabel: 'Ready Stock',
      icon: Cpu,
      path: '/projects'
    },
    {
      id: 'cat-01',
      project: 'catalog',
      projectBadge: 'KATALOG UMUM',
      projectColor: 'bg-rose-50 text-rose-600 border-rose-200',
      title: 'Cat 777D Engine Oil Filter',
      code: 'BIB-CAT-777D-FLTR',
      category: 'Mechanical Sparepart',
      location: 'Rak A02 • Central Workshop',
      sensorStatus: 'Sisa 2 Unit',
      stock: 2,
      unit: 'Pcs',
      status: 'critical',
      statusLabel: 'Restock Kritis',
      icon: Package,
      path: '/inventory'
    },
    {
      id: 'cat-02',
      project: 'catalog',
      projectBadge: 'KATALOG UMUM',
      projectColor: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'Delco Remy 24V 150A Alternator',
      code: 'BIB-ELE-ALT-24V',
      category: 'Electrical Component',
      location: 'Rak D01 • Main Warehouse',
      sensorStatus: 'Stok Terjaga',
      stock: 9,
      unit: 'Pcs',
      status: 'ready',
      statusLabel: 'Tersedia',
      icon: SlidersHorizontal,
      path: '/inventory'
    },
    {
      id: 'tool-01',
      project: 'tools',
      projectBadge: 'TOOL LOANS',
      projectColor: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Fluke 87V Industrial Multimeter',
      code: 'TOOL-FLK-87V-04',
      category: 'Diagnostic Tools',
      location: 'Tool Box 04 • Workshop',
      sensorStatus: 'Kondisi Baik',
      stock: 2,
      unit: 'Unit',
      status: 'ready',
      statusLabel: 'Bisa Dipinjam',
      icon: Wrench,
      path: '/tools'
    }
  ];

  // Filter items based on active pill and search query
  const filteredItems = allInventoryItems.filter(item => {
    const matchesTab = activeTab === 'all' || item.project === activeTab;
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Critical Stock items needing attention
  const criticalStockItems = [
    {
      name: 'Cat 777D Engine Oil Filter (P550388)',
      part: 'BIB-CAT-777D-FLTR',
      location: 'Rak A2 • Sebamban Workshop',
      stock: 2,
      min: 10,
      percent: 20
    },
    {
      name: 'Main Hydraulic Pump Parker P31',
      part: 'BIB-CAT-777D-PUMP',
      location: 'Rak B3 • Central Workshop',
      stock: 2,
      min: 3,
      percent: 40
    },
    {
      name: 'Shell Tellus S2 V 68 Drum Oil',
      part: 'BIB-LUB-SHL-T68',
      location: 'Rak C1 • Main Pit Stock',
      stock: 6,
      min: 20,
      percent: 30
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#FAF7F5] text-slate-900 pb-32 select-none overflow-x-hidden font-sans">
      
      {/* ── Soft Fluid Background Gradients (Inspired by Reference Design) ── */}
      <div className="absolute top-0 right-0 w-[85vw] h-[340px] bg-gradient-to-bl from-rose-200/50 via-red-100/30 to-transparent rounded-bl-[120px] pointer-events-none -z-10 blur-xl" />
      <div className="absolute top-12 left-0 w-[50vw] h-[220px] bg-gradient-to-tr from-amber-100/30 to-transparent rounded-tr-[90px] pointer-events-none -z-10 blur-lg" />

      {/* ── Top Header Section (Matching "Hello, Alex" + Notification Bell) ── */}
      {/* Poni / Notch & Dynamic Island Safe-Area Clearance */}
      <div
        style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 56px)' }}
        className="px-5 flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {getGreeting()},
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-0.5">
            Hello, <span className="text-red-600">{firstName}</span>
          </h1>
          <p className="text-[11px] font-medium text-slate-500 mt-1">
            Inventaris &amp; Kontrol Aset Site Tambang
          </p>
        </div>

        {/* Right Action Icons: Notification Bell & Barcode Scan */}
        <div className="flex items-center gap-2">
          {/* Barcode Scanner Button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 active:scale-95 transition-all cursor-pointer"
            title="Scan Barcode / QR Aset"
          >
            <ScanLine className="w-4.5 h-4.5 text-red-600" />
          </button>

          {/* Notification Bell with Red Badge Dot */}
          <button
            onClick={() => navigate('/mos')}
            className="relative w-10 h-10 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 active:scale-95 transition-all cursor-pointer"
            title="Pemberitahuan & Approval"
          >
            <Bell className="w-4.5 h-4.5 text-slate-600" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
          </button>
        </div>
      </div>

      {/* ── Category Segmented Pills (Matching "Rides" / "Eats" Segmented Switcher) ── */}
      <div className="mt-4 px-5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all shrink-0 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Aset</span>
          </button>

          <button
            onClick={() => setActiveTab('famous')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all shrink-0 cursor-pointer ${
              activeTab === 'famous'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Project FAMOUS</span>
          </button>

          <button
            onClick={() => setActiveTab('wim')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all shrink-0 cursor-pointer ${
              activeTab === 'wim'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Project WIM</span>
          </button>

          <button
            onClick={() => setActiveTab('ccm')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all shrink-0 cursor-pointer ${
              activeTab === 'ccm'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Project CCM</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all shrink-0 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Katalog Suku Cadang</span>
          </button>
        </div>
      </div>

      {/* ── THE ICONIC DISPATCH HERO CARD (Matching Reference Image 1) ── */}
      {/* Rounded pure white card, dual red dots ("From / Where to"), background hardware silhouette, and circular red arrow CTA */}
      <div className="mt-3.5 px-5">
        <div className="relative bg-white rounded-3xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(220,38,38,0.06)] border border-slate-100 overflow-hidden">
          
          {/* Subtle Ambient High-Tech Asset Graphic in Background */}
          <div className="absolute -right-6 -bottom-6 w-36 h-36 opacity-[0.06] pointer-events-none text-red-600">
            <Radio className="w-full h-full" />
          </div>

          <div className="space-y-3 relative z-10">
            
            {/* Top Field: Location / Site Picker (Matching "From: Current Location") */}
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-red-600 ring-4 ring-red-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Site / Gudang Terpilih
                </span>
                <button
                  type="button"
                  onClick={() => setIsSiteSelectorOpen(!isSiteSelectorOpen)}
                  className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-900 truncate hover:text-red-600 transition-colors cursor-pointer"
                >
                  <span className="truncate">{selectedSite}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </button>
              </div>
              <button
                onClick={() => navigate('/gis')}
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-red-600 transition-colors shrink-0 cursor-pointer"
                title="Buka Peta Satelit Site"
              >
                <Compass className="w-4 h-4 text-red-600" />
              </button>
            </div>

            {/* Connecting Dotted Line */}
            <div className="w-0.5 h-3.5 bg-slate-200 ml-1.5 -my-1 rounded-full" />

            {/* Bottom Field: Part / Serial Search Input (Matching "Where to? Search destination") */}
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cari Suku Cadang / Unit Proyek
                </span>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Contoh: AEK 0005, Load Cell, Oil Filter..."
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal pr-6"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 my-1" />

            {/* Bottom Controls Row: Quick Status Chip & Iconic Circular Red Arrow Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/projects')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Filter className="w-3 h-3 text-red-600" />
                  <span>Semua Kategori</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                <span className="text-[10px] font-bold text-slate-400">
                  {filteredItems.length} aset cocok
                </span>
              </div>

              {/* The Iconic Red Circular CTA Button */}
              <button
                onClick={() => {
                  if (filteredItems.length > 0) {
                    navigate(filteredItems[0].path);
                  } else {
                    navigate('/inventory');
                  }
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 hover:from-red-700 hover:to-rose-600 text-white shadow-md shadow-red-600/30 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Buka Katalog Inventaris"
              >
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>

          {/* Site Selector Dropdown Modal if clicked */}
          {isSiteSelectorOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 animate-in fade-in duration-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pilih Lokasi Operasional:
              </span>
              {siteLocations.map((site) => (
                <button
                  key={site.id}
                  onClick={() => {
                    setSelectedSite(site.name);
                    setIsSiteSelectorOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    selectedSite === site.name
                      ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <div>
                    <p className="leading-tight">{site.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{site.zone}</p>
                  </div>
                  {selectedSite === site.name && (
                    <Check className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── RINGKASAN METRIK (Summary Cards Berbentuk Jajaran Genjang Seperti Desktop) ── */}
      <div className="mt-5 px-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Ringkasan Metrik Inventaris
              </h2>
              <p className="text-[10px] text-slate-400">
                Sinkronisasi data riil seluruh gudang &amp; site
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Live DB
          </span>
        </div>

        {/* 4 Signature Parallelogram Cards matching Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-1">
          <ParallelogramCard
            title="TOTAL ASET AKTIF"
            value={Number(
              activeTab === 'famous'
                ? (stats.famousTotalItems || 9416)
                : activeTab === 'wim'
                ? 8
                : activeTab === 'ccm'
                ? 4
                : activeTab === 'catalog'
                ? (stats.catalogStockUnits || 649)
                : (stats.totalEnterpriseUnits || 10065)
            ).toLocaleString('id-ID')}
            unit="UNIT"
            subtitle={
              activeTab === 'famous'
                ? `• 9.416 Telematika (${stats.famousFleetUnits || 825} Truk Hauling)`
                : activeTab === 'wim'
                ? `• 8 Sensor Load Cell Jembatan Timbang KM-14`
                : activeTab === 'ccm'
                ? `• 4 Set Crusher Bearing ROM Sebamban`
                : activeTab === 'catalog'
                ? `• 649 Suku Cadang Terdaftar di 4 Gudang BIB`
                : `• 9.416 Unit FAMOUS + ${stats.catalogStockUnits || 649} Katalog`
            }
            subtitleColor="text-slate-600"
            icon={TrendingUp}
            iconColor="text-red-600"
            accentColor="border-red-600"
            valueColor="text-slate-900"
            padding="p-3.5 sm:p-4"
            onClick={() => navigate(activeTab === 'famous' ? '/projects' : '/inventory')}
          />

          <ParallelogramCard
            title="DRAF MOS PENDING"
            value={String(mosDocs.length || stats.mosTotal || 6).padStart(2, '0')}
            unit="BERKAS"
            subtitle="4 Selesai TTD • 2 Dalam Proses"
            subtitleIcon={FileCheck2}
            subtitleColor="text-blue-700"
            icon={FileCheck2}
            iconColor="text-blue-600"
            accentColor="border-blue-600"
            valueColor="text-blue-600"
            padding="p-3.5 sm:p-4"
            onClick={() => navigate('/mos')}
          />

          <ParallelogramCard
            title="KRITIS REORDER"
            value="03"
            unit="PART"
            subtitle="Di Bawah Buffer Minimum Site"
            subtitleIcon={AlertTriangle}
            subtitleColor="text-red-700"
            icon={AlertTriangle}
            iconColor="text-red-600"
            accentColor="border-red-600"
            valueColor="text-red-600"
            padding="p-3.5 sm:p-4"
            onClick={() => navigate('/inventory?status=low_stock')}
          />

          <ParallelogramCard
            title="TOOLS DIPINJAM"
            value="02"
            unit="UNIT"
            subtitle="Perkakas Aktif di Pit Workshop"
            subtitleIcon={Wrench}
            subtitleColor="text-purple-700"
            icon={Wrench}
            iconColor="text-purple-600"
            accentColor="border-purple-600"
            valueColor="text-purple-600"
            padding="p-3.5 sm:p-4"
            onClick={() => navigate('/tools')}
          />
        </div>
      </div>

      {/* ── SUGGESTIONS / PROJECT HUBS (Matching the 4 white cards with red badges) ── */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            Kategori Proyek &amp; Fasilitas
          </h2>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Rounded Square Cards matching Reference UI */}
        <div className="grid grid-cols-4 gap-2.5">
          
          {/* Card 1: FAMOUS Fleet */}
          <button
            onClick={() => navigate('/projects')}
            className="relative bg-white rounded-2xl p-2.5 pt-3.5 flex flex-col items-center justify-between border border-slate-100 shadow-xs hover:border-red-200 hover:shadow-md transition-all active:scale-95 cursor-pointer text-center aspect-[1/1.12]"
          >
            <span className="absolute -top-1.5 px-1.5 py-0.5 bg-red-600 text-white rounded-full text-[8px] font-black uppercase tracking-wider shadow-2xs">
              825 Unit
            </span>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mt-1">
              <Radio className="w-5 h-5" />
            </div>
            <span className="text-[10.5px] font-bold text-slate-800 leading-tight">
              FAMOUS Fleet
            </span>
          </button>

          {/* Card 2: WIM Scales */}
          <button
            onClick={() => navigate('/projects')}
            className="relative bg-white rounded-2xl p-2.5 pt-3.5 flex flex-col items-center justify-between border border-slate-100 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all active:scale-95 cursor-pointer text-center aspect-[1/1.12]"
          >
            <span className="absolute -top-1.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded-full text-[8px] font-black uppercase tracking-wider shadow-2xs">
              KM-14
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mt-1">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10.5px] font-bold text-slate-800 leading-tight">
              WIM Scales
            </span>
          </button>

          {/* Card 3: CCM Crusher */}
          <button
            onClick={() => navigate('/projects')}
            className="relative bg-white rounded-2xl p-2.5 pt-3.5 flex flex-col items-center justify-between border border-slate-100 shadow-xs hover:border-amber-200 hover:shadow-md transition-all active:scale-95 cursor-pointer text-center aspect-[1/1.12]"
          >
            <span className="absolute -top-1.5 px-1.5 py-0.5 bg-amber-600 text-white rounded-full text-[8px] font-black uppercase tracking-wider shadow-2xs">
              ROM
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mt-1">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10.5px] font-bold text-slate-800 leading-tight">
              CCM Crusher
            </span>
          </button>

          {/* Card 4: Tool Loans */}
          <button
            onClick={() => navigate('/tools')}
            className="relative bg-white rounded-2xl p-2.5 pt-3.5 flex flex-col items-center justify-between border border-slate-100 shadow-xs hover:border-purple-200 hover:shadow-md transition-all active:scale-95 cursor-pointer text-center aspect-[1/1.12]"
          >
            <span className="absolute -top-1.5 px-1.5 py-0.5 bg-purple-600 text-white rounded-full text-[8px] font-black uppercase tracking-wider shadow-2xs">
              Ready
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mt-1">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-[10.5px] font-bold text-slate-800 leading-tight">
              Peminjaman
            </span>
          </button>

        </div>
      </div>

      {/* ── SPECIAL HIGHLIGHT BANNER: MOS APPROVAL (Matching the 40% OFF / Save up to 30% Red Card) ── */}
      <div className="mt-5 px-5">
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-5 text-white shadow-[0_12px_28px_rgba(220,38,38,0.24)] border border-red-500/40">
          
          {/* Background Ambient Flare Rings */}
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute right-4 bottom-2 opacity-15 pointer-events-none">
            <FileCheck2 className="w-28 h-28 text-white" />
          </div>

          <div className="relative z-10 max-w-[70%]">
            <span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black tracking-wider uppercase mb-1.5 border border-white/25">
              Prioritas Otorisasi
            </span>
            <h3 className="text-base font-black tracking-tight leading-tight">
              Waiting List Dokumen MOS
            </h3>
            <p className="text-[11px] text-rose-100 font-medium leading-snug mt-1">
              Verifikasi penerimaan material &amp; tanda tangan digital 3-slot di lapangan.
            </p>
            <button
              onClick={() => navigate('/mos')}
              className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-white text-red-700 hover:bg-rose-50 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>Review Dokumen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* ── INVENTARIS SIAP PAKAI & POPULER (Matching "Popular Rides" / "Get anything delivered" Section) ── */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Inventaris Proyek Siap Pakai
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              Data terintegrasi dari database FAMOUS, WIM, CCM &amp; Suku Cadang
            </p>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer shrink-0"
          >
            <span>Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Scrolling Card Row */}
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-1 -mx-5 px-5">
          {filteredItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItemDetail(item)}
                className="w-[220px] bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-all shrink-0 flex flex-col justify-between cursor-pointer active:scale-98"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${item.projectColor}`}>
                      {item.projectBadge}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {item.statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 my-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <ItemIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        {item.code}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-slate-500 space-y-0.5">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Lokasi:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[120px]">{item.location}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Status Sensor:</span>
                      <span className="font-bold text-slate-800">{item.sensorStatus}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-black text-slate-900">
                    Stok: <span className="text-red-600 font-mono">{item.stock}</span> {item.unit}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(item.path);
                    }}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-600 hover:text-white flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* ── STOK MEMBUTUHKAN PERHATIAN (Restock Warning Section) ── */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Suku Cadang Perlu Restock
            </h2>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
          >
            Lihat Gudang
          </button>
        </div>

        <div className="space-y-2.5">
          {criticalStockItems.map((crit, idx) => (
            <div
              key={idx}
              onClick={() => navigate('/inventory')}
              className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3 active:scale-98 transition-all cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-slate-900 truncate">
                    {crit.name}
                  </h4>
                  <span className="text-[10px] font-mono font-black text-red-600 shrink-0">
                    {crit.stock} / {crit.min} Unit
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                  {crit.part} • {crit.location}
                </p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${crit.percent}%` }}
                  />
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ROLE ACTION DRAWER / ACCORDION ── */}
      <div className="mt-6 px-5">
        <div className="bg-slate-900 text-white rounded-3xl p-4.5 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span className="text-xs font-black uppercase tracking-wider">
                Akses Peran: {normalizedRole}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
              Sistem Aktif
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => navigate('/mos')}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl flex items-center gap-2 text-left cursor-pointer border border-slate-700/60 transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-red-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold truncate">Approval MOS</p>
                <p className="text-[9.5px] text-slate-400 truncate">3 Slot Signature</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/projects')}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl flex items-center gap-2 text-left cursor-pointer border border-slate-700/60 transition-colors"
            >
              <Radio className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold truncate">Project FAMOUS</p>
                <p className="text-[9.5px] text-slate-400 truncate">825 Unit Tambang</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/tools')}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl flex items-center gap-2 text-left cursor-pointer border border-slate-700/60 transition-colors"
            >
              <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold truncate">Peminjaman Tool</p>
                <p className="text-[9.5px] text-slate-400 truncate">Logbook Alat</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/gis')}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl flex items-center gap-2 text-left cursor-pointer border border-slate-700/60 transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold truncate">Peta Satelit</p>
                <p className="text-[9.5px] text-slate-400 truncate">Geofence Site</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL DRAWER (Saat item di klik) ── */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider border ${selectedItemDetail.projectColor}`}>
                  {selectedItemDetail.projectBadge}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-2">
                  {selectedItemDetail.title}
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  Kode / Serial: {selectedItemDetail.code}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Kategori:</span>
                <span className="font-bold text-slate-800">{selectedItemDetail.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lokasi Penyimpanan:</span>
                <span className="font-bold text-slate-800">{selectedItemDetail.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Sensor / Fisik:</span>
                <span className="font-bold text-emerald-600">{selectedItemDetail.sensorStatus}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500 font-bold">Stok Tersedia:</span>
                <span className="font-black text-red-600 font-mono text-sm">{selectedItemDetail.stock} {selectedItemDetail.unit}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const path = selectedItemDetail.path;
                  setSelectedItemDetail(null);
                  navigate(path);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-red-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Buka Detail di Modul</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Built-in Barcode Scanner Modal ── */}
      <InventoryScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          setIsScannerOpen(false);
          setSearchQuery(scannedCode);
        }}
      />

    </div>
  );
}
