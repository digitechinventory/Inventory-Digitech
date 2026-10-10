import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Boxes,
  Cpu,
  Radio,
  Video,
  HardDrive,
  Compass,
  Tv,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  FileCheck2,
  Warehouse,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Hash,
  Clock,
  Calendar,
  Tag
} from 'lucide-react';
import {
  getFamousSummary,
  getFamousFleetMatrix,
  getFamousItems
} from '../../api/projectInventoryApi';

const SENSOR_ICONS = {
  gps: Compass,
  dsm: Eye,
  adas: ShieldCheck,
  mdvr: Video,
  ssd: HardDrive,
  obu: Tv,
  ptt: Radio,
  dome: Video,
  canbus: Cpu
};

const SENSOR_LABELS = {
  gps: 'GPS Tracker',
  dsm: 'DSM AI Camera',
  adas: 'ADAS Safety',
  mdvr: 'MDVR Recorder',
  ssd: 'SSD Storage',
  obu: 'OBU Display',
  ptt: 'PTT Radio',
  dome: 'Dome CCTV'
};

const MITRA_LIST = ['ALL', 'AEK', 'RBT', 'BMT', 'GECL', 'KMB', 'BBS', 'BKAE', 'MAV', 'MMS', 'RAM', 'STOCK'];

export default function FamousInteractiveDashboard() {
  // Main Navigation View: 'matrix' (Fleet 825 Truk) | 'hardware' (9,416 Perangkat) | 'rma' (Rusak & Retur)
  const [activeView, setActiveView] = useState('matrix');

  // Summary State
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Fleet Matrix State
  const [fleetUnits, setFleetUnits] = useState([]);
  const [fleetPagination, setFleetPagination] = useState({ page: 1, limit: 30, total: 0, total_pages: 1 });
  const [fleetSearch, setFleetSearch] = useState('');
  const [fleetMitra, setFleetMitra] = useState('ALL');
  const [fleetHealth, setFleetHealth] = useState('ALL');
  const [loadingFleet, setLoadingFleet] = useState(false);

  // Hardware Items State
  const [hardwareItems, setHardwareItems] = useState([]);
  const [hardwarePagination, setHardwarePagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 1 });
  const [hardwareSearch, setHardwareSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMitra, setSelectedMitra] = useState('ALL');
  const [loadingItems, setLoadingItems] = useState(false);

  // Selected Unit detail modal
  const [selectedUnitDetail, setSelectedUnitDetail] = useState(null);

  // 1. Fetch Summary
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await getFamousSummary();
      setSummary(res);
    } catch (err) {
      console.error('Error fetching FAMOUS summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // 2. Fetch Fleet Matrix
  const fetchFleet = async (page = 1) => {
    try {
      setLoadingFleet(true);
      const res = await getFamousFleetMatrix({
        page,
        limit: fleetPagination.limit,
        search: fleetSearch,
        mitra: fleetMitra,
        health: fleetHealth
      });
      setFleetUnits(res.units || []);
      setFleetPagination(res.pagination || { page: 1, limit: 30, total: 0, total_pages: 1 });
    } catch (err) {
      console.error('Error fetching Fleet Matrix:', err);
    } finally {
      setLoadingFleet(false);
    }
  };

  useEffect(() => {
    if (activeView === 'matrix') {
      fetchFleet(1);
    }
  }, [fleetMitra, fleetHealth, activeView]);

  // Debounced Fleet Search
  useEffect(() => {
    if (activeView !== 'matrix') return;
    const timer = setTimeout(() => {
      fetchFleet(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [fleetSearch]);

  // 3. Fetch Hardware Items
  const fetchItems = async (page = 1) => {
    try {
      setLoadingItems(true);
      const statusParam = activeView === 'rma' ? 'rma' : selectedStatus;
      const res = await getFamousItems({
        page,
        limit: hardwarePagination.limit,
        search: hardwareSearch,
        category: selectedCategory,
        status: statusParam,
        mitra: selectedMitra
      });

      setHardwareItems(res.items || []);
      setHardwarePagination(res.pagination || { page: 1, limit: 50, total: 0, total_pages: 1 });
    } catch (err) {
      console.error('Error fetching FAMOUS items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (activeView === 'hardware' || activeView === 'rma') {
      fetchItems(1);
    }
  }, [selectedCategory, selectedStatus, selectedMitra, activeView]);

  // Debounced Hardware Search
  useEffect(() => {
    if (activeView !== 'hardware' && activeView !== 'rma') return;
    const timer = setTimeout(() => {
      fetchItems(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [hardwareSearch]);

  // Sensor Category metadata list
  const categoryStatsList = useMemo(() => {
    if (!summary?.by_category) return [];
    const specs = [
      { key: 'GPS', name: 'GPS Tracker', icon: Compass, total: summary.by_category['GPS'] || 1155, installed: 818, stock: 220, repair: 107 },
      { key: 'DSM', name: 'DSM AI Fatigue Camera', icon: Eye, total: summary.by_category['DSM'] || 1275, installed: 816, stock: 203, repair: 256 },
      { key: 'ADAS', name: 'ADAS Safety Camera', icon: ShieldCheck, total: summary.by_category['ADAS'] || 1175, installed: 818, stock: 293, repair: 64 },
      { key: 'MDVR', name: 'MDVR Video Box', icon: Video, total: summary.by_category['MDVR'] || 1175, installed: 818, stock: 233, repair: 124 },
      { key: 'SSD', name: 'SSD Storage Drive', icon: HardDrive, total: summary.by_category['SSD'] || 1175, installed: 818, stock: 327, repair: 30 },
      { key: 'OBU', name: 'OBU Cabin Display', icon: Tv, total: summary.by_category['OBU'] || 1145, installed: 816, stock: 245, repair: 84 },
      { key: 'PTT', name: 'PTT Radio Comm', icon: Radio, total: summary.by_category['PTT'] || 1191, installed: 804, stock: 257, repair: 130 },
      { key: 'DOME', name: 'Dome CCTV Security', icon: Video, total: summary.by_category['DOME'] || 1020, installed: 818, stock: 143, repair: 59 },
      { key: 'CANBUS', name: 'CAN-Bus Telemetry', icon: Cpu, total: summary.by_category['CANBUS'] || 105, installed: 5, stock: 100, repair: 0 }
    ];
    return specs;
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* ── Top Executive KPI Highlights (Real FAMOUS Data) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Hardware Items */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-red-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Total Hardware Real</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {summary?.total_items ? Number(summary.total_items).toLocaleString('id-ID') : '9.416'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            9 Kategori Sensor &amp; Gateway
          </div>
        </div>

        {/* Total Armada Truk Terpasang */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Armada Hauling Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">
            {summary?.fleet_summary?.total_units ? Number(summary.fleet_summary.total_units).toLocaleString('id-ID') : '825'}
          </div>
          <div className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {summary?.fleet_summary?.optimal_units || 795} Unit Lengkap (8/8)
          </div>
        </div>

        {/* Buffer Stok Onsite Gudang */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Buffer Stock Gudang</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {summary?.by_status?.['Onsite'] ? Number(summary.by_status['Onsite']).toLocaleString('id-ID') : '2.028'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Siap pasang / penggantian cepat di site
          </div>
        </div>

        {/* Butuh Perbaikan & Retur (RMA) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Rusak &amp; Retur (RMA)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
            {((summary?.by_status?.['Rusak'] || 646) + (summary?.by_status?.['Return'] || 193)).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" />
            Klaim Garansi &amp; Penggantian
          </div>
        </div>
      </div>

      {/* ── Interactive Category Buffer Stock Radar (9 Komponen) ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-600" />
              Radar Status 9 Kategori Hardware Telematika FAMOUS
            </h3>
            <p className="text-xs text-slate-500">Klik kartu untuk menyaring data inventaris sesuai komponen perangkat keras</p>
          </div>
          {selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 px-3 py-1 bg-red-50 rounded-xl border border-red-200 cursor-pointer"
            >
              Reset Filter Kategori ({selectedCategory})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
          {categoryStatsList.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.key;
            const pctInstalled = Math.round((cat.installed / cat.total) * 100);

            return (
              <div
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(isSelected ? 'ALL' : cat.key);
                  if (activeView === 'matrix') {
                    setActiveView('hardware');
                  }
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer select-none text-left ${
                  isSelected
                    ? 'bg-red-50/90 border-red-500 ring-2 ring-red-500/20 shadow-md'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-red-600 text-white' : 'bg-white text-slate-700 shadow-2xs'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {pctInstalled}%
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate">{cat.key}</div>
                <div className="text-[10px] text-slate-500 truncate">{cat.name}</div>
                <div className="mt-2 text-sm font-black text-slate-800">{cat.total.toLocaleString('id-ID')} <span className="text-[9px] font-normal text-slate-400">unit</span></div>
                
                {/* Mini progress ratio */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5 flex">
                  <div style={{ width: `${pctInstalled}%` }} className="bg-emerald-500 h-full" title={`Terinstall: ${cat.installed}`} />
                  <div style={{ width: `${100 - pctInstalled}%` }} className="bg-amber-400 h-full" title={`Stock & Repair: ${cat.total - cat.installed}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── View Switcher Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveView('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'matrix'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Peta Status Armada Truk (825 Unit)</span>
          </button>

          <button
            onClick={() => setActiveView('hardware')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'hardware'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-red-600" />
            <span>Master Hardware Real (9.416 Item)</span>
          </button>

          <button
            onClick={() => setActiveView('rma')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'rma'
                ? 'bg-white text-rose-700 shadow-sm border border-rose-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Unit Rusak &amp; Retur Garansi ({((summary?.by_status?.['Rusak'] || 646) + (summary?.by_status?.['Return'] || 193)).toLocaleString('id-ID')})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Project Workspace: <span className="font-bold text-red-600">FAMOUS (Fleet Telematics)</span>
        </div>
      </div>

      {/* ── VIEW 1: FLEET TELEMATICS MATRIX (825 TRUK) ── */}
      {activeView === 'matrix' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Controls & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search Lambung */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  placeholder="Cari No. Lambung (cth: RBT 4210, AEK 0167)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition"
                />
                {fleetSearch && (
                  <button onClick={() => setFleetSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>
                )}
              </div>

              {/* Mitra Filter */}
              <select
                value={fleetMitra}
                onChange={(e) => setFleetMitra(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Semua Mitra Hauling</option>
                {MITRA_LIST.filter(m => m !== 'ALL').map(m => (
                  <option key={m} value={m}>Mitra {m}</option>
                ))}
              </select>

              {/* Health Filter */}
              <select
                value={fleetHealth}
                onChange={(e) => setFleetHealth(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Semua Status Sehat</option>
                <option value="Optimal">Optimal (8/8 Lengkap)</option>
                <option value="Siap Operasi">Siap Operasi (6-7 Sensor)</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan (Sensor Rusak)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{fleetUnits.length}</span> dari <span className="font-bold text-slate-800">{fleetPagination.total}</span> unit armada
            </div>
          </div>

          {/* Fleet Units Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="px-4 py-3">No. Lambung Unit</th>
                  <th className="px-4 py-3">Mitra Kontraktor</th>
                  <th className="px-4 py-3 text-center">Kelengkapan Sensor (8 Komponen)</th>
                  <th className="px-4 py-3 text-center">Status Kesehatan</th>
                  <th className="px-4 py-3">No. BASTM Referensi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingFleet ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-red-600" />
                      Memuat data armada telematika...
                    </td>
                  </tr>
                ) : fleetUnits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      Tidak ditemukan armada unit hauling dengan filter tersebut.
                    </td>
                  </tr>
                ) : (
                  fleetUnits.map((unit) => {
                    const isOptimal = unit.compliance_pct === 100;
                    const hasDamage = unit.damaged_count > 0;

                    return (
                      <tr key={unit.unit_number} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-black text-slate-900 font-mono text-sm">{unit.unit_number}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Haul Truck Hauling</div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-[11px] border border-slate-200">
                            {unit.mitra}
                          </span>
                        </td>

                        {/* 8 Sensor Badges */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-sm mx-auto">
                            {Object.entries(unit.sensors).map(([key, sInfo]) => {
                              const isInstalled = sInfo.status === 'Terinstall';
                              const isRusak = sInfo.status && sInfo.status.toLowerCase().includes('rusak');
                              
                              let badgeCls = 'bg-slate-100 text-slate-400 border-slate-200';
                              if (isInstalled) badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
                              else if (isRusak) badgeCls = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';

                              return (
                                <span
                                  key={key}
                                  title={`${SENSOR_LABELS[key] || key}: ${sInfo.status || 'Belum Pasang'} ${sInfo.serial ? '(SN: ' + sInfo.serial + ')' : ''}`}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${badgeCls} cursor-help`}
                                >
                                  {key.toUpperCase()}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Health Status */}
                        <td className="px-4 py-3 text-center">
                          {isOptimal ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Optimal (8/8)
                            </span>
                          ) : hasDamage ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Perbaikan ({unit.installed_count}/8)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Parsial ({unit.installed_count}/8)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                          {unit.bastm_number || '-'}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedUnitDetail(unit)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-red-600 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Detail Sensor
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Fleet Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono">
              Halaman {fleetPagination.page} dari {fleetPagination.total_pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={fleetPagination.page <= 1 || loadingFleet}
                onClick={() => fetchFleet(fleetPagination.page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Sebelumnya
              </button>
              <button
                disabled={fleetPagination.page >= fleetPagination.total_pages || loadingFleet}
                onClick={() => fetchFleet(fleetPagination.page + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                Berikutnya <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 2 & 3: HARDWARE INVENTORY (9,416 ITEMS) & RMA ── */}
      {(activeView === 'hardware' || activeView === 'rma') && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Controls & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search Serial / IMEI / Lambung */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={hardwareSearch}
                  onChange={(e) => setHardwareSearch(e.target.value)}
                  placeholder="Cari Serial Number, IMEI, Unit, BASTM..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition"
                />
                {hardwareSearch && (
                  <button onClick={() => setHardwareSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Semua Kategori Sensor</option>
                {categoryStatsList.map(c => (
                  <option key={c.key} value={c.key}>{c.key} - {c.name}</option>
                ))}
              </select>

              {/* Status Filter (hidden in RMA view) */}
              {activeView !== 'rma' && (
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Terinstall">Terinstall di Truk</option>
                  <option value="Onsite">Onsite (Stok Gudang)</option>
                  <option value="Rusak">Rusak / Repair</option>
                  <option value="Return">Return ke Vendor</option>
                </select>
              )}

              {/* Mitra Filter */}
              <select
                value={selectedMitra}
                onChange={(e) => setSelectedMitra(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Semua Mitra / Stock</option>
                {MITRA_LIST.filter(m => m !== 'ALL').map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Ditemukan <span className="font-bold text-slate-800">{hardwarePagination.total.toLocaleString('id-ID')}</span> item hardware
            </div>
          </div>

          {/* Hardware Items Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="px-4 py-3">ID &amp; Serial Number</th>
                  <th className="px-4 py-3">Kategori &amp; Komponen</th>
                  <th className="px-4 py-3">Status &amp; Posisi</th>
                  <th className="px-4 py-3">Mitra / Lokasi</th>
                  <th className="px-4 py-3">No. BASTM &amp; Tanggal</th>
                  <th className="px-4 py-3">Catatan Riwayat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingItems ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-red-600" />
                      Memuat daftar inventaris perangkat keras...
                    </td>
                  </tr>
                ) : hardwareItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      Tidak ditemukan perangkat keras dengan filter pencarian tersebut.
                    </td>
                  </tr>
                ) : (
                  hardwareItems.map((item) => {
                    const isInstalled = item.status === 'Terinstall';
                    const isRusak = item.status && item.status.toLowerCase().includes('rusak');
                    const isReturn = item.status && item.status.toLowerCase().includes('return');

                    let statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                        {item.status}
                      </span>
                    );
                    if (isInstalled) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terinstall
                        </span>
                      );
                    } else if (isRusak) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Rusak
                        </span>
                      );
                    } else if (isReturn) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          Return
                        </span>
                      );
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-slate-900 text-xs">{item.serial_number}</div>
                          {item.imei && (
                            <div className="text-[10px] font-mono text-slate-400">IMEI: {item.imei}</div>
                          )}
                          <div className="text-[9px] font-mono text-slate-400">{item.id}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 font-mono font-bold text-[10px] border border-red-200 mb-0.5">
                            {item.category}
                          </span>
                          <div className="text-xs text-slate-700 font-medium truncate max-w-[200px]">{item.category_name}</div>
                        </td>

                        <td className="px-4 py-3">
                          {statusBadge}
                          {item.unit_number && (
                            <div className="mt-1 font-mono font-bold text-slate-800 text-[11px] flex items-center gap-1">
                              <Truck className="w-3 h-3 text-blue-600" /> {item.unit_number}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-slate-700">{item.mitra}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.unit_number ? 'Pit Hauling BIB' : 'Gudang Elektronika FAMOUS'}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                          <div>{item.bastm_number || '-'}</div>
                          {item.onsite_date && (
                            <div className="text-[10px] text-slate-400">Onsite: {item.onsite_date}</div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate">
                          {item.previous_notes || item.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Hardware Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono">
              Halaman {hardwarePagination.page} dari {hardwarePagination.total_pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={hardwarePagination.page <= 1 || loadingItems}
                onClick={() => fetchItems(hardwarePagination.page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Sebelumnya
              </button>
              <button
                disabled={hardwarePagination.page >= hardwarePagination.total_pages || loadingItems}
                onClick={() => fetchItems(hardwarePagination.page + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                Berikutnya <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Detail Sensor Truk ── */}
      {selectedUnitDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 font-mono">{selectedUnitDetail.unit_number}</h4>
                  <p className="text-xs text-slate-500 font-medium">Mitra Hauling: <span className="font-bold text-slate-800">{selectedUnitDetail.mitra}</span></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUnitDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              <div className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Status 8 Sensor Telematika:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(selectedUnitDetail.sensors).map(([k, s]) => {
                  const isInstalled = s.status === 'Terinstall';
                  const isRusak = s.status && s.status.toLowerCase().includes('rusak');
                  const Icon = SENSOR_ICONS[k] || Cpu;

                  return (
                    <div key={k} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isInstalled ? 'bg-emerald-100 text-emerald-700' : (isRusak ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600')
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="font-bold text-xs text-slate-900">{SENSOR_LABELS[k] || k.toUpperCase()}</div>
                        <div className="text-[11px] font-mono text-slate-600 truncate">{s.serial ? `SN: ${s.serial}` : 'Belum Terpasang'}</div>
                        <span className={`inline-block mt-1 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isInstalled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (isRusak ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-500')
                        }`}>
                          {s.status || 'Belum Pasang'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">BASTM: {selectedUnitDetail.bastm_number || '-'}</span>
              <button
                onClick={() => setSelectedUnitDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
