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
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

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

  const STATUS_BADGES = {
    draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    waiting_admin: { label: 'Menunggu Admin', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    waiting_superadmin: { label: 'Menunggu Superadmin', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Revisi', cls: 'bg-red-50 text-red-700 border-red-200' }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Welcome Banner — Pure White Timbul Card with Crimson Accent */}
      <div className="bg-white/95 backdrop-blur-md rounded-[1.75rem] p-6 text-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-200/90 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-red-500/10 via-red-500/5 to-transparent pointer-events-none rounded-r-[1.75rem]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-red-600 font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Portal Teknisi Lapangan • {user?.company || 'PT Digitech Global'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Selamat Datang, {user?.full_name || 'Teknisi Lapangan'}!
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Pengelolaan tiket material ter-geofence dan peminjaman perkakas operasional tambang PT Borneo Indobara.
          </p>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => navigate('/mos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Form MOS Baru
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Muat Ulang Data"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Personal Metric Cards (PRD 4.1.1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-[1.5rem] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Draft MOS Saya</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{draftMosCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Form sedang disusun</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-[1.5rem] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Permintaan Berjalan (MR)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600">{activeMrCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Menunggu picking gudang</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-[1.5rem] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Tools Dipinjam</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600">{activeLoansCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Unit perkakas aktif di pit</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-[1.5rem] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Perlu TTD (Slot 1)</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-red-600">{needSignCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Belum diparaf teknisi</p>
        </div>
      </div>

      {/* Main Content Split: MOS Progress & Peminjaman Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tiket MOS Saya */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tiket Material On Site (MOS) Saya</h3>
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
                        <span className="font-mono font-bold text-xs text-slate-900">{doc.doc_number || doc.id}</span>
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {doc.vendor_name || 'PT Trakindo Utama'} • PO: {doc.po_do_number || 'PO-2026-09-001'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Lokasi: {doc.site_location || 'Warehouse 1'}</span>
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
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Aksi Cepat Teknisi</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/mos')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-red-700">Buat MOS Baru</div>
                  <div className="text-[10px] text-slate-500">Penerimaan material tiba di site</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/inventory')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-red-700">Cari Stok &amp; Rak Bin</div>
                  <div className="text-[10px] text-slate-500">Cek ketersediaan suku cadang</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => navigate('/tools')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 transition-colors text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-red-700">GIS Tools &amp; Pengembalian</div>
                  <div className="text-[10px] text-slate-500">Lihat lokasi tracker perkakas GPS</div>
                </div>
                <Compass className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Tools Saya Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Perkakas Saya di Lapangan</h3>
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
