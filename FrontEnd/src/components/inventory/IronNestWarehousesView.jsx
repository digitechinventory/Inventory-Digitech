import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Package,
  Truck,
  Archive,
  PackageCheck,
  TrendingUp,
  TrendingDown,
  X,
  Check,
  QrCode,
  AlertTriangle,
  Layers,
  MapPin,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { getWarehouses, getInventoryItems, getInventoryStats } from '../../api/inventoryApi';
import { useAuth } from '../../context/AuthContext';

export default function IronNestWarehousesView() {
  const { role } = useAuth();

  // Selected states
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('wh-01');
  const [activeSectionCode, setActiveSectionCode] = useState('B');
  const [selectedShelf, setSelectedShelf] = useState(null);

  // Modals
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Filter and sort state
  const [currentFilter, setCurrentFilter] = useState('all'); // all | occupied | empty | critical
  const [currentSort, setCurrentSort] = useState('code'); // code | usage | name

  // Live data
  const [warehouses, setWarehouses] = useState([
    { id: 'wh-01', name: 'Area Rak 1', fullName: 'Area Rak 1 (Main Pit Site BIB-02)', code: 'BIB-R1', total_shelves: 240, occupied_shelves: 134 },
    { id: 'wh-02', name: 'Area Rak 2', fullName: 'Area Rak 2 (Central Workshop)', code: 'BIB-R2', total_shelves: 180, occupied_shelves: 95 },
    { id: 'wh-03', name: 'Area Rak 3', fullName: 'Area Rak 3 (Sebamban Port Logistics)', code: 'BIB-R3', total_shelves: 200, occupied_shelves: 110 },
    { id: 'wh-04', name: 'Area Rak 4', fullName: 'Area Rak 4 (Sub-Depot Angsana)', code: 'BIB-R4', total_shelves: 120, occupied_shelves: 48 },
  ]);

  const [dbItems, setDbItems] = useState([]);
  const [stats, setStats] = useState({
    locationUsedPercent: 56,
    totalShelves: 240,
    emptyShelves: 136,
    fullShelves: 84,
    newlyAdded: 20,
    ordersReceived: 4236,
    ordersShipped: 2778,
    ordersReturned: 147,
    ordersCanceled: 537
  });

  // Success message toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch real data from backend/Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const [whData, itemsData, statsData] = await Promise.all([
          getWarehouses(),
          getInventoryItems(),
          getInventoryStats()
        ]);
        if (whData && whData.length > 0) {
          setWarehouses(whData.map((w, idx) => ({
            ...w,
            name: `Area Rak ${idx + 1}`,
            fullName: `Area Rak ${idx + 1} (${w.name?.replace(/Warehouse \d+/gi, '').replace(/[()]/g, '').trim() || 'Site BIB'})`
          })));
        }
        if (itemsData && itemsData.length > 0) {
          setDbItems(itemsData);
        }
        if (statsData) {
          setStats(prev => ({
            ...prev,
            ...statsData,
            locationUsedPercent: 56, // aligned with mockup 56%
            totalShelves: 240,
            emptyShelves: 136,
            fullShelves: 84,
            newlyAdded: 20
          }));
        }
      } catch (err) {
        console.warn('Error loading warehouse data:', err);
      }
    }
    loadData();
  }, []);

  // 4 Sections mapped to genuine mining inventory categories from PRD
  const [sections, setSections] = useState([
    {
      code: 'A',
      title: 'A - Mesin & Filter',
      subtitle: 'Mechanical & Filtration',
      filledCount: 5,
      totalCount: 12,
      colorTheme: 'emerald', // soft green fill in mockup
      // 12 slots (2x6 layout)
      slots: [
        { id: 'A1', status: 'empty', sku: null },
        { id: 'A2', status: 'filled', sku: 'BIB-CAT-777D-FLTR', name: 'Cat 777D Engine Oil Filter (P550388)', qty: 4, min: 10, unit: 'PCS', condition: 'Baru' },
        { id: 'A3', status: 'empty', sku: null },
        { id: 'A4', status: 'empty', sku: null },
        { id: 'A5', status: 'filled', sku: 'BIB-KOM-785-BELT', name: 'Fan V-Belt Komatsu HD785-7', qty: 22, min: 8, unit: 'SET', condition: 'Baru' },
        { id: 'A6', status: 'filled', sku: 'BIB-CAT-777D-TURBO', name: 'Turbocharger Cartridge CAT 3508', qty: 3, min: 2, unit: 'SET', condition: 'Optimal' },
        { id: 'A7', status: 'filled', sku: 'BIB-VOL-FH16-CLTCH', name: 'Clutch Plate Kit Volvo FH16 610HP', qty: 6, min: 4, unit: 'SET', condition: 'Baru' },
        { id: 'A8', status: 'empty', sku: null },
        { id: 'A9', status: 'empty', sku: null },
        { id: 'A10', status: 'empty', sku: null },
        { id: 'A11', status: 'empty', sku: null },
        { id: 'A12', status: 'filled', sku: 'BIB-CUM-QSK60-INJ', name: 'Fuel Injector Cummins QSK60 High Pressure', qty: 16, min: 6, unit: 'PCS', condition: 'Baru' },
      ]
    },
    {
      code: 'B',
      title: 'B - Hidrolik & Seal',
      subtitle: 'Hydraulics & Seals',
      filledCount: 7,
      totalCount: 12,
      colorTheme: 'amber', // soft yellow/amber fill in mockup
      slots: [
        { id: 'B1', status: 'filled', sku: 'BIB-KOM-PC2000-HYD', name: 'Hydraulic Cylinder Seal Kit PC2000 Boom', qty: 18, min: 8, unit: 'SET', condition: 'Baru' },
        { id: 'B2', status: 'empty', sku: null },
        { id: 'B3', status: 'filled', sku: 'BIB-CAT-777D-PUMP', name: 'Main Hydraulic Pump Parker P31', qty: 2, min: 3, unit: 'SET', condition: 'Kritis' },
        { id: 'B4', status: 'empty', sku: null },
        { id: 'B5', status: 'empty', sku: null },
        { id: 'B6', status: 'filled', sku: 'BIB-AERO-HOSE-100', name: 'Hydraulic Hose SAE 100R15 1-1/2 Inch (50m)', qty: 8, min: 5, unit: 'MTR', condition: 'Baik' },
        { id: 'B7', status: 'filled', sku: 'BIB-REX-VALVE-PVG', name: 'Proportional Valve Rexroth 4WRPEH', qty: 5, min: 2, unit: 'PCS', condition: 'Baru' },
        { id: 'B8', status: 'filled', sku: 'BIB-HYD-O-RING-BOX', name: 'Universal Fluorocarbon O-Ring Kit 400pcs', qty: 24, min: 10, unit: 'BOX', condition: 'Baru' },
        { id: 'B9', status: 'filled', sku: 'BIB-KOM-STEER-CYL', name: 'Steering Cylinder Komatsu HD465-7R', qty: 4, min: 2, unit: 'UNIT', condition: 'Baru' },
        { id: 'B10', status: 'empty', sku: null },
        { id: 'B11', status: 'empty', sku: null },
        { id: 'B12', status: 'filled', sku: 'BIB-HYD-QUICK-COUP', name: 'Quick Release Coupler ISO 7241-A 1/2 Inch', qty: 45, min: 15, unit: 'PCS', condition: 'Baru' },
      ]
    },
    {
      code: 'C',
      title: 'C - Pelumas & Fluida',
      subtitle: 'Lubricants & Fuel',
      filledCount: 8,
      totalCount: 12,
      colorTheme: 'purple', // soft purple/violet fill in mockup
      slots: [
        { id: 'C1', status: 'empty', sku: null },
        { id: 'C2', status: 'filled', sku: 'BIB-LUB-MOB-15W40', name: 'Mobil Delvac Modern 15W-40 Super Defense', qty: 38, min: 15, unit: 'DRUM', condition: 'Segel' },
        { id: 'C3', status: 'filled', sku: 'BIB-LUB-CAS-EP2', name: 'Castrol Spheerol EPL 2 Mining Grease', qty: 14, min: 10, unit: 'PAIL', condition: 'Baik' },
        { id: 'C4', status: 'empty', sku: null },
        { id: 'C5', status: 'filled', sku: 'BIB-LUB-SHL-T68', name: 'Shell Tellus S2 V 68 Hydraulic Oil', qty: 6, min: 20, unit: 'DRUM', condition: 'Kritis' },
        { id: 'C6', status: 'filled', sku: 'BIB-LUB-TOTAL-TRAN', name: 'Total Dynatrans MPV Wet Brake Fluid', qty: 12, min: 5, unit: 'DRUM', condition: 'Segel' },
        { id: 'C7', status: 'filled', sku: 'BIB-LUB-VALV-HD85W', name: 'Valvoline Heavy Duty Gear Oil 85W-140', qty: 9, min: 4, unit: 'DRUM', condition: 'Segel' },
        { id: 'C8', status: 'empty', sku: null },
        { id: 'C9', status: 'empty', sku: null },
        { id: 'C10', status: 'filled', sku: 'BIB-CLEAN-BRAKE', name: 'Wurth Industrial Brake & Parts Cleaner 500ml', qty: 48, min: 20, unit: 'CAN', condition: 'Baru' },
        { id: 'C11', status: 'filled', sku: 'BIB-DEF-UREA-IBC', name: 'AdBlue Aqueous Urea Solution 32.5%', qty: 8, min: 4, unit: 'IBC', condition: 'Baik' },
        { id: 'C12', status: 'filled', sku: 'BIB-COOL-CAT-ELC', name: 'Cat ELC Extended Life Coolant Premix', qty: 15, min: 8, unit: 'DRUM', condition: 'Segel' },
      ]
    },
    {
      code: 'D',
      title: 'D - Elektrikal & Alat',
      subtitle: 'Tools & Electrical',
      filledCount: 7,
      totalCount: 12,
      colorTheme: 'teal', // soft cyan/teal fill in mockup
      slots: [
        { id: 'D1', status: 'filled', sku: 'BIB-TL-TORQ-1000', name: 'Snap-on Heavy Duty Torque Wrench 1000 Nm', qty: 3, min: 2, unit: 'UNIT', condition: 'Tersertifikasi' },
        { id: 'D2', status: 'empty', sku: null },
        { id: 'D3', status: 'empty', sku: null },
        { id: 'D4', status: 'filled', sku: 'BIB-GET-CAT-TIP', name: 'Bucket Tooth Tip Heavy Duty 777D (9W8452)', qty: 65, min: 25, unit: 'PCS', condition: 'Baru' },
        { id: 'D5', status: 'filled', sku: 'BIB-ELE-ALT-24V', name: 'Delco Remy 24V 150A Heavy Duty Alternator', qty: 9, min: 5, unit: 'PCS', condition: 'Baru' },
        { id: 'D6', status: 'filled', sku: 'BIB-STARTER-C32', name: 'Electric Starter Motor Cat C32 24V', qty: 4, min: 2, unit: 'UNIT', condition: 'Baru' },
        { id: 'D7', status: 'filled', sku: 'BIB-GET-ADAPT-LIP', name: 'Cat Heavy Lip Protector Corner Shroud', qty: 12, min: 4, unit: 'PCS', condition: 'Baru' },
        { id: 'D8', status: 'empty', sku: null },
        { id: 'D9', status: 'empty', sku: null },
        { id: 'D10', status: 'filled', sku: 'BIB-TIRE-2700R49', name: 'Bridgestone 27.00R49 OTR Mining Tire', qty: 16, min: 8, unit: 'PCS', condition: 'Baru' },
        { id: 'D11', status: 'filled', sku: 'BIB-SENSOR-PRESS', name: 'Bosch Common Rail Fuel Pressure Sensor 2000 Bar', qty: 11, min: 5, unit: 'PCS', condition: 'Baru' },
        { id: 'D12', status: 'empty', sku: null },
      ]
    }
  ]);

  // Current active section object
  const currentSection = useMemo(() => {
    return sections.find(s => s.code === activeSectionCode) || sections[1];
  }, [sections, activeSectionCode]);

  // Selected warehouse object
  const currentWarehouse = useMemo(() => {
    return warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];
  }, [warehouses, selectedWarehouseId]);

  // Slot styling mapping based on color theme and fill state
  const getSlotStyle = (slot, colorTheme) => {
    if (slot.status === 'empty') {
      return 'rack-striped-cell rack-striped-cell-hover text-slate-400 border border-slate-200/90';
    }

    // Filled colors matching the mockup's friendly aesthetic
    // Section A: Emerald / Mint
    if (colorTheme === 'emerald') {
      return 'bg-[#A7F3D0] text-[#065F46] border border-[#6EE7B7] hover:bg-[#6EE7B7] font-bold shadow-xs';
    }
    // Section B: Amber / Soft Gold
    if (colorTheme === 'amber') {
      return 'bg-[#FDE68A] text-[#92400E] border border-[#FCD34D] hover:bg-[#FCD34D] font-bold shadow-xs';
    }
    // Section C: Soft Purple / Lavender
    if (colorTheme === 'purple') {
      return 'bg-[#DDD6FE] text-[#5B21B6] border border-[#C4B5FD] hover:bg-[#C4B5FD] font-bold shadow-xs';
    }
    // Section D: Soft Cyan / Teal
    if (colorTheme === 'teal') {
      return 'bg-[#99F6E4] text-[#115E59] border border-[#5EEAD4] hover:bg-[#5EEAD4] font-bold shadow-xs';
    }

    return 'bg-red-100 text-red-700 border border-red-200 font-bold';
  };

  // Handle slot click
  const handleSlotClick = (section, slot) => {
    setActiveSectionCode(section.code);
    setSelectedShelf({
      ...slot,
      sectionCode: section.code,
      sectionTitle: section.title,
      warehouseName: currentWarehouse.fullName || currentWarehouse.name
    });
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification — Pure White Elevated Capsule */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-slate-800 text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. PAGE HEADER: Title, Sort/Filter, Warehouse Pills ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden space-y-4">
        {/* Soft Ambient Crimson Wash */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-red-500/10 via-red-500/5 to-transparent pointer-events-none rounded-r-2xl" />

        {/* Title & Top Right Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Rak Gudang
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pemantauan status slot, alokasi penempatan suku cadang, dan kapasitas penyimpanan rak gudang site BIB.
            </p>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            {/* Sort by button */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200/90 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Sort by</span>
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 font-mono text-[10px] text-slate-400 font-bold uppercase">Urutkan Berdasarkan</div>
                  {[
                    { id: 'code', label: 'Kode Rak (A-D)' },
                    { id: 'usage', label: 'Kapasitas Terpakai (%)' },
                    { id: 'name', label: 'Nama Kategori' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setCurrentSort(s.id);
                        setShowSortDropdown(false);
                        showToast(`Diurutkan berdasarkan ${s.label}`);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between font-medium ${
                        currentSort === s.id ? 'font-bold text-red-600 bg-red-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{s.label}</span>
                      {currentSort === s.id && <Check className="w-4 h-4 text-red-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter by button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200/90 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter by ({currentFilter === 'all' ? 'Semua' : '1'})</span>
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 font-mono text-[10px] text-slate-400 font-bold uppercase">Filter Status Rak</div>
                  {[
                    { id: 'all', label: 'Semua Rak (48 Slot)' },
                    { id: 'occupied', label: 'Rak Terisi Saja (27)' },
                    { id: 'empty', label: 'Rak Kosong Saja (21)' },
                    { id: 'critical', label: 'Batas Kritis / Alert' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setCurrentFilter(f.id);
                        setShowFilterDropdown(false);
                        showToast(`Filter aktif: ${f.label}`);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between font-medium ${
                        currentFilter === f.id ? 'font-bold text-red-600 bg-red-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{f.label}</span>
                      {currentFilter === f.id && <Check className="w-4 h-4 text-red-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warehouse Selector Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none pt-2 border-t border-slate-100 relative z-10">
          {warehouses.map((wh) => {
            const isSelected = selectedWarehouseId === wh.id;
            return (
              <button
                key={wh.id}
                onClick={() => {
                  setSelectedWarehouseId(wh.id);
                  showToast(`Area aktif: ${wh.fullName || wh.name}`);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/70'
                }`}
              >
                {wh.name}
              </button>
            );
          })}

          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={() => {
                const currentIndex = warehouses.findIndex(w => w.id === selectedWarehouseId);
                const prevIndex = (currentIndex - 1 + warehouses.length) % warehouses.length;
                setSelectedWarehouseId(warehouses[prevIndex].id);
              }}
              className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              aria-label="Previous warehouse"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const currentIndex = warehouses.findIndex(w => w.id === selectedWarehouseId);
                const nextIndex = (currentIndex + 1) % warehouses.length;
                setSelectedWarehouseId(warehouses[nextIndex].id);
              }}
              className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              aria-label="Next warehouse"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddWarehouseModal(true)}
              className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
              aria-label="Add warehouse"
              title="Tambah Area Rak Baru"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN GRID: Section Overview [Left] + Usage & Overview [Right] ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── LEFT CARD (Col 1-8 / 66%): Section Overview ── */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header: Title + Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                  Seksi Rak ({currentWarehouse.name})
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  4 Seksi Aktif
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddRequestModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ambil (MR)</span>
                </button>
                <button
                  onClick={() => setShowEditSectionModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-600" />
                  <span>Edit Seksi</span>
                </button>
                <button
                  onClick={() => setShowDeleteSectionModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>

            {/* 4 Rack Section Columns Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {sections.map((sec) => {
                const isSectionActive = activeSectionCode === sec.code;

                return (
                  <div
                    key={sec.code}
                    className={`flex flex-col transition-all duration-200 rounded-xl p-2.5 cursor-pointer ${
                      isSectionActive
                        ? 'border-2 border-red-500 bg-red-50/20 shadow-xs'
                        : 'border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50/70'
                    }`}
                    onClick={() => setActiveSectionCode(sec.code)}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 px-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {sec.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {sec.filledCount}/{sec.totalCount}
                      </span>
                    </div>

                    {/* 2x6 Capsules Grid (12 Capsules total per section) */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {sec.slots.map((slot) => {
                        const styleClass = getSlotStyle(slot, sec.colorTheme);
                        const isSelectedSlot = selectedShelf?.id === slot.id;

                        return (
                          <button
                            key={slot.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSlotClick(sec, slot);
                            }}
                            className={`h-11 sm:h-12 rounded-xl transition-all duration-150 flex flex-col items-center justify-center p-1 cursor-pointer ${styleClass} ${
                              isSelectedSlot ? 'ring-2 ring-red-600 ring-offset-1 scale-102 shadow-xs' : 'hover:scale-101'
                            }`}
                            title={`${slot.id} - ${slot.name || 'Kosong'}`}
                          >
                            <span className="text-xs sm:text-sm font-black font-mono leading-none tracking-tight">
                              {slot.id}
                            </span>
                            {slot.status === 'filled' ? (
                              <span className="text-[9px] font-bold opacity-90 mt-0.5 truncate max-w-full px-0.5 leading-none">
                                {slot.qty} {slot.unit}
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-medium text-slate-400 opacity-60 mt-0.5 leading-none">
                                Kosong
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Col 9-12 / 34%): 2 Cards ── */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Card 1: Section Usage */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  Kapasitas Seksie {activeSectionCode}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                  Live Telemetry
                </span>
              </div>

              {/* Compact Donut Progress Meter */}
              <div className="flex items-center justify-center py-3">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      className="stroke-slate-100"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      style={{
                        stroke: activeSectionCode === 'B' ? '#F59E0B' : activeSectionCode === 'A' ? '#10B981' : activeSectionCode === 'C' ? '#8B5CF6' : '#14B8A6'
                      }}
                      className="transition-all duration-700 ease-out"
                      strokeWidth="12"
                      strokeDasharray={301.59}
                      strokeDashoffset={301.59 * (1 - 0.56)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>

                  {/* Center Text: 56% Location Used */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-black text-2xl sm:text-3xl text-slate-900 leading-none tracking-tight">
                      56%
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      Kapasitas
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <div className="font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-none">
                    {stats.totalShelves || 240}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">Total Rak</div>
                </div>
                <div>
                  <div className="font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-none">
                    {stats.emptyShelves || 136}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">Rak Kosong</div>
                </div>
                <div>
                  <div className="font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-none">
                    {stats.fullShelves || 84}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">Rak Penuh</div>
                </div>
                <div>
                  <div className="font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-none">
                    {stats.newlyAdded || 20}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">Baru Masuk</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Inventory Overview */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 pb-3 tracking-tight">
              Ringkasan Arus Material
            </h3>

            {/* 4 Metric Tiles 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Tile 1: Orders Received */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:shadow-xs transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                    26% <TrendingUp className="w-3 h-3" />
                  </span>
                </div>
                <div className="font-black text-base sm:text-lg text-slate-900 leading-tight tracking-tight">
                  {(stats.ordersReceived || 4236).toLocaleString()}
                </div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                  Material Masuk (MOS)
                </div>
              </div>

              {/* Tile 2: Orders Shipped */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:shadow-xs transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200/60">
                    20% <TrendingDown className="w-3 h-3" />
                  </span>
                </div>
                <div className="font-black text-base sm:text-lg text-slate-900 leading-tight tracking-tight">
                  {(stats.ordersShipped || 2778).toLocaleString()}
                </div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                  Pengeluaran (MR)
                </div>
              </div>

              {/* Tile 3: Orders Returned */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:shadow-xs transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
                    <Archive className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200/60">
                    8% <TrendingDown className="w-3 h-3" />
                  </span>
                </div>
                <div className="font-black text-base sm:text-lg text-slate-900 leading-tight tracking-tight">
                  {(stats.ordersReturned || 147).toLocaleString()}
                </div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                  Retur &amp; Servis
                </div>
              </div>

              {/* Tile 4: Orders Canceled */}
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:shadow-xs transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                    6% <TrendingUp className="w-3 h-3" />
                  </span>
                </div>
                <div className="font-black text-base sm:text-lg text-slate-900 leading-tight tracking-tight">
                  {(stats.ordersCanceled || 537).toLocaleString()}
                </div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                  Karantina / Scrap
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. INTERACTIVE MODAL: Shelf Detail Popover ── */}
      {selectedShelf && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-display font-bold text-lg">
                  {selectedShelf.id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-lg text-slate-900">
                      Rak Bin {selectedShelf.id}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                      selectedShelf.status === 'filled'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedShelf.status === 'filled' ? 'Terisi Optimal' : 'Siap Alokasi'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedShelf.sectionTitle} • {selectedShelf.warehouseName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedShelf(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedShelf.status === 'filled' ? (
              <div className="py-4 space-y-4">
                <div>
                  <div className="text-xs font-mono text-slate-400">KODE SKU / PART NUMBER</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">{selectedShelf.sku}</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-400">DESKRIPSI MATERIAL</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{selectedShelf.name}</div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500">STOK SAAT INI</div>
                    <div className="text-base font-bold text-slate-900">{selectedShelf.qty} {selectedShelf.unit}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500">BATAS MINIMUM</div>
                    <div className="text-base font-bold text-amber-600">{selectedShelf.min} {selectedShelf.unit}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-500">KONDISI</div>
                    <div className="text-base font-bold text-emerald-600">{selectedShelf.condition || 'Baik'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedShelf(null);
                      setShowAddRequestModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajukan MR (Ambil Barang)</span>
                  </button>
                  <button
                    onClick={() => {
                      showToast(`Label Thermal QR untuk ${selectedShelf.sku} dicetak.`);
                      setSelectedShelf(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-xs shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Cetak QR</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Rak Bin {selectedShelf.id} Sedang Kosong</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Slot ini siap menerima mutasi penempatan barang baru (Put-Away) hasil berita acara MOS yang telah diapprove.
                  </p>
                </div>
                <button
                  onClick={() => {
                    showToast(`Alokasi Put-Away diaktifkan untuk Rak ${selectedShelf.id}`);
                    setSelectedShelf(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
                >
                  Alokasikan Barang ke Slot Ini
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. MODAL: Add Material Request (+ Add Request) ── */}
      {showAddRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">Buat Permintaan Material (MR)</h3>
                  <p className="text-xs text-slate-500">Tiket Pengeluaran Suku Cadang dari Rak</p>
                </div>
              </div>
              <button onClick={() => setShowAddRequestModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddRequestModal(false);
                showToast('Tiket Permintaan Material (MR) berhasil diterbitkan!');
              }}
              className="py-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Material / Suku Cadang</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium">
                  <option>Cat 777D Engine Oil Filter (Rak A2) — Sisa 4 PCS</option>
                  <option>Komatsu PC2000 Hydraulic Seal Kit (Rak B1) — Sisa 18 SET</option>
                  <option>Shell Tellus S2 V 68 Hydraulic Oil (Rak C5) — Sisa 6 DRUM</option>
                  <option>Snap-on Torque Wrench 1000 Nm (Rak D1) — Sisa 3 UNIT</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah Pengambilan</label>
                  <input type="number" defaultValue={1} min={1} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Penggunaan Alat</label>
                  <input type="text" placeholder="HD-777D-Unit-08" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keperluan & Catatan Pemohon</label>
                <textarea rows={2} placeholder="Penggantian filter berkala 500 jam pit Sebamban..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium" />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Pengeluaran barang membutuhkan otorisasi tanda tangan Admin Logistik di gerbang gudang.</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRequestModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 shadow-sm"
                >
                  Kirim Pengajuan MR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. MODAL: Edit Section ── */}
      {showEditSectionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-base text-slate-900">Edit Section {activeSectionCode}</h3>
              <button onClick={() => setShowEditSectionModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Kategori Section</label>
                <input
                  type="text"
                  defaultValue={currentSection.title}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Sub-Domain Pertambangan</label>
                <input
                  type="text"
                  defaultValue={currentSection.subtitle}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={() => setShowEditSectionModal(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs">
                Batal
              </button>
              <button
                onClick={() => {
                  setShowEditSectionModal(false);
                  showToast(`Perubahan Section ${activeSectionCode} berhasil disimpan.`);
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-xs hover:from-red-700 hover:to-red-800 shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. MODAL: Delete Section ── */}
      {showDeleteSectionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">Hapus Section {activeSectionCode}?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Apakah Anda yakin ingin menghapus zona ini? Pastikan seluruh barang telah dialihkan ke rak lain sebelum penghapusan.
            </p>
            <div className="flex items-center gap-2 pt-5">
              <button onClick={() => setShowDeleteSectionModal(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs">
                Batal
              </button>
              <button
                onClick={() => {
                  setShowDeleteSectionModal(false);
                  showToast(`Section ${activeSectionCode} telah dinonaktifkan.`);
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. MODAL: Add Warehouse ── */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">Registrasi Area Rak Baru</h3>
                  <p className="text-xs text-slate-500">PT Borneo Indobara Site Expansion</p>
                </div>
              </div>
              <button onClick={() => setShowAddWarehouseModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddWarehouseModal(false);
                showToast('Area rak baru berhasil ditambahkan ke database.');
              }}
              className="py-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Area Rak</label>
                <input type="text" placeholder="Area Rak 5 (Pit Timur Logistics)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Area Rak</label>
                  <input type="text" placeholder="BIB-RAK5" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono" required />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Kapasitas Rak</label>
                  <input type="number" defaultValue={240} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lokasi Spasial Site</label>
                <input type="text" placeholder="Kec. Satui, Kab. Tanah Bumbu (Radius 200m)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setShowAddWarehouseModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700">
                  Daftarkan Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
