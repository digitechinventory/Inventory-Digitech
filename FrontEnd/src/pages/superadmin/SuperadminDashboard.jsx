import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Users,
  ClipboardList,
  TrendingUp,
  History,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  RotateCcw,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import ParallelogramCard from '../../components/common/ParallelogramCard';
import ProjectWorkspacesBanner from '../../components/dashboard/ProjectWorkspacesBanner';

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allMosDocs, setAllMosDocs] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [recentLedger, setRecentLedger] = useState([]);
  const [stats, setStats] = useState({
    totalEnterpriseUnits: 10253,
    totalStockUnits: 10253,
    catalogStockUnits: 649,
    famousTotalItems: 9416,
    famousFleetUnits: 825,
    totalValuation: 2053100000,
    opnamePendingCount: 1,
    mosTotal: 6,
    mosPending: 2,
    lifecycle: {
      rfi: 12,
      pr: 8,
      po: 15,
      delivery: 24,
      mos: 6,
      qc: 35,
      ops: 7180,
      decommissioning: 839
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mosRes, usersRes, statsRes, ledgerRes] = await Promise.all([
        api.get('/mos').catch(() => ({ data: { data: [] } })),
        api.get('/users/pending').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/stats').catch(() => ({ data: { data: {} } })),
        api.get('/inventory/ledger').catch(() => ({ data: { data: [] } }))
      ]);

      const allMos = mosRes.data?.data || [];
      setAllMosDocs(allMos);
      setPendingUsers(usersRes.data?.data || []);
      setRecentLedger(ledgerRes.data?.data || []);
      if (statsRes.data?.data) {
        setStats(prev => ({ ...prev, ...statsRes.data.data }));
      }
    } catch (err) {
      console.error('Error fetching superadmin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute pending counts directly
  const totalEnterpriseUnits = stats.totalEnterpriseUnits || 10253;
  const slot3Queue = allMosDocs.filter(d => 
    (d.signatures?.slot2?.signed && !d.signatures?.slot3?.signed) || 
    d.status === 'waiting_superadmin'
  );
  const pendingSlot3Count = slot3Queue.length;
  const pendingUsersCount = pendingUsers.length;
  const varianceApprovalCount = stats.opnamePendingCount || 1;


  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 4 Executive Metric Parallelogram Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 py-1">
        <ParallelogramCard
          title="TOTAL ASET ENTERPRISE"
          value={totalEnterpriseUnits.toLocaleString('id-ID')}
          unit="UNIT"
          subtitle="• 9.416 FAMOUS + 189 WIM + 649 Katalog"
          subtitleColor="text-slate-600"
          icon={TrendingUp}
          iconColor="text-red-600"
          accentColor="border-red-600"
          valueColor="text-slate-900"
          onClick={() => navigate('/inventory')}
        />

        <ParallelogramCard
          title="DRAF MOS PENDING"
          value={String(pendingSlot3Count).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Verifikasi SPV Gudang Siap (Slot 3)"
          subtitleIcon={FileCheck2}
          subtitleColor="text-blue-700"
          icon={FileCheck2}
          iconColor="text-blue-600"
          accentColor="border-blue-600"
          valueColor="text-blue-600"
          onClick={() => navigate('/mos')}
        />

        <ParallelogramCard
          title="ANTEAN AKTIVASI AKUN"
          value={String(pendingUsersCount).padStart(2, '0')}
          unit="USER"
          subtitle="Pendaftar Baru Butuh Review"
          subtitleIcon={Users}
          subtitleColor="text-purple-700"
          icon={Users}
          iconColor="text-purple-600"
          accentColor="border-purple-600"
          valueColor="text-purple-600"
          onClick={() => navigate('/users')}
        />

        <ParallelogramCard
          title="SELISIH OPNAME"
          value={String(varianceApprovalCount).padStart(2, '0')}
          unit="PART"
          subtitle="Di Bawah Buffer Rekonsiliasi"
          subtitleIcon={ClipboardList}
          subtitleColor="text-amber-700"
          icon={ClipboardList}
          iconColor="text-amber-600"
          accentColor="border-amber-600"
          valueColor="text-amber-600"
          onClick={() => navigate('/opname')}
        />
      </div>


      {/* ── PROJECT WORKSPACES & 8-STAGE DOCUMENT BANNER (WIM, FAMOUS, CCM) ── */}
      <ProjectWorkspacesBanner userRole="Superadmin" />

      {/* ── PANEL VISUALISASI EKSEKUTIF SUPERADMIN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Grafik 1: Tren Approval & Throughput Berita Acara (AreaChart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Tren Laju Otorisasi Dokumen Berita Acara
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Perbandingan volume dokumen diajukan vs disetujui 6 bulan terakhir
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              SLA Rata-rata: 0.9 Hari
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { period: 'Mei', submitted: 8, approved: 7 },
                { period: 'Jun', submitted: 12, approved: 11 },
                { period: 'Jul', submitted: 15, approved: 14 },
                { period: 'Agu', submitted: 19, approved: 18 },
                { period: 'Sep', submitted: 22, approved: 20 },
                { period: 'Okt', submitted: 26, approved: 24 }
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="period" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white text-slate-800 p-2.5 rounded-xl text-xs border border-slate-200 shadow-xl">
                          <div className="font-bold border-b border-slate-100 pb-1 mb-1.5 text-slate-900">{label} 2026</div>
                          <div className="text-blue-600 flex items-center justify-between gap-3">
                            <span>Diajukan:</span>
                            <span className="font-mono font-bold">{payload[0]?.value} Dokumen</span>
                          </div>
                          <div className="text-red-600 flex items-center justify-between gap-3">
                            <span>Disetujui:</span>
                            <span className="font-mono font-bold">{payload[1]?.value} Dokumen</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="submitted" name="Diajukan" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSubmitted)" />
                <Area type="monotone" dataKey="approved" name="Disetujui" stroke="#DC2626" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApproved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-slate-600 font-semibold text-[11px]">Diajukan (Submitted)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              <span className="text-slate-600 font-semibold text-[11px]">Disetujui Sah (Slot 3)</span>
            </div>
          </div>
        </div>

        {/* Grafik 2: Sebaran Aset Fisik per Site / Fasilitas (Donut Chart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Sebaran Stok Aset Fisik per Fasilitas
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total 10.065 unit material terdaftar di 4 lokasi operasional
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
              4 SITE AKTIF
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Office VGT', value: 3520, color: '#DC2626' },
                    { name: 'Central Warehouse', value: 4025, color: '#2563EB' },
                    { name: 'WIM KM 13', value: 1510, color: '#059669' },
                    { name: 'BIB Pit KM-14', value: 1010, color: '#D97706' }
                  ]}
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {[
                    { color: '#DC2626' },
                    { color: '#2563EB' },
                    { color: '#059669' },
                    { color: '#D97706' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-white text-slate-800 p-2.5 rounded-xl text-xs border border-slate-200 shadow-xl">
                          <div className="font-bold mb-1 text-slate-900">{data.name}</div>
                          <div className="font-mono text-emerald-600 font-bold">
                            {data.value?.toLocaleString('id-ID')} Unit
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {((data.value / 10065) * 100).toFixed(1)}% dari total aset
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-black text-slate-900">10.065</span>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">UNIT ASET</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
              <span className="text-slate-600 truncate" title="Office VGT (35%)">Office VGT (35%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span className="text-slate-600 truncate" title="Central WH (40%)">Central WH (40%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-slate-600 truncate" title="WIM KM 13 (15%)">WIM KM 13 (15%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
              <span className="text-slate-600 truncate" title="BIB Pit KM-14 (10%)">BIB Pit (10%)</span>
            </div>
          </div>
        </div>

      </div>


      {/* Antrean Otorisasi Final (Slot 3) (PRD 4.3.1) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Antrean Otorisasi Final MOS (Slot 3)</h3>
            <p className="text-[11px] text-slate-500">Pengesahan sah penerimaan barang site yang memicu auto-ledger mutasi stok</p>
          </div>
          <button
            onClick={() => navigate('/mos')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Lihat Modul MOS <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                <th className="px-4 py-3 text-left">No. Dokumen</th>
                <th className="px-4 py-3 text-left">Lokasi Site</th>
                <th className="px-4 py-3 text-left">Penerima PIC</th>
                <th className="px-4 py-3 text-left">Verifikasi Slot 2 (Admin)</th>
                <th className="px-4 py-3 text-center">Aksi Otorisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slot3Queue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada dokumen yang menunggu otorisasi Slot 3 saat ini.
                  </td>
                </tr>
              ) : (
                slot3Queue.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{doc.doc_number || doc.id}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{doc.site_location || 'Office VGT'}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.pic_receiver_name || 'Rayhans Najib A.'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {doc.signatures?.slot2?.signer_name || 'Admin Logistik'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate('/mos')}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs shadow-blue-900/20"
                      >
                        Otorisasi Slot 3
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel Audit Trail Buku Besar Stok (PRD 4.3.3) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              Audit Trail &amp; Buku Besar Mutasi Stok (Ledger)
            </h3>
            <p className="text-[11px] text-slate-500">Rekaman mutasi fisik barang secara real-time</p>
          </div>
          <button
            onClick={() => navigate('/ledger')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            Buka Ledger Penuh <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                <th className="px-4 py-3 text-left">Waktu Transaksi</th>
                <th className="px-4 py-3 text-left">Nama Material</th>
                <th className="px-4 py-3 text-left">Rak Bin</th>
                <th className="px-4 py-3 text-center">Tipe Transaksi</th>
                <th className="px-4 py-3 text-right">Mutasi Qty</th>
                <th className="px-4 py-3 text-left">Eksekutor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLedger.slice(0, 5).map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-500 text-[11px]">{l.created_at?.split('T')[0]}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{l.item_name}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">{l.bin_location}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                      l.transaction_type === 'MOS_IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      l.transaction_type === 'MR_OUT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {l.transaction_type}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${l.qty_change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {l.qty_change > 0 ? `+${l.qty_change}` : l.qty_change}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-[11px]">{l.performed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
