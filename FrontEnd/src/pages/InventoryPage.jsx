import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Download,
  Boxes,
  Package,
  AlertTriangle,
  CheckCircle2,
  Layers,
  LayoutGrid,
  List,
  MapPin,
  QrCode,
  ArrowRight,
  TrendingUp,
  X,
  Copy,
  Check,
  PackagePlus,
  ExternalLink,
  ShieldCheck,
  Eye
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { INVENTORY_LEDGER, WAREHOUSE_ZONES, SECTION_USAGE_STATS } from '../mockData.js';

const WAREHOUSES = [
  { id: 'wh-1', name: 'Warehouse 1', code: 'BIB-WH-01', location: 'Pit Sebamban KM 24' },
  { id: 'wh-2', name: 'Warehouse 2', code: 'BIB-PORT-01', location: 'Port Batulicin' },
  { id: 'wh-3', name: 'Warehouse 3', code: 'BIB-WH-03', location: 'Logistics Hub Angsana' },
  { id: 'wh-4', name: 'Warehouse 4', code: 'BIB-REG-04', location: 'Transit Banjarmasin' },
];

export default function InventoryPage() {
  const navigate = useNavigate();
  const { role, isAdmin } = useAuth();

  const [selectedWarehouse, setSelectedWarehouse] = useState('wh-1');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'optimal' | 'low' | 'critical'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'rack'
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);

  // Fetch real inventory from API (falls back gracefully to INVENTORY_LEDGER)
  const { data: inventoryData, isLoading, refetch } = useQuery({
    queryKey: ['inventory', selectedWarehouse, selectedCategory, search],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedWarehouse) params.set('warehouse_id', selectedWarehouse);
        if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
        if (search) params.set('search', search);
        const { data } = await api.get(`/inventory?${params}`);
        const items = data?.data || data;
        return Array.isArray(items) && items.length > 0 ? items : INVENTORY_LEDGER;
      } catch {
        return INVENTORY_LEDGER;
      }
    },
    staleTime: 30000
  });

  const inventory = inventoryData || INVENTORY_LEDGER;

  // Extract categories dynamically
  const categories = ['ALL', ...new Set(inventory.map(i => i.category).filter(Boolean))];

  // Filtering
  const filteredItems = inventory.filter(item => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.rack?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q);

    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    const currentStock = Number(item.current_stock ?? item.currentStock ?? 0);
    const minThreshold = Number(item.min_threshold ?? item.minThreshold ?? 10);
    const isLow = currentStock <= minThreshold;
    const isCritical = currentStock <= Math.floor(minThreshold / 2);

    let matchStatus = true;
    if (selectedStatus === 'optimal') matchStatus = !isLow;
    if (selectedStatus === 'low') matchStatus = isLow && !isCritical;
    if (selectedStatus === 'critical') matchStatus = isCritical;

    return matchSearch && matchCategory && matchStatus;
  });

  // Calculate metrics
  const totalSku = inventory.length;
  const lowStockCount = inventory.filter(i => {
    const curr = Number(i.current_stock ?? i.currentStock ?? 0);
    const min = Number(i.min_threshold ?? i.minThreshold ?? 10);
    return curr <= min;
  }).length;
  const optimalCount = totalSku - lowStockCount;
  const totalUnits = inventory.reduce((sum, i) => sum + Number(i.current_stock ?? i.currentStock ?? 0), 0);

  const handleCopySku = (sku, e) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  return (
    <div className="space-y-6 pb-16 font-sans select-none animate-in fade-in duration-200">
      
      {/* ── 1. Top Header Banner (Pure White + Crimson Accent) ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_12px_36px_rgba(220,38,38,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-red-500/10 via-red-500/5 to-transparent pointer-events-none rounded-r-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            Katalog Suku Cadang &amp; Inventaris Gudang Real-Time
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Katalog &amp; Manajemen Stok Gudang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitoring ketersediaan sparepart, denah rak 2D bin location, dan kartu QR suku cadang PT Borneo Indobara.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-red-600/25 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item Baru</span>
            </button>
          )}

          <button
            onClick={() => navigate('/mr')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <PackagePlus className="w-4 h-4 text-red-600" />
            <span>Buat Tiket Permintaan (MR)</span>
          </button>
        </div>
      </div>

      {/* ── 2. Four Key Operational Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total SKU */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Part Number</span>
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/80 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalSku}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">SKU aktif terdaftar di sistem</p>
        </div>

        {/* Optimal Stock */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stok Optimal</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">{optimalCount}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Di atas batas minimum safety stock</p>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-red-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Perlu Restock</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200/80 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600">{lowStockCount}</div>
          <p className="text-[10px] text-red-500/80 mt-1 font-medium">Menyentuh ambang batas minimum</p>
        </div>

        {/* Total Units */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Fisik Unit</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600">{totalUnits.toLocaleString()}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Jumlah fisik seluruh rak gudang</p>
        </div>
      </div>

      {/* ── 3. Warehouse Location Selector Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {WAREHOUSES.map((wh) => {
          const isSelected = selectedWarehouse === wh.id;
          return (
            <button
              key={wh.id}
              onClick={() => setSelectedWarehouse(wh.id)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md shadow-red-600/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{wh.name}</span>
              <span className={`text-[10px] font-normal font-mono px-1.5 py-0.5 rounded ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {wh.code}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 4. Search, Category Chips & View Mode Controls ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Universal Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama part, SKU, part number, rak..."
              className="w-full h-10 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 focus:bg-white transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="optimal">Optimal (Cukup)</option>
              <option value="low">Menipis (Low Stock)</option>
              <option value="critical">Kritis (Hampir Habis)</option>
            </select>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu Grid</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>

            <button
              onClick={() => setViewMode('rack')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'rack'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Denah 2D Rak</span>
            </button>
          </div>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 custom-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'ALL'
              ? inventory.length
              : inventory.filter(i => i.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-2xs font-black'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>{cat === 'ALL' ? 'Semua Kategori' : cat}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. CONTENT AREA: VIEW MODES ── */}
      
      {/* MODE 1: MODERN CARD GRID VIEW (Default & Wow Factor) */}
      {viewMode === 'grid' && (
        <div>
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Tidak ada material yang cocok</h3>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter kategori.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const sku = item.sku || item.SKU || 'BIB-SKU-001';
                const currentStock = Number(item.current_stock ?? item.currentStock ?? 0);
                const minThreshold = Number(item.min_threshold ?? item.minThreshold ?? 10);
                const unit = item.unit || 'PCS';
                const rack = item.rack || 'R-A01';
                const isLow = currentStock <= minThreshold;
                const isCritical = currentStock <= Math.floor(minThreshold / 2);
                const pct = Math.min(100, Math.round((currentStock / Math.max(1, minThreshold * 2)) * 100));

                return (
                  <div
                    key={sku}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-red-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top ambient hover flare */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Top Header: Category Pill & Status Badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 truncate max-w-[140px]">
                          {item.category || 'Sparepart Umum'}
                        </span>

                        {isCritical ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 shrink-0 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            Kritis
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shrink-0">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Menipis
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Optimal
                          </span>
                        )}
                      </div>

                      {/* Part Name & SKU */}
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                        {item.name}
                      </h3>

                      {/* SKU Pill with Quick Copy Button */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs font-mono font-bold text-red-700 bg-red-50/80 px-2 py-0.5 rounded-md border border-red-100">
                          {sku}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopySku(sku, e)}
                          title="Salin SKU"
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          {copiedSku === sku ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Bin / Rack Location Indicator */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Rak Bin:</span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {rack}
                        </span>
                      </div>

                      {/* Stock Level Bar */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                          <span>Kapasitas Stok</span>
                          <span className="font-mono text-slate-700">
                            Min: {minThreshold} {unit}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCritical
                                ? 'bg-red-600'
                                : isLow
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Stock Count & Quick MR Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Stok Tersedia</div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-black ${
                            isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {currentStock}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/mr');
                          }}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-200 hover:border-red-600 flex items-center gap-1 cursor-pointer"
                          title="Buat Permintaan Material (MR)"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Ambil</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 transition cursor-pointer"
                          title="Lihat Detail & QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: MODERN CLEAN TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="px-4 py-3.5 text-left">SKU / Part Number</th>
                  <th className="px-4 py-3.5 text-left">Nama Suku Cadang</th>
                  <th className="px-4 py-3.5 text-left">Kategori</th>
                  <th className="px-4 py-3.5 text-center">Stok Fisik</th>
                  <th className="px-4 py-3.5 text-center">Safety Stock</th>
                  <th className="px-4 py-3.5 text-left">Lokasi Rak</th>
                  <th className="px-4 py-3.5 text-left">Status</th>
                  <th className="px-4 py-3.5 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const sku = item.sku || item.SKU;
                  const curr = Number(item.current_stock ?? item.currentStock ?? 0);
                  const min = Number(item.min_threshold ?? item.minThreshold ?? 10);
                  const unit = item.unit || 'PCS';
                  const isLow = curr <= min;

                  return (
                    <tr
                      key={sku}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-red-50/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-red-600">{sku}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 max-w-xs truncate">{item.name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 text-center font-black text-slate-900">
                        {curr} <span className="text-[10px] font-normal text-slate-500">{unit}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-500">{min} {unit}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">{item.rack || '-'}</td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/mr');
                          }}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-lg text-xs font-bold transition border border-red-200 hover:border-red-600 cursor-pointer"
                        >
                          MR
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 3: 2D RACK MATRIX MAP VIEW */}
      {viewMode === 'rack' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Denah 2D Rak Gudang ({selectedWarehouse})</h3>
              <p className="text-xs text-slate-500">Visualisasi kapasitas lorong &amp; bin location penempatan suku cadang</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-600" /> Penuh (&gt;90%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Optimal (50-90%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-dashed border-slate-300" /> Kosong
              </span>
            </div>
          </div>

          {/* Zones Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WAREHOUSE_ZONES.map((zone) => (
              <div key={zone.code} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-900 mb-2">Zone {zone.code} — {zone.name}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {zone.racks.slice(0, 6).map((rack) => (
                    <div
                      key={rack.id}
                      className={`h-9 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center border transition-all ${
                        rack.status === 'full'
                          ? 'bg-red-600 text-white border-red-700'
                          : rack.status === 'optimal'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-white text-slate-400 border-dashed border-slate-200'
                      }`}
                    >
                      {rack.id}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. ITEM DETAIL & QR MODAL (100% Light Theme) ── */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Pure White with Crimson Border */}
            <div className="bg-white p-5 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-100">
                  {selectedItem.category || 'Sparepart Site'}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedItem.name}
                </h3>
                <div className="text-xs font-mono text-slate-500 mt-0.5">
                  SKU: {selectedItem.sku || selectedItem.SKU}
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* QR Code and Location Banner */}
              <div className="p-4 rounded-2xl bg-red-50/40 border border-red-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white p-1 rounded-xl border border-red-200 flex items-center justify-center shadow-xs">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">QR Asset Tag Terverifikasi</div>
                    <div className="text-[11px] font-mono text-red-700 font-bold mt-0.5">
                      Lokasi Rak: {selectedItem.rack || 'R-A01'}
                    </div>
                    <div className="text-[10px] text-slate-500">Warehouse 1 Pit Sebamban</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Mencetak label QR untuk SKU ${selectedItem.sku}...`)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Print QR
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Stok Tersedia</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedItem.current_stock ?? selectedItem.currentStock} {selectedItem.unit || 'PCS'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Ambang Minimum (Safety)</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedItem.min_threshold ?? selectedItem.minThreshold} {selectedItem.unit || 'PCS'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    navigate('/mr');
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/25 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>Ambil Suku Cadang (MR Langsung)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. ADD ITEM MODAL (Admin Only) ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Tambah Suku Cadang Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                try {
                  await api.post('/inventory', {
                    name: fd.get('name'),
                    sku: fd.get('sku'),
                    category: fd.get('category'),
                    current_stock: Number(fd.get('current_stock')),
                    min_threshold: Number(fd.get('min_threshold')),
                    unit: fd.get('unit'),
                    rack: fd.get('rack')
                  });
                  alert('Item baru berhasil ditambahkan ke katalog.');
                  setShowAddModal(false);
                  refetch();
                } catch (err) {
                  alert(err.response?.data?.error?.message || err.message || 'Gagal menambahkan item.');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Material / Suku Cadang</label>
                <input required name="name" placeholder="cth: Komatsu PC2000 Hydraulic Hose" className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold mt-1 focus:ring-2 focus:ring-red-500" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Part Number / SKU</label>
                  <input required name="sku" placeholder="BIB-HYD-001" className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold mt-1 focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Kategori</label>
                  <input required name="category" placeholder="Hydraulics" className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold mt-1 focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Stok Awal</label>
                  <input required type="number" name="current_stock" defaultValue={10} className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Safety Stock</label>
                  <input required type="number" name="min_threshold" defaultValue={5} className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Satuan</label>
                  <input required name="unit" defaultValue="PCS" className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold mt-1" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Bin / Posisi Rak</label>
                <input required name="rack" placeholder="R-A01" className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold mt-1" />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/25 cursor-pointer mt-2"
              >
                Simpan ke Katalog
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
