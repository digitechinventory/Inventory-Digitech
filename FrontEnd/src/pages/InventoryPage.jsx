import React, { useState, useEffect } from 'react';
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
  Eye,
  MoreVertical,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2,
  FileSpreadsheet,
  Printer,
  Sparkles
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ParallelogramCard from '../components/common/ParallelogramCard.jsx';
import QRLabelPrintModal from '../components/printer/QRLabelPrintModal.jsx';
import PrinterSetupModal from '../components/printer/PrinterSetupModal.jsx';
import CyberQRCodeModal from '../components/common/CyberQRCodeModal.jsx';
import IncomingStockQRModal from '../components/inventory/IncomingStockQRModal.jsx';

export default function InventoryPage() {
  const navigate = useNavigate();
  const { role, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [selectedWarehouse, setSelectedWarehouse] = useState('wh-01');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'optimal' | 'low' | 'critical'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'rack'
  const [selectedItem, setSelectedItem] = useState(null);
  const [incomingModalData, setIncomingModalData] = useState({ isOpen: false, item: null });
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);
  const [qrPrintItem, setQrPrintItem] = useState(null);
  const [batchPrintItems, setBatchPrintItems] = useState(null);
  const [cyberQrItem, setCyberQrItem] = useState(null);
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const [selectedQrFilter, setSelectedQrFilter] = useState('ALL'); // 'ALL' | 'WITHOUT_QR' | 'WITH_QR'
  const [isSubmittingNewItem, setIsSubmittingNewItem] = useState(false);

  // Fetch warehouses from database
  const { data: warehousesData } = useQuery({
    queryKey: ['inventory-warehouses'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/inventory/warehouses');
        return Array.isArray(data?.data) ? data.data : [];
      } catch {
        return [];
      }
    },
    staleTime: 60000
  });
  const WAREHOUSES = warehousesData || [];

  // Track printed/installed QR labels in localStorage
  const [printedSkus, setPrintedSkus] = useState(() => {
    try {
      const stored = localStorage.getItem('digitech_printed_qr_skus');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleQrPrinted = () => {
      try {
        setPrintedSkus(JSON.parse(localStorage.getItem('digitech_printed_qr_skus') || '[]'));
      } catch {}
    };
    window.addEventListener('qr-label-printed', handleQrPrinted);
    return () => window.removeEventListener('qr-label-printed', handleQrPrinted);
  }, []);

  const isItemQrReady = (item) => {
    const sku = item?.sku || item?.SKU || item?.item_code;
    if (!sku) return false;
    return printedSkus.includes(sku) || Boolean(item?.qr_printed || item?.has_qr);
  };

  // Table selection & 3-dots action state
  const [selectedTableSkus, setSelectedTableSkus] = useState([]);
  const [activeKebabSku, setActiveKebabSku] = useState(null);
  const [editCatalogItem, setEditCatalogItem] = useState(null);
  const [editCatalogForm, setEditCatalogForm] = useState({
    name: '',
    category: '',
    current_stock: 0,
    min_threshold: 5,
    unit: 'PCS',
    rack: 'R-A01',
    price: 0
  });
  const [catalogDeleteConfirm, setCatalogDeleteConfirm] = useState(null); // { type: 'single', item } | { type: 'bulk', count, skus }
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);

  // Fetch real inventory from API
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
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
    staleTime: 30000
  });

  const inventory = inventoryData || [];

  // Derive warehouse zones dynamically from database inventory items
  const WAREHOUSE_ZONES = React.useMemo(() => {
    const zoneDefs = [
      { code: 'A', name: 'Fast Moving & Filters' },
      { code: 'B', name: 'Hydraulics & Heavy Parts' },
      { code: 'C', name: 'Lubricants & Fluids' },
      { code: 'D', name: 'Electrical & Tools' },
    ];
    return zoneDefs.map((z) => {
      const zoneItems = inventory.filter((it) =>
        String(it.rack || it.bin_location || '').toUpperCase().includes(z.code)
      );
      const racks = Array.from({ length: 6 }, (_, idx) => {
        const rackId = `R-${z.code}0${idx + 1}`;
        const matched = zoneItems.find((it) => (it.rack || it.bin_location) === rackId) || zoneItems[idx];
        const qty = Number(matched?.current_stock ?? matched?.stock_count ?? 0);
        const min = Number(matched?.min_threshold ?? 10);
        const status = matched ? (qty > min ? 'full' : 'optimal') : 'empty';
        return { id: rackId, status };
      });
      return { ...z, racks };
    });
  }, [inventory]);

  // Extract categories dynamically
  const categories = ['ALL', ...new Set(inventory.map(i => i.category).filter(Boolean))];

  // Filtering with QR Status filter
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

    const hasQr = isItemQrReady(item);
    let matchQr = true;
    if (selectedQrFilter === 'WITHOUT_QR') matchQr = !hasQr;
    if (selectedQrFilter === 'WITH_QR') matchQr = hasQr;

    return matchSearch && matchCategory && matchStatus && matchQr;
  });

  // Calculate metrics
  const totalSku = inventory.length;
  const lowStockCount = inventory.filter(i => {
    const curr = Number(i.current_stock ?? i.currentStock ?? 0);
    const min = Number(i.min_threshold ?? i.minThreshold ?? 10);
    return curr <= min;
  }).length;
  const optimalCount = totalSku - lowStockCount;
  const withoutQrCount = inventory.filter(i => !isItemQrReady(i)).length;
  const withQrCount = totalSku - withoutQrCount;
  const totalUnits = inventory.reduce((sum, i) => sum + Number(i.current_stock ?? i.currentStock ?? 0), 0);

  const handleCopySku = (sku, e) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Table selection logic
  const tableSkus = filteredItems.map(i => i.sku || i.SKU).filter(Boolean);
  const isAllTableSelected = tableSkus.length > 0 && tableSkus.every(sku => selectedTableSkus.includes(sku));
  const isSomeTableSelected = tableSkus.length > 0 && tableSkus.some(sku => selectedTableSkus.includes(sku)) && !isAllTableSelected;

  const handleToggleAllTable = () => {
    if (isAllTableSelected) {
      setSelectedTableSkus(prev => prev.filter(sku => !tableSkus.includes(sku)));
    } else {
      setSelectedTableSkus(prev => Array.from(new Set([...prev, ...tableSkus])));
    }
  };

  const handleToggleTableSku = (sku) => {
    setSelectedTableSkus(prev =>
      prev.includes(sku) ? prev.filter(x => x !== sku) : [...prev, sku]
    );
  };

  // Close kebab on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveKebabSku(null);
    if (activeKebabSku) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeKebabSku]);

  // Handle edit catalog item
  const handleOpenEditCatalog = (item) => {
    setEditCatalogItem(item);
    setEditCatalogForm({
      name: item.name || '',
      category: item.category || 'General Spareparts',
      current_stock: Number(item.current_stock ?? item.currentStock ?? 0),
      min_threshold: Number(item.min_threshold ?? item.minThreshold ?? 5),
      unit: item.unit || 'PCS',
      rack: item.rack || 'R-A01',
      price: Number(item.price || 0)
    });
    setActiveKebabSku(null);
  };

  const handleSaveEditCatalog = async (e) => {
    e.preventDefault();
    if (!editCatalogItem) return;
    const sku = editCatalogItem.sku || editCatalogItem.SKU;
    setIsUpdatingItem(true);
    try {
      await api.patch(`/inventory/items/${sku}`, editCatalogForm);
      refetch();
      addToast('Data suku cadang berhasil diperbarui.', 'success');
      setEditCatalogItem(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memperbarui suku cadang.', 'error');
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleExecuteDeleteCatalog = async () => {
    if (!catalogDeleteConfirm) return;
    setIsDeletingItem(true);
    try {
      if (catalogDeleteConfirm.type === 'bulk') {
        await api.post('/inventory/items/bulk-delete', { skus: catalogDeleteConfirm.skus });
        setSelectedTableSkus(prev => prev.filter(sku => !catalogDeleteConfirm.skus.includes(sku)));
        addToast(`${catalogDeleteConfirm.skus.length} suku cadang berhasil dihapus dari katalog.`, 'success');
      } else {
        const sku = catalogDeleteConfirm.item.sku || catalogDeleteConfirm.item.SKU;
        await api.delete(`/inventory/items/${sku}`);
        setSelectedTableSkus(prev => prev.filter(s => s !== sku));
        addToast('Suku cadang berhasil dihapus dari katalog.', 'success');
      }
      refetch();
      setCatalogDeleteConfirm(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghapus suku cadang.', 'error');
    } finally {
      setIsDeletingItem(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans select-none animate-in fade-in duration-200">
      
      {/* ── 1. Top Header Banner (Pure White + Crimson Accent) ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_12px_36px_rgba(220,38,38,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-red-500/10 via-red-500/5 to-transparent pointer-events-none rounded-r-3xl" />
        
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Katalog &amp; Manajemen Stok
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitoring ketersediaan sparepart, bin lokasi rak penyimpanan, dan kartu QR suku cadang DIGITECH.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 ml-auto justify-end shrink-0">
          <button
            onClick={() => setIncomingModalData({ isOpen: true, item: null })}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-red-600/25 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Input Barang Masuk</span>
          </button>

          <button
            onClick={() => navigate('/mr')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <PackagePlus className="w-4 h-4 text-red-600" />
            <span className="hidden sm:inline">Buat Tiket Permintaan (MR)</span>
            <span className="sm:hidden">MR</span>
          </button>
        </div>
      </div>

      {/* ── 2. Four Key Operational Metrics Parallelogram Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 py-2">
        <ParallelogramCard
          title="TOTAL PART NUMBER"
          value={totalSku}
          unit="SKU"
          subtitle="• +48 SKU Terdaftar Bulan Ini"
          subtitleColor="text-slate-600"
          icon={Boxes}
          iconColor="text-slate-700"
          accentColor="border-slate-700"
          valueColor="text-slate-900"
        />

        <ParallelogramCard
          title="STOK OPTIMAL"
          value={optimalCount}
          unit="PART"
          subtitle="Di Atas Batas Safety Stock"
          subtitleIcon={CheckCircle2}
          subtitleColor="text-emerald-700"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          accentColor="border-emerald-600"
          valueColor="text-emerald-600"
        />

        <ParallelogramCard
          title="KRITIS REORDER"
          value={lowStockCount}
          unit="PART"
          subtitle="Di Bawah Buffer Minimum"
          subtitleIcon={AlertTriangle}
          subtitleColor="text-red-700"
          icon={AlertTriangle}
          iconColor="text-red-600"
          accentColor="border-red-600"
          valueColor="text-red-600"
        />

        <ParallelogramCard
          title="TOTAL FISIK UNIT"
          value={totalUnits.toLocaleString('id-ID')}
          unit="UNIT"
          subtitle="Tersimpan di 4 Gudang Site"
          subtitleIcon={Package}
          subtitleColor="text-blue-700"
          icon={Package}
          iconColor="text-blue-600"
          accentColor="border-blue-600"
          valueColor="text-blue-600"
        />
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

          {/* Controls: Status Filter, QR Filter & View Mode Toggle — Pushed to right edge */}
          <div className="flex flex-wrap items-center gap-2.5 ml-auto justify-end shrink-0">
            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">Stok:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="ALL">Semua Stok</option>
                <option value="optimal">Optimal (Cukup)</option>
                <option value="low">Menipis (Low Stock)</option>
                <option value="critical">Kritis (Hampir Habis)</option>
              </select>
            </div>

            {/* QR Label Filter Dropdown for Asset Tracking */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">Tracking QR:</span>
              <select
                value={selectedQrFilter}
                onChange={(e) => setSelectedQrFilter(e.target.value)}
                className={`h-10 px-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer transition-all ${
                  selectedQrFilter === 'WITHOUT_QR'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : selectedQrFilter === 'WITH_QR'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="ALL">Semua Status QR ({totalSku})</option>
                <option value="WITHOUT_QR">Belum Ber-QR ({withoutQrCount})</option>
                <option value="WITH_QR">Sudah Ber-QR ({withQrCount})</option>
              </select>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
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
                <span>Matriks Rak</span>
              </button>
            </div>
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
                      {/* Top Header: Category Pill & Status Badge & QR Indicator */}
                      <div className="flex items-start justify-between gap-1.5 mb-3 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 truncate max-w-[130px]">
                          {item.category || 'Sparepart Umum'}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {isItemQrReady(item) ? (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1" title="QR Code terpasang pada fisik aset">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              QR Ready
                            </span>
                          ) : (
                            <span
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1"
                              title="Belum teregistrasi label QR Code"
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                              Belum QR
                            </span>
                          )}

                          {isCritical ? (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                              Kritis
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              Menipis
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              Optimal
                            </span>
                          )}
                        </div>
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

                    {/* Card Footer: Stock Count & Operational Actions */}
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
                        {/* Unified Action: Penerimaan & Cetak QR (Side-by-side) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIncomingModalData({ isOpen: true, item });
                          }}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Penerimaan Suku Cadang & Registrasi Label QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Label &amp; Cetak QR</span>
                        </button>

                        {/* Detail Modal */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 transition cursor-pointer"
                          title="Lihat Detail Suku Cadang"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
        <div className="space-y-4">
          {/* Bulk Action Bar (When items in table are selected - Admin only) */}
          {isAdmin && selectedTableSkus.length > 0 && (
            <div className="bg-gradient-to-r from-red-800 to-red-700 text-white rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-4 shadow-xl border border-red-900/30 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-red-600 text-white text-xs font-black shadow-sm">
                  {selectedTableSkus.length}
                </span>
                <div>
                  <p className="text-xs font-bold text-white">
                    {selectedTableSkus.length} suku cadang dipilih
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Pilih aksi massal untuk suku cadang yang ditandai dalam katalog
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const selected = inventory.filter(i => selectedTableSkus.includes(i.sku || i.SKU));
                    if (selected.length > 0) {
                      setBatchPrintItems(selected);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-red-600" />
                  <span>Cetak Batch QR ({selectedTableSkus.length})</span>
                </button>

                <button
                  onClick={() => setSelectedTableSkus([])}
                  className="px-3 py-1.5 text-xs text-red-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  Batal Pilih
                </button>

                <button
                  onClick={() =>
                    setCatalogDeleteConfirm({
                      type: 'bulk',
                      count: selectedTableSkus.length,
                      skus: [...selectedTableSkus]
                    })
                  }
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus ({selectedTableSkus.length})
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                    {/* Checkbox Header (Admin Only) */}
                    {isAdmin && (
                      <th className="px-3.5 py-3.5 text-center w-10">
                        <button
                          type="button"
                          onClick={handleToggleAllTable}
                          className="p-1 rounded hover:bg-slate-200 transition cursor-pointer text-slate-500 hover:text-slate-800 inline-flex items-center justify-center"
                          title={isAllTableSelected ? 'Batalkan semua pilihan' : 'Pilih semua di halaman ini'}
                        >
                          {isAllTableSelected ? (
                            <CheckSquare className="w-4 h-4 text-red-600" />
                          ) : isSomeTableSelected ? (
                            <MinusSquare className="w-4 h-4 text-red-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-4 py-3.5 text-left">SKU / Part Number</th>
                    <th className="px-4 py-3.5 text-left">Nama Suku Cadang</th>
                    <th className="px-4 py-3.5 text-left">Kategori</th>
                    <th className="px-4 py-3.5 text-center">Stok Fisik</th>
                    <th className="px-4 py-3.5 text-center">Safety Stock</th>
                    <th className="px-4 py-3.5 text-left">Lokasi Rak</th>
                    <th className="px-4 py-3.5 text-left">Status</th>
                    <th className="px-4 py-3.5 text-center">Tracking QR</th>
                    <th className="px-4 py-3.5 text-center w-28">Aksi Cepat</th>
                    <th className="px-4 py-3.5 text-center w-14">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const sku = item.sku || item.SKU;
                    const curr = Number(item.current_stock ?? item.currentStock ?? 0);
                    const min = Number(item.min_threshold ?? item.minThreshold ?? 10);
                    const unit = item.unit || 'PCS';
                    const isLow = curr <= min;
                    const isSelected = selectedTableSkus.includes(sku);

                    return (
                      <tr
                        key={sku}
                        onClick={() => setSelectedItem(item)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-red-50/30'
                        }`}
                      >
                        {/* Checkbox Cell (Admin Only) */}
                        {isAdmin && (
                          <td
                            className="px-3.5 py-3 text-center w-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleTableSku(sku)}
                              className="p-1 rounded hover:bg-slate-200 transition cursor-pointer text-slate-500 inline-flex items-center justify-center"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-red-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </td>
                        )}

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

                        {/* QR Tracking Status Cell */}
                        <td className="px-4 py-3 text-center">
                          {isItemQrReady(item) ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                              title="QR Code Siap & Terdaftar"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              QR Ready
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300"
                              title="Belum terpasang QR Code"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Belum QR
                            </span>
                          )}
                        </td>

                        {/* Quick Actions (Cetak QR) */}
                        <td className="px-4 py-3 text-center w-28" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setQrPrintItem(item)}
                              className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Cetak Label Stiker QR Thermal"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Cetak QR</span>
                            </button>
                          </div>
                        </td>

                        {/* 3-Dots Action Cell */}
                        <td className="px-4 py-3 text-center relative w-14" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setActiveKebabSku(activeKebabSku === sku ? null : sku)}
                            className={`p-1.5 rounded-xl border transition cursor-pointer ${
                              activeKebabSku === sku
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            }`}
                            title="Opsi Suku Cadang"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeKebabSku === sku && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-3 top-10 z-40 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-150"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setIncomingModalData({ isOpen: true, item });
                                  setActiveKebabSku(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5 text-red-600" />
                                <span>Penerimaan &amp; Cetak QR</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setActiveKebabSku(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Detail Informasi</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  navigate('/mr');
                                  setActiveKebabSku(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                              >
                                <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ajukan Tiket MR</span>
                              </button>

                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCatalog(item)}
                                    className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Edit Suku Cadang</span>
                                  </button>

                                  <div className="border-t border-slate-100 my-1"></div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCatalogDeleteConfirm({ type: 'single', item });
                                      setActiveKebabSku(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-bold transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                    <span>Hapus dari Katalog</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: 2D RACK MATRIX MAP VIEW */}
      {viewMode === 'rack' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Matriks Rak ({WAREHOUSES.find(w => w.id === selectedWarehouse)?.name || selectedWarehouse})</h3>
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
          className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
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
                  <div
                    onClick={() => {
                      const itm = selectedItem;
                      setSelectedItem(null);
                      setIncomingModalData({ isOpen: true, item: itm });
                    }}
                    className="w-14 h-14 bg-white p-1 rounded-xl border border-red-200 flex items-center justify-center shadow-xs cursor-pointer hover:border-red-500 hover:shadow-md transition group"
                    title="Buka Penerimaan & Registrasi QR (Side-by-Side)"
                  >
                    <QrCode className="w-10 h-10 text-slate-900 group-hover:text-red-600 transition" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">QR Asset Tag Terverifikasi</div>
                    <div className="text-[11px] font-mono text-red-700 font-bold mt-0.5">
                      Lokasi Rak: {selectedItem.rack || 'R-A01'}
                    </div>
                    <div className="text-[10px] text-slate-500">Area Rak 1 Pit Sebamban</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const itm = selectedItem;
                      setSelectedItem(null);
                      setIncomingModalData({ isOpen: true, item: itm });
                    }}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    title="Buka Formulir & Live QR Generator"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Registrasi &amp; Cetak QR</span>
                  </button>
                </div>
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

      {/* ── 7. PENERIMAAN BARANG MASUK & LIVE QR CODE MODAL (SIDE-BY-SIDE) ── */}
      <IncomingStockQRModal
        isOpen={incomingModalData.isOpen || showAddModal}
        initialItem={incomingModalData.item}
        onClose={() => {
          setIncomingModalData({ isOpen: false, item: null });
          setShowAddModal(false);
        }}
        onSaved={() => {
          refetch();
        }}
        onOpenPrinterSetup={() => setShowPrinterSetup(true)}
      />

      {/* MODAL: EDIT DATA SUKU CADANG */}
      {editCatalogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            style={{
              clipPath: 'polygon(0 16px, 100% 0, 100% calc(100% - 16px), 0 100%)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(245,158,11,0.10)',
            }}
          >
            <div style={{ background: 'linear-gradient(90deg, #F59E0B, #FBBF24)', height: '4px', width: '100%' }} />
            <div className="px-6 py-4 pt-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Data Suku Cadang</h3>
                  <p className="text-[11px] font-mono text-slate-500">{editCatalogItem.sku || editCatalogItem.SKU}</p>
                </div>
              </div>
              <button
                onClick={() => setEditCatalogItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCatalog}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Suku Cadang
                  </label>
                  <input
                    type="text"
                    value={editCatalogForm.name}
                    onChange={(e) => setEditCatalogForm({ ...editCatalogForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Sparepart
                  </label>
                  <input
                    type="text"
                    value={editCatalogForm.category}
                    onChange={(e) => setEditCatalogForm({ ...editCatalogForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Stok Fisik
                    </label>
                    <input
                      type="number"
                      value={editCatalogForm.current_stock}
                      onChange={(e) => setEditCatalogForm({ ...editCatalogForm, current_stock: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Min Threshold
                    </label>
                    <input
                      type="number"
                      value={editCatalogForm.min_threshold}
                      onChange={(e) => setEditCatalogForm({ ...editCatalogForm, min_threshold: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Satuan
                    </label>
                    <input
                      type="text"
                      value={editCatalogForm.unit}
                      onChange={(e) => setEditCatalogForm({ ...editCatalogForm, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Lokasi Rak (Bin)
                    </label>
                    <input
                      type="text"
                      value={editCatalogForm.rack}
                      onChange={(e) => setEditCatalogForm({ ...editCatalogForm, rack: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Harga Estimasi (IDR)
                    </label>
                    <input
                      type="number"
                      value={editCatalogForm.price}
                      onChange={(e) => setEditCatalogForm({ ...editCatalogForm, price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 pt-3 pb-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCatalogItem(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingItem}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS DARI KATALOG */}
      {catalogDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-center"
            style={{
              clipPath: 'polygon(0 16px, 100% 0, 100% calc(100% - 16px), 0 100%)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(220,38,38,0.12)',
            }}
          >
            <div style={{ background: 'linear-gradient(90deg, #DC2626, #EF4444)', height: '4px', width: '100%' }} />
            <div className="p-6 pt-8 pb-9 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {catalogDeleteConfirm.type === 'bulk'
                  ? `Hapus ${catalogDeleteConfirm.count} Suku Cadang?`
                  : 'Hapus Suku Cadang dari Katalog?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {catalogDeleteConfirm.type === 'bulk'
                  ? `Anda akan menghapus ${catalogDeleteConfirm.count} item suku cadang dari katalog inventaris.`
                  : `Item "${catalogDeleteConfirm.item?.name}" (SKU: ${catalogDeleteConfirm.item?.sku || catalogDeleteConfirm.item?.SKU}) akan dihapus dari katalog.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCatalogDeleteConfirm(null)}
                disabled={isDeletingItem}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer flex-1"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteCatalog}
                disabled={isDeletingItem}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex-1 disabled:opacity-50"
              >
                {isDeletingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Ya, Hapus
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Thermal QR Label Print Modal (Single or Batch) */}
      <QRLabelPrintModal
        item={qrPrintItem}
        items={batchPrintItems}
        isOpen={Boolean(qrPrintItem || batchPrintItems)}
        onClose={() => {
          setQrPrintItem(null);
          setBatchPrintItems(null);
        }}
        onOpenPrinterSetup={() => setShowPrinterSetup(true)}
      />

      {/* Printer Setup & Integration Modal */}
      <PrinterSetupModal
        isOpen={showPrinterSetup}
        onClose={() => setShowPrinterSetup(false)}
      />

      {/* Fallback Cyber QR Item handler redirected to side-by-side IncomingStockQRModal */}
      {cyberQrItem && (
        <IncomingStockQRModal
          isOpen={Boolean(cyberQrItem)}
          initialItem={cyberQrItem}
          onClose={() => setCyberQrItem(null)}
          onSaved={() => refetch()}
          onOpenPrinterSetup={() => setShowPrinterSetup(true)}
        />
      )}

    </div>
  );
}
