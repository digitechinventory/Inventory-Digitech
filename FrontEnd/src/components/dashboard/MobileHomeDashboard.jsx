import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
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
  FilePlus2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import ParallelogramCard from '../common/ParallelogramCard';
import InventoryScannerModal from '../common/InventoryScannerModal';

export default function MobileHomeDashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const normalizedRole = role || 'User';
  const roleDisplay = normalizedRole === 'Superadmin'
    ? 'Superadmin'
    : normalizedRole === 'Admin'
    ? 'Administrator'
    : 'Teknisi Lapangan';

  // Role-Specific Action Menus ("menu menu kecil yang dapat di klik")
  const getRoleMenus = () => {
    if (normalizedRole === 'Superadmin') {
      return [
        {
          id: 'slot3',
          title: 'Otorisasi Slot 3 MOS',
          subtitle: 'Pengesahan final penerimaan material & auto-ledger',
          icon: ShieldCheck,
          path: '/mos',
          badge: 'Otorisasi',
          badgeColor: 'bg-red-50 text-red-600 border-red-200'
        },
        {
          id: 'users',
          title: 'Aktivasi & Hak Akses',
          subtitle: 'Kelola verifikasi akun pengguna baru site',
          icon: Users,
          path: '/users',
          badge: 'Pengguna',
          badgeColor: 'bg-rose-50 text-rose-600 border-rose-200'
        },
        {
          id: 'ledger',
          title: 'Buku Besar Stok (Ledger)',
          subtitle: 'Audit trail mutasi keluar-masuk suku cadang',
          icon: ScrollText,
          path: '/ledger',
          badge: 'Audit Trail',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
        },
        {
          id: 'sites',
          title: 'Peta & Geofence GPS Site',
          subtitle: 'Pengaturan radius Haversine 200m area tambang BIB',
          icon: MapPin,
          path: '/gis',
          badge: 'Peta GPS',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        },
        {
          id: 'warehouses',
          title: 'Denah 2D Rak Gudang',
          subtitle: 'Visualisasi tata letak bin location 4 gudang',
          icon: Warehouse,
          path: '/warehouses',
          badge: 'Layout Gudang',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        },
        {
          id: 'catalog',
          title: 'Katalog Suku Cadang',
          subtitle: 'Cek stok fisik dan lokasi rak material',
          icon: Store,
          path: '/inventory',
          badge: 'Katalog',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
        }
      ];
    }

    if (normalizedRole === 'Admin') {
      return [
        {
          id: 'mos_verify',
          title: 'Verifikasi Fisik MOS (Slot 2)',
          subtitle: 'Pemeriksaan fisik sparepart vendor & penempatan rak',
          icon: FileCheck2,
          path: '/mos',
          badge: 'Verifikasi Fisik',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
        },
        {
          id: 'mr_picking',
          title: 'Picking Material (MR)',
          subtitle: 'Proses pengeluaran suku cadang untuk teknisi',
          icon: PackagePlus,
          path: '/mr',
          badge: 'Pengeluaran',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        },
        {
          id: 'opname',
          title: 'Stock Opname Berkala',
          subtitle: 'Audit selisih stok fisik vs catatan sistem',
          icon: ClipboardCheck,
          path: '/opname',
          badge: 'Audit Stok',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        },
        {
          id: 'warehouses',
          title: 'Denah Rak Gudang',
          subtitle: 'Denah visual rak A01 - D01 4 gudang site',
          icon: Warehouse,
          path: '/warehouses',
          badge: 'Denah Gudang',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
        },
        {
          id: 'tools',
          title: 'Peminjaman Alat Kerja',
          subtitle: 'Manajemen barcode scanner & tool khusus pit',
          icon: Wrench,
          path: '/tools',
          badge: 'Tools',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
        },
        {
          id: 'gis',
          title: 'Peta Lokasi & Geofence',
          subtitle: 'Verifikasi koordinat lokasi site',
          icon: MapPin,
          path: '/gis',
          badge: 'Peta',
          badgeColor: 'bg-red-50 text-red-600 border-red-200'
        }
      ];
    }

    // Default: User (Teknisi Lapangan)
    return [
      {
        id: 'mr',
        title: 'Ajukan Pengambilan Material (MR)',
        subtitle: 'Pengambilan suku cadang pemeliharaan unit',
        icon: PackagePlus,
        path: '/mr',
        badge: 'Ambil Suku Cadang',
        badgeColor: 'bg-red-50 text-red-600 border-red-200'
      },
      {
        id: 'mos_create',
        title: 'Draf Dokumen MOS Baru',
        subtitle: 'Penerimaan barang dari vendor di lapangan',
        icon: FileCheck2,
        path: '/mos',
        badge: 'Penerimaan',
        badgeColor: 'bg-rose-50 text-rose-600 border-rose-200'
      },
      {
        id: 'catalog',
        title: 'Cari Stok Suku Cadang',
        subtitle: 'Katalog filter, hidrolik, dan sparepart unit',
        icon: PackageSearch,
        path: '/inventory',
        badge: 'Katalog',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        id: 'tools',
        title: 'Pinjam Perkakas Kerja',
        subtitle: 'Torque wrench, multimeter, dan toolkit mekanik',
        icon: Wrench,
        path: '/tools',
        badge: 'Peralatan',
        badgeColor: 'bg-blue-50 text-blue-600 border-blue-200'
      },
      {
        id: 'gis',
        title: 'Peta & Geofence GPS Site',
        subtitle: 'Verifikasi radius lokasi pit operasional',
        icon: MapPin,
        path: '/gis',
        badge: 'Peta GPS',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    ];
  };

  const roleMenus = getRoleMenus();

  // Genuine Mining Inventory Attention Items (Perlu Restock Segera)
  const primaryAttentionItems = [
    {
      id: 'item-1',
      name: 'Cat 777D Engine Oil Filter',
      partNumber: 'BIB-CAT-777D-FLTR',
      location: 'Rak R-A01 • Warehouse 1 (Main Pit)',
      stockCount: 4,
      minThreshold: 10,
      stockLabel: 'unit tersisa',
      status: 'Kritis',
      statusColor: 'rose',
      progressPercent: 25,
      progressColor: 'bg-rose-600'
    },
    {
      id: 'item-2',
      name: 'Komatsu PC2000 Hydraulic Seal Kit',
      partNumber: 'BIB-KOM-PC2000-HYD',
      location: 'Rak R-A02 • Warehouse 2 (Central Workshop)',
      stockCount: 2,
      minThreshold: 8,
      stockLabel: 'set tersisa',
      status: 'Kritis',
      statusColor: 'rose',
      progressPercent: 25,
      progressColor: 'bg-rose-600'
    },
    {
      id: 'item-3',
      name: 'Shell Tellus S2 V 68 Drum Oil',
      partNumber: 'BIB-LUB-SHL-T68',
      location: 'Rak R-C01 • Warehouse 1 (Main Pit)',
      stockCount: 6,
      minThreshold: 20,
      stockLabel: 'drum tersisa',
      status: 'Menipis',
      statusColor: 'amber',
      progressPercent: 30,
      progressColor: 'bg-amber-500'
    },
    {
      id: 'item-4',
      name: 'Volvo FMX 440 Brake Lining Assm',
      partNumber: 'BIB-VOL-FMX-BRK',
      location: 'Rak R-B01 • Warehouse 2 (Central Workshop)',
      stockCount: 3,
      minThreshold: 15,
      stockLabel: 'set tersisa',
      status: 'Menipis',
      statusColor: 'amber',
      progressPercent: 35,
      progressColor: 'bg-amber-500'
    }
  ];

  const expandedAttentionItems = [
    {
      id: 'item-5',
      name: 'Delco Remy 24V 150A Alternator',
      partNumber: 'BIB-ELE-ALT-24V',
      location: 'Rak R-D01 • Warehouse 1 (Main Pit)',
      stockCount: 9,
      minThreshold: 12,
      stockLabel: 'pcs tersisa',
      status: 'Menipis',
      statusColor: 'amber',
      progressPercent: 60,
      progressColor: 'bg-amber-500'
    },
    {
      id: 'item-6',
      name: 'Fleetguard Fuel Water Separator',
      partNumber: 'BIB-FLT-FS1000',
      location: 'Rak R-A03 • Warehouse 2 (Central Workshop)',
      stockCount: 5,
      minThreshold: 15,
      stockLabel: 'pcs tersisa',
      status: 'Menipis',
      statusColor: 'amber',
      progressPercent: 33,
      progressColor: 'bg-amber-500'
    },
    {
      id: 'item-7',
      name: 'Goodyear 27.00R49 Haul Truck Tyre',
      partNumber: 'BIB-TYR-2700R49',
      location: 'Yard Ban • Pelabuhan Sebamban',
      stockCount: 2,
      minThreshold: 6,
      stockLabel: 'unit tersisa',
      status: 'Kritis',
      statusColor: 'rose',
      progressPercent: 33,
      progressColor: 'bg-rose-600'
    },
    {
      id: 'item-8',
      name: 'Bucket Tooth Tip Heavy Duty 777D',
      partNumber: 'BIB-GET-CAT-TIP',
      location: 'Rak R-B03 • Warehouse 1 (Main Pit)',
      stockCount: 65,
      minThreshold: 25,
      stockLabel: 'pcs tersisa',
      status: 'Optimal',
      statusColor: 'emerald',
      progressPercent: 100,
      progressColor: 'bg-emerald-600'
    }
  ];

  const displayedAttentionItems = isListExpanded
    ? [...primaryAttentionItems, ...expandedAttentionItems]
    : primaryAttentionItems;

  return (
    <div className="w-full pb-14 space-y-4 font-sans select-none animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP HERO CARD (Clean White + Crimson Accents)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-red-100 shadow-[0_12px_36px_rgba(220,38,38,0.06),0_2px_12px_rgba(0,0,0,0.04)] text-slate-800 p-5 pt-6">
        
        {/* Soft Ambient Crimson Wash */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-red-500/10 to-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-red-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* ─── Header: Greeting, User Name, Role Pill & Action Buttons ─── */}
        <div className="relative z-10 flex items-start justify-between gap-3 mb-5">
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-semibold tracking-wide">
              {getGreeting()}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
              {user?.full_name || 'Masamune'}
            </h1>
            
            {/* Role Badge */}
            <div className="mt-1.5 inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              <span>{roleDisplay}</span>
            </div>
          </div>

          {/* Action Buttons: Peta / Geofence + Search */}
          <div className="flex items-center gap-2 mt-0.5">
            {/* Quick Map Button */}
            <button
              onClick={() => navigate('/gis')}
              title="Pengaturan & Tampilan Peta GPS Site"
              className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-600 active:scale-92 transition-all shadow-xs cursor-pointer"
            >
              <Compass className="w-5 h-5" />
            </button>

            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(prev => !prev)}
              aria-label="Cari suku cadang atau dokumen"
              className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-92 transition-all shadow-xs cursor-pointer"
            >
              {isSearchOpen ? <X className="w-5 h-5 text-red-600" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Quick Search Dropdown Bar */}
        {isSearchOpen && (
          <div className="relative z-20 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Cari part number, suku cadang, lokasi rak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="w-full h-10 pl-10 pr-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 text-slate-400 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── Circular Progress Meter & Big Metrics Row ─── */}
        <div className="relative z-10 flex items-center gap-5 my-2">
          
          {/* Circular Donut Meter */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="imsStockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#DC2626" />
                  <stop offset="50%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#F43F5E" />
                </linearGradient>
              </defs>

              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#F1F5F9"
                strokeWidth="8.5"
                fill="none"
              />

              {/* Progress Value: 96% */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#imsStockGrad)"
                strokeWidth="8.5"
                strokeDasharray="251.2"
                strokeDashoffset="10.05"
                strokeLinecap="round"
                fill="none"
                style={{
                  filter: 'drop-shadow(0 0 5px rgba(220, 38, 38, 0.4))'
                }}
              />
            </svg>

            {/* Inner Ring Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl sm:text-2xl font-black text-slate-900 leading-none tracking-tight">
                96%
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                TERSEDIA
              </span>
            </div>
          </div>

          {/* Right Metrics: Status Pill + Physical Unit Count */}
          <div className="flex-1 flex flex-col justify-center">
            
            {/* Status Pill */}
            <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Status Stok Gudang</span>
            </div>

            {/* Total Physical Stock Quantity (Not Nominal Currency!) */}
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 leading-none">
              14.850 Unit
            </div>

            {/* Subtitle */}
            <div className="text-xs text-slate-500 font-medium mt-1">
              Total fisik suku cadang dari 28 part number
            </div>
          </div>
        </div>

        {/* ─── Multi-Segment Status Progress Bar ─── */}
        <div className="relative z-10 mt-5 pt-3 border-t border-slate-100 space-y-2">
          
          {/* Horizontal Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
            <div style={{ width: '82%' }} className="h-full bg-emerald-500 rounded-l-full shadow-xs" />
            <div style={{ width: '13%' }} className="h-full bg-amber-400 shadow-xs" />
            <div style={{ width: '5%' }} className="h-full bg-red-500 rounded-r-full shadow-xs" />
          </div>

          {/* Legend Items underneath */}
          <div className="flex items-center justify-between text-[11px] font-semibold pt-0.5">
            <div className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>12.450 Optimal</span>
            </div>
            <div className="flex items-center gap-1 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>1.980 Menipis</span>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>420 Kritis</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. AKSI CEPAT OPERASIONAL INVENTORY (Mobile Native Experience)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-red-50 text-red-600">
              <QrCode className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Aksi Cepat Inventory
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            Akses Lapangan
          </span>
        </div>

        {/* 6-Button Operational Grid */}
        <div className="grid grid-cols-3 gap-2">
          
          {/* 1. Tambah MOS */}
          <button
            onClick={() => navigate('/mos')}
            className="group relative bg-white hover:bg-red-50/40 active:scale-95 transition-all p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-2">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 leading-tight">
              Tambah MOS
            </span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Penerimaan
            </span>
          </button>

          {/* 2. Scan QR / Barcode */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="group relative bg-white hover:bg-red-50/40 active:scale-95 transition-all p-3 rounded-2xl border-2 border-red-300 bg-gradient-to-b from-red-50/40 to-white shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-2">
              <ScanLine className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <span className="text-xs font-black text-slate-900 leading-tight">
              Scan QR / Barcode
            </span>
            <span className="text-[9px] text-red-600 font-bold mt-0.5">
              Kamera & Rak
            </span>
          </button>

          {/* 3. Ambil Material (MR) */}
          <button
            onClick={() => navigate('/mr')}
            className="group relative bg-white hover:bg-red-50/40 active:scale-95 transition-all p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-2">
              <PackagePlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 leading-tight">
              Ambil Part (MR)
            </span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Pengeluaran
            </span>
          </button>

          {/* 4. Katalog Part */}
          <button
            onClick={() => navigate('/inventory')}
            className="group relative bg-white hover:bg-red-50/40 active:scale-95 transition-all p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-2">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 leading-tight">
              Katalog Part
            </span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Stok & Lokasi Rak
            </span>
          </button>

          {/* 5. Stock Opname */}
          <button
            onClick={() => navigate('/opname')}
            className="group relative bg-white hover:bg-red-50/40 active:scale-95 transition-all p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-2">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 leading-tight">
              Stock Opname
            </span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Blind Count Fisik
            </span>
          </button>

          {/* 6. Pinjam Tool */}
          <button
            onClick={() => navigate('/tools')}
            className="group relative bg-white hover:bg-red-50/40 active:scale-95 transition-all p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-2">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-900 leading-tight">
              Pinjam Tool
            </span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Perkakas Pit
            </span>
          </button>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RINGKASAN METRIK (Kartu Jajaran Genjang / Parallelogram)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-red-50 text-red-600">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Ringkasan Aset & Dokumen
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Realtime
          </span>
        </div>

        {/* Parallelogram Cards Row matching reference */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 px-1 py-1">
          <ParallelogramCard
            title="TOTAL ASET AKTIF"
            value="28"
            unit="SKU"
            subtitle="+4 SKU Bulan Ini"
            subtitleColor="text-emerald-700"
            icon={Package}
            iconColor="text-slate-400"
            accentColor="border-red-700"
            padding="p-3.5 sm:p-4"
            onClick={() => navigate('/inventory')}
          />
          <ParallelogramCard
            title="DRAF MOS PENDING"
            value="05"
            unit="Berkas"
            subtitle="Verifikasi SPV Gudang Siap"
            subtitleIcon={FileCheck2}
            subtitleColor="text-amber-700"
            badgeDotColor="bg-red-600 ring-4 ring-red-100"
            accentColor="border-red-700"
            padding="p-3.5 sm:p-4"
            onClick={() => navigate('/mos')}
          />
          <ParallelogramCard
            title="KRITIS REORDER"
            value="12"
            unit="Part"
            valueColor="text-red-700"
            subtitle="Di bawah buffer minimum"
            subtitleIcon={AlertTriangle}
            subtitleColor="text-red-600"
            icon={AlertTriangle}
            iconColor="text-red-600"
            accentColor="border-red-700"
            padding="p-3.5 sm:p-4"
            onClick={() => navigate('/inventory?status=low_stock')}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SECTION: SUKU CADANG PERLU RESTOCK SEGERA
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5 pt-1">
        
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-red-50 text-red-600">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Suku Cadang Perlu Restock Segera
            </h2>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* List of items inside White Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 space-y-2.5">
          {displayedAttentionItems.map((item) => {
            const isOptimal = item.status === 'Optimal';
            const isKritis = item.status === 'Kritis';

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/inventory?search=${encodeURIComponent(item.partNumber)}`)}
                className="p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 flex flex-col gap-2 cursor-pointer active:scale-98"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Icon Box */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isOptimal
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : isKritis
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                    </div>

                    {/* Title, SKU & Rack Location */}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                        {item.partNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {item.location}
                      </div>
                    </div>
                  </div>

                  {/* Right Metric */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-black ${
                        isOptimal
                          ? 'text-emerald-700'
                          : isKritis
                          ? 'text-rose-600'
                          : 'text-amber-700'
                      }`}
                    >
                      {item.stockCount} {item.stockLabel.split(' ')[0]}
                    </div>
                    <div className="text-[9px] font-semibold text-slate-400">
                      Min: {item.minThreshold}
                    </div>
                  </div>
                </div>

                {/* Progress bar beneath */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${item.progressPercent}%` }}
                    className={`h-full rounded-full ${item.progressColor}`}
                  />
                </div>
              </div>
            );
          })}

          {/* Expand / Collapse Button */}
          <button
            onClick={() => setIsListExpanded(prev => !prev)}
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-98 transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer border border-slate-200/60"
          >
            {isListExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Tutup daftar suku cadang lain</span>
              </>
            ) : (
              <>
                <span>+4 Suku Cadang Lainnya</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. ROLE-SPECIFIC SMALL CLICKABLE MENUS
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1 rounded-lg bg-red-50 text-red-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Menu Akses Cepat Operasional
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {roleMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <button
                key={menu.id}
                onClick={() => navigate(menu.path)}
                className="w-full p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 active:scale-98 transition-all border border-slate-200/80 shadow-xs flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {menu.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {menu.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-red-600 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. INVENTORY QR & BARCODE SCANNER MODAL
      ───────────────────────────────────────────────────────────── */}
      <InventoryScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

    </div>
  );
}
