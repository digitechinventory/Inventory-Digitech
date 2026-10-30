import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  PackageCheck,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  PenLine,
  ChevronRight,
  Sparkles,
  Search,
  ScanLine,
  Truck,
  Scale,
  Cpu,
  ShieldCheck,
  ArrowRightLeft,
  Warehouse,
  Bell
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import ParallelogramCard from '../common/ParallelogramCard';
import ProjectWorkspacesBanner from './ProjectWorkspacesBanner';
import InventoryScannerModal from '../common/InventoryScannerModal';

export default function MobileHomeDashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const normalizedRole = role || 'User';

  const [loading, setLoading] = useState(true);
  const [mosQueue, setMosQueue] = useState([]);
  const [overdueTools, setOverdueTools] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [selectedZone, setSelectedZone] = useState('Zona A');
  const [projectTab, setProjectTab] = useState('ALL');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const firstName = user?.full_name?.split(' ')[0] || (normalizedRole === 'Superadmin' ? 'Superadmin' : 'Arya');

  // Fetch live metrics matching AdminDashboard
  const fetchData = async () => {
    try {
      setLoading(true);
      const [mosRes, toolsRes, invRes] = await Promise.all([
        api.get('/mos').catch(() => ({ data: { data: [] } })),
        api.get('/tools/loans').catch(() => ({ data: { data: [] } })),
        api.get('/inventory').catch(() => ({ data: { data: [] } }))
      ]);

      const allDocs = mosRes.data?.data || [];
      const queue = allDocs.filter(d => d && (d.status === 'waiting_admin' || d.status === 'draft'));
      setMosQueue(queue);

      const allTools = toolsRes.data?.data || [];
      const overdue = allTools.filter(t => t && t.status === 'overdue');
      setOverdueTools(overdue);

      const allItems = invRes.data?.data || [];
      const low = allItems.filter(i => (i.quantity || 0) <= (i.min_stock || 10));
      setLowStockItems(low);
    } catch (err) {
      console.error('Error fetching mobile dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingInspectionCount = mosQueue.filter(d => d.status === 'waiting_admin').length || 1;
  const activePickingCount = 4;
  const lowStockCount = lowStockItems.length || 28;
  const overdueCount = overdueTools.length || 2;

  // 2D Rack Map Data matching Desktop
  const ZONES = {
    'Zona A': [
      { id: 'R-A01', item: 'Cat 777D Oil Filter', stock: 4, cap: 20, pct: 20, color: 'bg-red-500' },
      { id: 'R-A02', item: 'Komatsu Seal Kit', stock: 18, cap: 20, pct: 90, color: 'bg-emerald-600' },
      { id: 'R-A03', item: 'Hydraulic Spool', stock: 12, cap: 20, pct: 60, color: 'bg-amber-500' },
      { id: 'R-A04', item: 'Kosong (Siap)', stock: 0, cap: 20, pct: 0, color: 'bg-slate-300' },
    ],
    'Zona B': [
      { id: 'R-B01', item: 'Volvo Brake Lining', stock: 32, cap: 40, pct: 80, color: 'bg-emerald-600' },
      { id: 'R-B02', item: 'Brake Disc HD', stock: 15, cap: 30, pct: 50, color: 'bg-amber-500' },
      { id: 'R-B03', item: 'Tooth Tip 777D', stock: 65, cap: 70, pct: 92, color: 'bg-emerald-600' },
      { id: 'R-B04', item: 'Kosong (Siap)', stock: 0, cap: 30, pct: 0, color: 'bg-slate-300' },
    ],
    'Zona C': [
      { id: 'R-C01', item: 'Tellus S2 V 68', stock: 6, cap: 25, pct: 24, color: 'bg-red-500' },
      { id: 'R-C02', item: 'Delvac 15W-40', stock: 18, cap: 25, pct: 72, color: 'bg-emerald-600' },
      { id: 'R-C03', item: 'Grease Cartridge', stock: 40, cap: 50, pct: 80, color: 'bg-emerald-600' },
      { id: 'R-C04', item: 'Kosong (Siap)', stock: 0, cap: 25, pct: 0, color: 'bg-slate-300' },
    ]
  };

  return (
    <div
      style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 16px), 52px)' }}
      className="space-y-4 px-3 sm:px-4 pb-32 animate-in fade-in duration-200 font-sans"
    >
      {/* ── Top Header Section (Kata Penyapa & Quick Action Buttons) ── */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              {getGreeting()},
            </span>
            <span className="text-[9.5px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
              {normalizedRole}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">
            Halo, <span className="text-red-600">{firstName}</span>
          </h1>
          <p className="text-[10.5px] font-medium text-slate-500 mt-0.5">
            Inventaris &amp; Kontrol Aset Site Tambang
          </p>
        </div>

        {/* Right Action Icons: Notification Bell & Barcode Scan */}
        <div className="flex items-center gap-2">
          {/* Barcode Scanner Button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 active:scale-95 transition-all cursor-pointer hover:border-red-300"
            title="Scan Barcode / QR Aset"
          >
            <ScanLine className="w-4.5 h-4.5 text-red-600" />
          </button>

          {/* Notification Bell with Red Badge Dot */}
          <button
            onClick={() => navigate('/mos')}
            className="relative w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 active:scale-95 transition-all cursor-pointer hover:border-red-300"
            title="Pemberitahuan & Approval"
          >
            <Bell className="w-4.5 h-4.5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
          </button>
        </div>
      </div>
      
      {/* ── 1. The Signature 4 Parallelogram Cards (2x2 Compact Grid matching Desktop Dashboard) ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <ParallelogramCard
          compact={true}
          title="MOS MENUNGGU"
          value={String(pendingInspectionCount).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Cek Fisik & TTD"
          subtitleIcon={FileCheck2}
          subtitleColor="text-amber-700"
          icon={FileCheck2}
          iconColor="text-amber-600"
          accentColor="border-amber-600"
          valueColor="text-amber-600"
          onClick={() => navigate('/mos')}
        />

        <ParallelogramCard
          compact={true}
          title="PICKING LIST"
          value={String(activePickingCount).padStart(2, '0')}
          unit="ORDER"
          subtitle="Sesuai MR"
          subtitleIcon={PackageCheck}
          subtitleColor="text-blue-700"
          icon={PackageCheck}
          iconColor="text-blue-600"
          accentColor="border-blue-600"
          valueColor="text-blue-600"
          onClick={() => navigate('/mr')}
        />

        <ParallelogramCard
          compact={true}
          title="KRITIS REORDER"
          value={String(lowStockCount).padStart(2, '0')}
          unit="PART"
          subtitle="Buffer Minimum"
          subtitleIcon={AlertTriangle}
          subtitleColor="text-red-700"
          icon={AlertTriangle}
          iconColor="text-red-600"
          accentColor="border-red-600"
          valueColor="text-red-600"
          onClick={() => navigate('/inventory?status=low_stock')}
        />

        <ParallelogramCard
          compact={true}
          title="TOOL DIPINJAM"
          value={String(overdueCount).padStart(2, '0')}
          unit="UNIT"
          subtitle="1 Tool Overdue"
          subtitleIcon={Clock}
          subtitleColor="text-purple-700"
          icon={Clock}
          iconColor="text-purple-600"
          accentColor="border-purple-600"
          valueColor="text-purple-600"
          onClick={() => navigate('/tools')}
        />
      </div>

      {/* ── 2. Project Workspaces Banner (WIM, FAMOUS, CCM scaled down for Mobile) ── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            WORKSPACE PROYEK OPERASIONAL
          </span>
          <button
            onClick={() => navigate('/project-inventory')}
            className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Semua Detail</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Project Switcher Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { id: 'ALL', label: 'Semua (3)' },
            { id: 'WIM', label: 'WIM Scale' },
            { id: 'FAMOUS', label: 'FAMOUS Fleet' },
            { id: 'CCM', label: 'CCM Crusher' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setProjectTab(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer ${
                projectTab === tab.id
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Compact Industrial Project Cards */}
        <ProjectWorkspacesBanner compact={true} activeFilter={projectTab} userRole={normalizedRole} />

        {/* Project FAMOUS 9 Telemetry Radar Hardware Quick Strip (From Desktop Project Page) */}
        {(projectTab === 'FAMOUS' || projectTab === 'ALL') && (
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Truck className="w-3 h-3 text-red-600" />
                9 Kategori Telematika FAMOUS (825 Truk)
              </span>
              <button
                onClick={() => navigate('/project-inventory?project=proj-famous')}
                className="text-[9.5px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                Detail &rarr;
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-center">
              {[
                { name: 'GPS', val: '1.155', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { name: 'DSM', val: '1.275', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { name: 'ADAS', val: '1.175', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { name: 'MDVR', val: '1.175', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                { name: 'SSD', val: '1.175', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                { name: 'OBU', val: '1.145', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                { name: 'PTT', val: '1.191', color: 'bg-teal-50 text-teal-700 border-teal-200' },
                { name: 'DOME', val: '1.020', color: 'bg-slate-50 text-slate-700 border-slate-200' },
                { name: 'CANBUS', val: '105', color: 'bg-red-50 text-red-700 border-red-200' },
              ].map((item) => (
                <div key={item.name} className={`px-2 py-1 rounded-lg border ${item.color} shrink-0 min-w-[58px]`}>
                  <div className="text-[9px] font-mono font-bold">{item.name}</div>
                  <div className="text-[10.5px] font-black">{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Visualisasi Arus Mutasi Masuk vs Keluar (Grafik Garis / Area Interaktif) ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Tren Laju Mutasi: Masuk (MOS) vs Keluar (MR)
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Grafik garis interaktif pergerakan stok 6 periode
            </p>
          </div>
          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
            SLA 0.9 Hari
          </span>
        </div>

        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { period: 'Mei', masuk: 14, keluar: 11 },
                { period: 'Jun', masuk: 19, keluar: 16 },
                { period: 'Jul', masuk: 24, keluar: 20 },
                { period: 'Agu', masuk: 26, keluar: 22 },
                { period: 'Sep', masuk: 34, keluar: 28 },
                { period: 'Okt', masuk: 30, keluar: 26 }
              ]}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMobMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMobKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="period" stroke="#94A3B8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white text-slate-800 p-2 rounded-xl text-xs border border-slate-200 shadow-md">
                        <div className="font-bold border-b border-slate-100 pb-1 mb-1 text-slate-900">{label} 2026</div>
                        <div className="text-blue-600 flex justify-between gap-3 text-[10px]">
                          <span>Inbound (MOS):</span>
                          <span className="font-mono font-bold">+{payload[0]?.value} Unit</span>
                        </div>
                        <div className="text-red-600 flex justify-between gap-3 text-[10px]">
                          <span>Outbound (MR):</span>
                          <span className="font-mono font-bold">-{payload[1]?.value} Unit</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="masuk"
                name="Masuk (MOS)"
                stroke="#2563EB"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMobMasuk)"
              />
              <Area
                type="monotone"
                dataKey="keluar"
                name="Keluar (MR)"
                stroke="#DC2626"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMobKeluar)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-5 pt-2 border-t border-slate-100 text-[10.5px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-600 font-medium text-[10px]">Masuk (Inbound MOS)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span className="text-slate-600 font-medium text-[10px]">Keluar (Outbound MR)</span>
          </div>
        </div>
      </div>

      {/* ── 4. Status Kesehatan Buffer Stok Gudang (Donut Chart scaled for mobile) ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Status Kesehatan Buffer Stok Gudang
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              649 katalog suku cadang vs ambang minimum
            </p>
          </div>
          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
            89.4% Aman
          </span>
        </div>

        <div className="h-40 w-full flex items-center justify-center relative my-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Stok Aman', value: 580, color: '#059669' },
                  { name: 'Mendekati Buffer', value: 45, color: '#D97706' },
                  { name: 'Kritis Reorder', value: 24, color: '#DC2626' }
                ]}
                innerRadius={46}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
              >
                {[
                  { color: '#059669' },
                  { color: '#D97706' },
                  { color: '#DC2626' }
                ].map((entry, index) => (
                  <Cell key={`cell-mob-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-black text-slate-900 leading-none">649</span>
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">KATALOG</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center">
          <div className="bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100">
            <div className="font-bold text-emerald-800 text-[11px]">580 Part</div>
            <div className="text-[9px] text-emerald-600">Aman</div>
          </div>
          <div className="bg-amber-50/60 p-1.5 rounded-lg border border-amber-100">
            <div className="font-bold text-amber-800 text-[11px]">45 Part</div>
            <div className="text-[9px] text-amber-600">Buffer Alert</div>
          </div>
          <div className="bg-red-50/60 p-1.5 rounded-lg border border-red-100">
            <div className="font-bold text-red-800 text-[11px]">24 Part</div>
            <div className="text-[9px] text-red-600">Kritis</div>
          </div>
        </div>
      </div>

      {/* ── 5. Monitoring Rak Inventaris (Zona A, B, C scaled for mobile) ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              Monitoring Rak Inventaris
            </h3>
            <p className="text-[10px] text-slate-500">Kapasitas rak real-time</p>
          </div>
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0">
            {['Zona A', 'Zona B', 'Zona C'].map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  selectedZone === z ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ZONES[selectedZone].map((rack) => (
            <div
              key={rack.id}
              className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 hover:bg-white transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-[11px] text-slate-900">{rack.id}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold text-white ${rack.color}`}>
                  {rack.pct}%
                </span>
              </div>
              <div className="text-[10.5px] font-semibold text-slate-800 truncate mb-1.5">{rack.item}</div>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rack.color}`}
                  style={{ width: `${rack.pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                <span>{rack.stock} unit</span>
                <span>Kap: {rack.cap}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Antrean Verifikasi Dokumen MOS (Slot 2) scaled for mobile ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-3.5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Antrean Verifikasi MOS (Slot 2)</h3>
            <p className="text-[10px] text-slate-500">Pemeriksaan fisik barang tiba vs Surat Jalan</p>
          </div>
          <button
            onClick={() => navigate('/mos')}
            className="text-[10px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 cursor-pointer"
          >
            Semua <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3 divide-y divide-slate-100 space-y-2">
          {mosQueue.length === 0 ? (
            <div className="py-4 text-center text-slate-400 text-xs">
              Tidak ada antrean dokumen MOS yang menunggu verifikasi saat ini.
            </div>
          ) : (
            mosQueue.map((doc) => (
              <div key={doc.id} className="pt-2 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-amber-700 text-xs">{doc.doc_number || doc.id}</span>
                    <p className="text-[10.5px] text-slate-800 font-medium">{doc.pic_receiver_name || 'Team Mekanik Pit'}</p>
                    <p className="text-[10px] text-slate-400">{doc.site_location || 'BIB Pit Sebamban KM-14'}</p>
                  </div>
                  <button
                    onClick={() => navigate('/mos')}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <PenLine className="w-3 h-3" />
                    Periksa &amp; TTD
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Built-in Barcode Scanner Modal ── */}
      <InventoryScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectSku={(sku) => {
          setIsScannerOpen(false);
          navigate(`/inventory?search=${encodeURIComponent(sku)}`);
        }}
      />

    </div>
  );
}
