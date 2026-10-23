import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Scale,
  Cpu,
  ArrowRight,
  ArrowRightLeft,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  Boxes,
  Warehouse,
  ExternalLink,
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';
import { getProjects, getFamousSummary, getWimSummary } from '../../api/projectInventoryApi';

export default function ProjectWorkspacesBanner({ userRole = 'User' }) {
  const navigate = useNavigate();

  const [famousSummary, setFamousSummary] = useState(null);
  const [wimSummary, setWimSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardProjectsData = async () => {
      try {
        setLoading(true);
        const [fSum, wSum] = await Promise.all([
          getFamousSummary().catch(() => null),
          getWimSummary().catch(() => null)
        ]);

        setFamousSummary(fSum);
        setWimSummary(wSum);
      } catch (err) {
        console.error('Error fetching dashboard project banner data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardProjectsData();
  }, []);

  return (
    <div className="space-y-4">
      {/* ── 3 Interactive Project Workspace Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. PROJECT FAMOUS */}
        <div
          onClick={() => navigate('/project-inventory?project=proj-famous')}
          className="bg-white border border-slate-200/90 hover:border-red-500 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
        >
          {/* Background Decoration — Strictly in Background (z-0), visible & beautiful without covering text */}
          <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none z-0 overflow-hidden rounded-tr-3xl">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-red-100/70 via-red-50/40 to-transparent transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -top-2 -right-2 w-20 h-20 rounded-full border border-red-200/40 pointer-events-none" />
          </div>

          {/* Foreground Card Content (z-10) — 100% Unobscured Text */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 block sm:inline-block w-fit">
                      FAMOUS FLEET
                    </span>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">Pit South &amp; Workshop</div>
                  </div>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
                  825 Truk Optimal
                </span>
              </div>

              <h3 className="font-bold text-red-700 text-sm group-hover:text-red-800 transition-colors">
                Fleet Asset Management (FAMOUS)
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Telematika alat berat hauling batubara, GPS tracker presisi tinggi, DSM fatigue sensor, dan relokasi unit.
              </p>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-red-50/50 p-2 rounded-xl border border-red-100/60">
                  <div className="text-[10px] text-red-600 font-mono font-semibold">Hardware Real:</div>
                  <div className="font-extrabold text-red-600 text-sm mt-0.5">
                    {famousSummary?.total_items ? Number(famousSummary.total_items).toLocaleString('id-ID') : '9.416'} <span className="text-[9px] font-normal text-red-400">unit</span>
                  </div>
                </div>
                <div className="bg-purple-50/70 p-2 rounded-xl border border-purple-100">
                  <div className="text-[10px] text-purple-700 font-mono flex items-center gap-1 font-bold">
                    <ArrowRightLeft className="w-3 h-3" /> Pindahan Ex-Unit:
                  </div>
                  <div className="font-black text-purple-700 text-sm mt-0.5">
                    {famousSummary?.total_pindahan ? Number(famousSummary.total_pindahan).toLocaleString('id-ID') : '3.976'} <span className="text-[9px] font-normal text-purple-400">part</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">8 Tahap: Dokumen #007</span>
              <span className="font-bold text-red-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Buka Command Center <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 2. PROJECT WIM */}
        <div
          onClick={() => navigate('/project-inventory?project=proj-wim')}
          className="bg-white border border-slate-200/90 hover:border-emerald-500 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
        >
          {/* Background Decoration — Strictly in Background (z-0), visible & beautiful without covering text */}
          <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none z-0 overflow-hidden rounded-tr-3xl">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-emerald-100/70 via-emerald-50/40 to-transparent transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -top-2 -right-2 w-20 h-20 rounded-full border border-emerald-200/40 pointer-events-none" />
          </div>

          {/* Foreground Card Content (z-10) — 100% Unobscured Text */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 block sm:inline-block w-fit">
                      PROJECT WIM
                    </span>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">Sebamban KM-14 &amp; KM-28</div>
                  </div>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] font-mono font-bold text-blue-700 bg-blue-50/90 border border-blue-200 px-2.5 py-1 rounded-full shadow-2xs">
                  Lane 1 &amp; 3 Aktif
                </span>
              </div>

              <h3 className="font-bold text-emerald-800 text-sm group-hover:text-emerald-900 transition-colors">
                Weigh-In-Motion Scale (WIM)
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Sensor jembatan timbang dinamis, load cell shear beam, mounting frame, ANPR kamera, dan katalog garansi.
              </p>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/60">
                  <div className="text-[10px] text-emerald-700 font-mono font-semibold">Komponen Fisik:</div>
                  <div className="font-extrabold text-emerald-700 text-sm mt-0.5">
                    {wimSummary?.total_components || 189} <span className="text-[9px] font-normal text-emerald-500">part</span>
                  </div>
                </div>
                <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                  <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3" /> Garansi Aktif:
                  </div>
                  <div className="font-black text-emerald-700 text-sm mt-0.5">
                    {wimSummary?.total_warranty_items || 41} <span className="text-[9px] font-normal text-emerald-400">unit</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Mutasi: 268 Transaksi</span>
              <span className="font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Buka Dashboard WIM <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 3. PROJECT CCM */}
        <div
          onClick={() => navigate('/project-inventory?project=proj-ccm')}
          className="bg-white border border-slate-200/90 hover:border-amber-500 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
        >
          {/* Background Decoration — Strictly in Background (z-0), visible & beautiful without covering text */}
          <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none z-0 overflow-hidden rounded-tr-3xl">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-amber-100/70 via-amber-50/40 to-transparent transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -top-2 -right-2 w-20 h-20 rounded-full border border-amber-200/40 pointer-events-none" />
          </div>

          {/* Foreground Card Content (z-10) — 100% Unobscured Text */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 block sm:inline-block w-fit">
                      PROJECT CCM
                    </span>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">Port Terminal &amp; ROM</div>
                  </div>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] font-mono font-bold text-amber-700 bg-amber-50/90 border border-amber-200 px-2.5 py-1 rounded-full shadow-2xs">
                  Crusher Line
                </span>
              </div>

              <h3 className="font-bold text-amber-800 text-sm group-hover:text-amber-900 transition-colors">
                Coal Crushing &amp; Materials (CCM)
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Sistem peremukan batubara, crusher jaw &amp; cone, vibratory screen, motor conveyor drive, dan bearing sensor.
              </p>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100/60">
                  <div className="text-[10px] text-amber-700 font-mono font-semibold">Unit Mesin:</div>
                  <div className="font-extrabold text-amber-700 text-sm mt-0.5">
                    4 <span className="text-[9px] font-normal text-amber-500">aset</span>
                  </div>
                </div>
                <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                  <div className="text-[10px] text-amber-700 font-mono flex items-center gap-1 font-bold">
                    <Warehouse className="w-3 h-3" /> Gudang ROM:
                  </div>
                  <div className="font-black text-amber-700 text-sm mt-0.5">
                    2 <span className="text-[9px] font-normal text-amber-500">depot</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">8 Tahap: 2 Dokumen</span>
              <span className="font-bold text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Buka Workspace CCM <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
