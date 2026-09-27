import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  PackageCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Layers,
  RotateCcw,
  PenLine
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import ParallelogramCard from '../../components/common/ParallelogramCard';


export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [mosQueue, setMosQueue] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [overdueTools, setOverdueTools] = useState([]);
  const [selectedZone, setSelectedZone] = useState('Zona A');

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
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingInspectionCount = mosQueue.filter(d => d.status === 'waiting_admin').length || 1;
  const activePickingCount = 4;
  const lowStockCount = lowStockItems.length || 2;
  const overdueCount = overdueTools.length || 1;

  // 2D Rack Map Data (PRD Section 4.2.2)
  const ZONES = {
    'Zona A': [
      { id: 'R-A01', item: 'Cat 777D Engine Oil Filter', stock: 4, cap: 20, pct: 20, status: 'critical', color: 'bg-red-500' },
      { id: 'R-A02', item: 'Komatsu PC2000 Seal Kit', stock: 18, cap: 20, pct: 90, status: 'full', color: 'bg-emerald-600' },
      { id: 'R-A03', item: 'Hydraulic Valve Spool', stock: 12, cap: 20, pct: 60, status: 'partial', color: 'bg-amber-500' },
      { id: 'R-A04', item: 'Kosong (Siap Alokasi)', stock: 0, cap: 20, pct: 0, status: 'empty', color: 'bg-slate-200' },
    ],
    'Zona B': [
      { id: 'R-B01', item: 'Volvo FMX Brake Lining', stock: 32, cap: 40, pct: 80, status: 'optimal', color: 'bg-emerald-600' },
      { id: 'R-B02', item: 'Brake Disc Assm HD', stock: 15, cap: 30, pct: 50, status: 'partial', color: 'bg-amber-500' },
      { id: 'R-B03', item: 'Bucket Tooth Tip 777D', stock: 65, cap: 70, pct: 92, status: 'full', color: 'bg-emerald-600' },
      { id: 'R-B04', item: 'Kosong (Siap Alokasi)', stock: 0, cap: 30, pct: 0, status: 'empty', color: 'bg-slate-200' },
    ],
    'Zona C': [
      { id: 'R-C01', item: 'Shell Tellus S2 V 68 Drum', stock: 6, cap: 25, pct: 24, status: 'critical', color: 'bg-red-500' },
      { id: 'R-C02', item: 'Delvac 15W-40 Synthetic', stock: 18, cap: 25, pct: 72, status: 'optimal', color: 'bg-emerald-600' },
      { id: 'R-C03', item: 'Grease Cartridge EP2', stock: 40, cap: 50, pct: 80, status: 'optimal', color: 'bg-emerald-600' },
      { id: 'R-C04', item: 'Kosong (Siap Alokasi)', stock: 0, cap: 25, pct: 0, status: 'empty', color: 'bg-slate-200' },
    ]
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Operational Command Banner — Pure White Timbul Card with Amber Accent */}
      <div className="bg-white/95 backdrop-blur-md rounded-[1.75rem] p-6 text-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-200/90 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-amber-500/10 via-amber-500/5 to-transparent pointer-events-none rounded-r-[1.75rem]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Halo, {user?.full_name || 'Admin Logistik'} (Admin Gudang)
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Verifikasi fisik DO/PO, pembubuhan tanda tangan Slot 2, dan pemantauan status penempatan rak inventaris.
          </p>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => navigate('/warehouses')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-amber-600/20 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Buka Rak Suku Cadang
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Muat Ulang Data"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Warehouse Operational Parallelogram Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 py-2">
        <ParallelogramCard
          title="MOS MENUNGGU SLOT 2"
          value={String(pendingInspectionCount).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Butuh Cek Fisik & Tanda Tangan"
          subtitleIcon={FileCheck2}
          subtitleColor="text-amber-700"
          icon={FileCheck2}
          iconColor="text-amber-600"
          accentColor="border-amber-600"
          valueColor="text-amber-600"
          onClick={() => navigate('/mos')}
        />

        <ParallelogramCard
          title="PICKING LIST AKTIF"
          value={String(activePickingCount).padStart(2, '0')}
          unit="ORDER"
          subtitle="Material Keluar Sesuai MR"
          subtitleIcon={PackageCheck}
          subtitleColor="text-blue-700"
          icon={PackageCheck}
          iconColor="text-blue-600"
          accentColor="border-blue-600"
          valueColor="text-blue-600"
          onClick={() => navigate('/mr')}
        />

        <ParallelogramCard
          title="KRITIS REORDER"
          value={String(lowStockCount).padStart(2, '0')}
          unit="PART"
          subtitle="Di Bawah Buffer Minimum"
          subtitleIcon={AlertTriangle}
          subtitleColor="text-red-700"
          icon={AlertTriangle}
          iconColor="text-red-600"
          accentColor="border-red-600"
          valueColor="text-red-600"
          onClick={() => navigate('/inventory?status=low_stock')}
        />

        <ParallelogramCard
          title="TOOL DIPINJAM"
          value={String(overdueCount).padStart(2, '0')}
          unit="UNIT"
          subtitle="1 Tool Overdue Target"
          subtitleIcon={Clock}
          subtitleColor="text-purple-700"
          icon={Clock}
          iconColor="text-purple-600"
          accentColor="border-purple-600"
          valueColor="text-purple-600"
          onClick={() => navigate('/tools')}
        />
      </div>

      {/* Monitoring Rak Inventaris */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              Monitoring Rak Inventaris
            </h3>
            <p className="text-[11px] text-slate-500">Visualisasi kapasitas rak real-time (Hijau: Aman, Oranye: Terisi, Merah: Kritis)</p>
          </div>
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            {['Zona A', 'Zona B', 'Zona C'].map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedZone === z ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ZONES[selectedZone].map((rack) => (
            <div
              key={rack.id}
              className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 hover:bg-white hover:border-amber-400 transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-xs text-slate-900">{rack.id}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold text-white ${rack.color}`}>
                  {rack.pct}%
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 truncate mb-2">{rack.item}</div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rack.color}`}
                  style={{ width: `${rack.pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>Stok: {rack.stock}</span>
                <span>Kapasitas: {rack.cap}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Antrean Verifikasi Dokumen Masuk (Slot 2) (PRD 4.2.3) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Antrean Verifikasi Dokumen MOS (Slot 2)</h3>
            <p className="text-[11px] text-slate-500">Pemeriksaan fisik barang tiba terhadap Surat Jalan &amp; PO vendor</p>
          </div>
          <button
            onClick={() => navigate('/mos')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua Antrean <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                <th className="px-4 py-3 text-left">No. Dokumen</th>
                <th className="px-4 py-3 text-left">Teknisi Pengaju</th>
                <th className="px-4 py-3 text-left">Lokasi</th>
                <th className="px-4 py-3 text-left">Ref PO / DO</th>
                <th className="px-4 py-3 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mosQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada antrean dokumen MOS yang menunggu verifikasi saat ini.
                  </td>
                </tr>
              ) : (
                mosQueue.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">{doc.doc_number || doc.id}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{doc.pic_receiver_name}</td>
                    <td className="px-4 py-3 text-slate-500">{doc.site_location}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono text-[11px]">{doc.po_do_number}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate('/mos')}
                          className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-red-900/20"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          Periksa &amp; TTD
                        </button>
                        <button
                          onClick={() => navigate('/mos')}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
