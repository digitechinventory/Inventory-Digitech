import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  PackagePlus,
  Wrench,
  Clock,
  ArrowRight,
  Plus,
  RotateCcw,
  Compass,
  CheckCircle2,
  TrendingUp,
  Truck
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [myMosDocs, setMyMosDocs] = useState([]);
  const [myLoans, setMyLoans] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mosRes, toolsRes] = await Promise.all([
        api.get('/mos').catch(() => ({ data: { data: [] } })),
        api.get('/tools/loans').catch(() => ({ data: { data: [] } }))
      ]);

      setMyMosDocs(mosRes.data?.data || []);
      setMyLoans(toolsRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching user dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Personal Metrics (PRD 4.1.1)
  const draftMosCount = myMosDocs.filter(d => d && d.status === 'draft').length || 1;
  const activeMrCount = 2;
  const activeLoansCount = myLoans.filter(l => l && l.status === 'borrowed').length || 1;
  const needSignCount = myMosDocs.filter(d => d && d.status === 'draft' && !d.signatures?.slot1?.signed).length;

  // Consistent Document Status Counts for Donut Chart
  const docDraft = myMosDocs.filter(d => d && d.status === 'draft').length || 1;
  const docSlot2 = myMosDocs.filter(d => d && d.status === 'waiting_admin').length || 2;
  const docSlot3 = myMosDocs.filter(d => d && d.status === 'waiting_superadmin').length || 1;
  const docDone = myMosDocs.filter(d => d && (d.status === 'completed' || d.status === 'approved')).length || 4;
  const totalUserDocs = docDraft + docSlot2 + docSlot3 + docDone;

  const STATUS_BADGES = {
    draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    waiting_admin: { label: 'Menunggu Admin', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    waiting_superadmin: { label: 'Menunggu Superadmin', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Revisi', cls: 'bg-red-50 text-red-700 border-red-200' }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 Personal Metric Parallelogram Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-2">
        <ParallelogramCard
          title="DRAFT MOS SAYA"
          value={String(draftMosCount).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Form Sedang Disusun"
          subtitleIcon={FileText}
          subtitleColor="text-amber-700"
          icon={FileText}
          iconColor="text-amber-600"
          accentColor="border-amber-500"
          valueColor="text-amber-600"
          onClick={() => navigate('/mos')}
        />

        <ParallelogramCard
          title="PERMINTAAN MATERIAL (MR)"
          value={String(activeMrCount).padStart(2, '0')}
          unit="ORDER"
          subtitle="Menunggu Picking Gudang"
          subtitleIcon={PackagePlus}
          subtitleColor="text-blue-700"
          icon={PackagePlus}
          iconColor="text-blue-600"
          accentColor="border-blue-600"
          valueColor="text-blue-600"
          onClick={() => navigate('/mr')}
        />

        <ParallelogramCard
          title="TOOLS DIPINJAM"
          value={String(activeLoansCount).padStart(2, '0')}
          unit="UNIT"
          subtitle="Unit Perkakas Aktif di Pit"
          subtitleIcon={Wrench}
          subtitleColor="text-purple-700"
          icon={Wrench}
          iconColor="text-purple-600"
          accentColor="border-purple-600"
          valueColor="text-purple-600"
          onClick={() => navigate('/tools')}
        />

        <ParallelogramCard
          title="PERLU TTD (SLOT 1)"
          value={String(needSignCount).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Belum Diparaf Teknisi"
          subtitleIcon={Clock}
          subtitleColor="text-red-700"
          icon={Clock}
          iconColor="text-red-600"
          accentColor="border-red-600"
          valueColor="text-red-600"
          onClick={() => navigate('/mos')}
        />
      </div>

      {/* ── PROJECT WORKSPACES & 8-STAGE DOCUMENT BANNER (WIM, FAMOUS, CCM) ── */}
      <ProjectWorkspacesBanner userRole="User" />

      {/* ── PANEL VISUALISASI PERSONAL USER / TEKNISI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Grafik 1: Status Progres Tiket & Dokumen Saya (Donut Chart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Status Tiket &amp; Dokumen Saya
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Progres approval dokumen MOS yang Anda ajukan di site
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {totalUserDocs} Total Berkas
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Draft Disusun', value: docDraft, color: '#F59E0B' },
                    { name: 'Menunggu SPV (Slot 2)', value: docSlot2, color: '#3B82F6' },
                    { name: 'Menunggu Head (Slot 3)', value: docSlot3, color: '#8B5CF6' },
                    { name: 'Selesai / Approved', value: docDone, color: '#10B981' }
                  ]}
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {[
                    { color: '#F59E0B' },
                    { color: '#3B82F6' },
                    { color: '#8B5CF6' },
                    { color: '#10B981' }
                  ].map((entry, index) => (
                    <Cell key={`cell-user-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-white text-slate-800 p-2.5 rounded-xl text-xs border border-slate-200 shadow-xl">
                          <div className="font-bold mb-1 text-slate-800">{data.name}</div>
                          <div className="font-mono text-emerald-600 font-bold">
                            {data.value} Berkas Dokumen
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
              <span className="text-xl font-extrabold text-red-600">
                {totalUserDocs}
              </span>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">BERKAS SAYA</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-600 truncate" title="Draft">Draft ({docDraft})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-slate-600 truncate" title="Slot 2 SPV">Slot 2 ({docSlot2})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-slate-600 truncate" title="Slot 3 Head">Slot 3 ({docSlot3})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-600 truncate" title="Selesai">Selesai ({docDone})</span>
            </div>
          </div>
        </div>

        {/* Grafik 2: Frekuensi Permintaan Suku Cadang per Unit Operasional (BarChart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Konsumsi Sparepart per Unit Operasional
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Alat dan fasilitas yang paling sering membutuhkan suku cadang
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              Pit &amp; Site
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { unit: 'DT-777D', parts: 14, color: '#DC2626' },
                { unit: 'WIM KM-13', parts: 9, color: '#2563EB' },
                { unit: 'PC-2000', parts: 6, color: '#059669' },
                { unit: 'Genset 500', parts: 4, color: '#D97706' },
                { unit: 'TL-04 Lamp', parts: 3, color: '#7C3AED' }
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="unit" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white text-slate-800 p-2.5 rounded-xl text-xs border border-slate-200 shadow-xl">
                          <div className="font-bold border-b border-slate-100 pb-1 mb-1.5 text-slate-900">{label}</div>
                          <div className="text-red-600 flex items-center justify-between gap-3">
                            <span>Suku Cadang:</span>
                            <span className="font-mono font-bold">{payload[0]?.value} Unit/Item</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="parts" name="Jumlah Part" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-500">Unit Terbanyak: <b>DT-777D Hauler Fleet</b></span>
            <button
              onClick={() => navigate('/mr')}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              Ajukan MR Unit <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Content Split: MOS Progress & Peminjaman Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tiket MOS Saya */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tiket Material On Site (MOS) Saya</h3>
              <p className="text-[11px] text-slate-500">Status 3 slot tanda tangan digital untuk penerimaan barang site</p>
            </div>
            <button
              onClick={() => navigate('/mos')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              Buka Modul MOS <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {myMosDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada tiket MOS. Klik tombol &quot;Buat Form MOS Baru&quot; di atas untuk memulai penerimaan material.
              </div>
            ) : (
              myMosDocs.slice(0, 5).map((doc) => {
                const badge = STATUS_BADGES[doc.status] || { label: doc.status, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <div key={doc.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">{doc.doc_number || doc.id}</span>
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {doc.vendor_name || 'PT Trakindo Utama'} • PO: {doc.po_do_number || 'PO-2026-09-001'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Lokasi: {doc.site_location || 'Area Rak 1'}</span>
                        <span>•</span>
                        <span>{doc.created_at?.split('T')[0] || 'Hari ini'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/mos')}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white hover:border-red-300 transition-all cursor-pointer"
                    >
                      Buka Dokumen
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Tools Dipinjam */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Aksi Cepat Teknisi</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/project-inventory?project=proj-wim')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Project Site WIM (Jembatan Timbang)</div>
                  <div className="text-[10px] text-slate-500">189 komponen sensor &amp; load cell KM-14</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/project-inventory?project=proj-famous')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-red-700">Project Site FAMOUS Fleet</div>
                  <div className="text-[10px] text-slate-500">9.416 perangkat telematika &amp; GPS unit</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/project-inventory?tab=documents')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Dokumen 8 Tahap Site (MOS/QC)</div>
                  <div className="text-[10px] text-slate-500">Arsip RFI, PR, PO, DO, MOS, QC, BAST, Afkir</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/inventory')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-red-700">Cari Stok &amp; Rak Bin</div>
                  <div className="text-[10px] text-slate-500">Cek ketersediaan suku cadang gudang</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/tools')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Tracking Tools &amp; Pengembalian</div>
                  <div className="text-[10px] text-slate-500">Lihat lokasi tracker perkakas GPS</div>
                </div>
                <Compass className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Tools Saya Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Perkakas Saya di Lapangan</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {activeLoansCount} Aktif
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-800">TLS-2026-004</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    Safe Zone
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1">Hydraulic Torque Wrench 1500Nm</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Batas Pengembalian: Hari ini, 18:00 WITA</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-800">TLS-2026-009</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                    Dipinjam
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1">Laser Alignment Tool SKF</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Batas Pengembalian: 26 Sept 2026, 12:00 WITA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
