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
  Clock,
  Lock,
  FolderGit2,
  Wrench,
  Plus
} from 'lucide-react';
import { getProjects, getFamousSummary, getWimSummary } from '../../api/projectInventoryApi';
import { useAuth } from '../../context/AuthContext';

export default function ProjectWorkspacesBanner({ userRole = 'User', compact = false, activeFilter = 'ALL' }) {
  const navigate = useNavigate();
  const { role, hasProjectAccess } = useAuth();
  const effectiveRole = role || userRole;
  const isAdminOrSuperadmin = effectiveRole === 'Admin' || effectiveRole === 'Superadmin';

  const [projectsList, setProjectsList] = useState([]);
  const [famousSummary, setFamousSummary] = useState(null);
  const [wimSummary, setWimSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardProjectsData = async () => {
      try {
        setLoading(true);
        const [projRes, fSum, wSum] = await Promise.all([
          getProjects().catch(() => []),
          getFamousSummary().catch(() => null),
          getWimSummary().catch(() => null)
        ]);

        if (Array.isArray(projRes) && projRes.length > 0) {
          setProjectsList(projRes);
        } else {
          // Default fallback 3 core projects
          setProjectsList([
            { id: 'proj-famous', code: 'FAMOUS', name: 'Fleet Asset Management (FAMOUS)', site_location: 'Pit South & Workshop', color_theme: 'red' },
            { id: 'proj-wim', code: 'WIM', name: 'Weigh-In-Motion Scale (WIM)', site_location: 'Sebamban KM-14 & KM-28', color_theme: 'emerald' },
            { id: 'proj-ccm', code: 'CCM', name: 'Coal Crushing & Materials (CCM)', site_location: 'Port Terminal & ROM', color_theme: 'amber' }
          ]);
        }
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

  // Dynamic responsive grid scaling based on total project count
  const getGridClass = (count) => {
    if (compact) return 'grid grid-cols-1 gap-2.5';
    if (count <= 1) return 'grid grid-cols-1 max-w-xl mx-auto gap-4';
    if (count === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    if (count === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-4';
    if (count === 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
  };

  // Dynamic visual configurations per project
  const getProjectConfig = (proj, index) => {
    const code = (proj.code || '').toUpperCase();
    const pid = proj.id;

    if (code === 'FAMOUS' || pid === 'proj-famous') {
      return {
        borderHover: 'hover:border-red-500',
        bgGradient: 'from-red-100/70 via-red-50/40 to-transparent',
        borderRing: 'border-red-200/40',
        iconBg: 'bg-red-50 text-red-600',
        Icon: Truck,
        tagBg: 'text-red-600 bg-red-50 border-red-200',
        tagText: 'FAMOUS FLEET',
        subtitle: proj.site_location || 'Pit South & Workshop',
        statusBadge: 'text-emerald-700 bg-emerald-50/90 border-emerald-200',
        statusText: '825 Truk Optimal',
        titleColor: 'text-red-700 group-hover:text-red-800',
        title: 'Fleet Asset Management (FAMOUS)',
        description: proj.description || 'Telematika alat berat hauling batubara, GPS tracker presisi tinggi, DSM fatigue sensor, dan relokasi unit.',
        metric1Bg: 'bg-red-50/50 border-red-100/60',
        metric1Title: 'Hardware Real:',
        metric1TitleColor: 'text-red-600',
        metric1Value: famousSummary?.total_items ? Number(famousSummary.total_items).toLocaleString('id-ID') : '9.416',
        metric1Unit: 'unit',
        metric1ValColor: 'text-red-600',
        metric2Bg: 'bg-purple-50/70 border-purple-100',
        metric2Icon: ArrowRightLeft,
        metric2Title: 'Pindahan Ex-Unit:',
        metric2TitleColor: 'text-purple-700',
        metric2Value: famousSummary?.total_pindahan ? Number(famousSummary.total_pindahan).toLocaleString('id-ID') : '3.976',
        metric2Unit: 'part',
        metric2ValColor: 'text-purple-700',
        stageText: 'Dokumen #007 Aktif',
        ctaColor: 'text-red-600',
        ctaText: 'Buka Command Center'
      };
    }

    if (code === 'WIM' || pid === 'proj-wim') {
      return {
        borderHover: 'hover:border-emerald-500',
        bgGradient: 'from-emerald-100/70 via-emerald-50/40 to-transparent',
        borderRing: 'border-emerald-200/40',
        iconBg: 'bg-emerald-50 text-emerald-600',
        Icon: Scale,
        tagBg: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        tagText: 'PROJECT WIM',
        subtitle: proj.site_location || 'Sebamban KM-14 & KM-28',
        statusBadge: 'text-blue-700 bg-blue-50/90 border-blue-200',
        statusText: 'Lane 1 & 3 Aktif',
        titleColor: 'text-emerald-800 group-hover:text-emerald-900',
        title: 'Weigh-In-Motion Scale (WIM)',
        description: proj.description || 'Sensor jembatan timbang dinamis, load cell shear beam, mounting frame, ANPR kamera, dan katalog garansi.',
        metric1Bg: 'bg-emerald-50/50 border-emerald-100/60',
        metric1Title: 'Komponen Fisik:',
        metric1TitleColor: 'text-emerald-700',
        metric1Value: wimSummary?.total_components || 189,
        metric1Unit: 'part',
        metric1ValColor: 'text-emerald-700',
        metric2Bg: 'bg-emerald-50/70 border-emerald-100',
        metric2Icon: ShieldCheck,
        metric2Title: 'Garansi Aktif:',
        metric2TitleColor: 'text-emerald-700',
        metric2Value: wimSummary?.total_warranty_items || 41,
        metric2Unit: 'unit',
        metric2ValColor: 'text-emerald-700',
        stageText: 'Mutasi: 268 Transaksi',
        ctaColor: 'text-emerald-600',
        ctaText: 'Buka Dashboard WIM'
      };
    }

    if (code === 'CCM' || pid === 'proj-ccm') {
      return {
        borderHover: 'hover:border-amber-500',
        bgGradient: 'from-amber-100/70 via-amber-50/40 to-transparent',
        borderRing: 'border-amber-200/40',
        iconBg: 'bg-amber-50 text-amber-600',
        Icon: Cpu,
        tagBg: 'text-amber-700 bg-amber-50 border-amber-200',
        tagText: 'PROJECT CCM',
        subtitle: proj.site_location || 'Port Terminal & ROM',
        statusBadge: 'text-amber-700 bg-amber-50/90 border-amber-200',
        statusText: 'Crusher Line',
        titleColor: 'text-amber-800 group-hover:text-amber-900',
        title: 'Coal Crushing & Materials (CCM)',
        description: proj.description || 'Sistem peremukan batubara, crusher jaw & cone, vibratory screen, motor conveyor drive, dan bearing sensor.',
        metric1Bg: 'bg-amber-50/50 border-amber-100/60',
        metric1Title: 'Unit Mesin:',
        metric1TitleColor: 'text-amber-700',
        metric1Value: proj.stats?.total_items || 4,
        metric1Unit: 'aset',
        metric1ValColor: 'text-amber-700',
        metric2Bg: 'bg-amber-50/70 border-amber-100',
        metric2Icon: Warehouse,
        metric2Title: 'Gudang ROM:',
        metric2TitleColor: 'text-amber-700',
        metric2Value: proj.stats?.warehouses_count || 2,
        metric2Unit: 'depot',
        metric2ValColor: 'text-amber-700',
        stageText: '2 Dokumen Terverifikasi',
        ctaColor: 'text-amber-600',
        ctaText: 'Buka Workspace CCM'
      };
    }

    // Dynamic Palettes for ANY New Project Created
    const palettes = [
      {
        borderHover: 'hover:border-blue-500',
        bgGradient: 'from-blue-100/70 via-blue-50/40 to-transparent',
        borderRing: 'border-blue-200/40',
        iconBg: 'bg-blue-50 text-blue-600',
        Icon: FolderGit2,
        tagBg: 'text-blue-700 bg-blue-50 border-blue-200',
        titleColor: 'text-blue-800 group-hover:text-blue-900',
        metric1Bg: 'bg-blue-50/50 border-blue-100/60',
        metric1TitleColor: 'text-blue-700',
        metric1ValColor: 'text-blue-700',
        metric2Bg: 'bg-slate-50 border-slate-200',
        metric2TitleColor: 'text-slate-700',
        metric2ValColor: 'text-slate-800',
        ctaColor: 'text-blue-600'
      },
      {
        borderHover: 'hover:border-purple-500',
        bgGradient: 'from-purple-100/70 via-purple-50/40 to-transparent',
        borderRing: 'border-purple-200/40',
        iconBg: 'bg-purple-50 text-purple-600',
        Icon: Boxes,
        tagBg: 'text-purple-700 bg-purple-50 border-purple-200',
        titleColor: 'text-purple-800 group-hover:text-purple-900',
        metric1Bg: 'bg-purple-50/50 border-purple-100/60',
        metric1TitleColor: 'text-purple-700',
        metric1ValColor: 'text-purple-700',
        metric2Bg: 'bg-slate-50 border-slate-200',
        metric2TitleColor: 'text-slate-700',
        metric2ValColor: 'text-slate-800',
        ctaColor: 'text-purple-600'
      },
      {
        borderHover: 'hover:border-teal-500',
        bgGradient: 'from-teal-100/70 via-teal-50/40 to-transparent',
        borderRing: 'border-teal-200/40',
        iconBg: 'bg-teal-50 text-teal-600',
        Icon: Wrench,
        tagBg: 'text-teal-700 bg-teal-50 border-teal-200',
        titleColor: 'text-teal-800 group-hover:text-teal-900',
        metric1Bg: 'bg-teal-50/50 border-teal-100/60',
        metric1TitleColor: 'text-teal-700',
        metric1ValColor: 'text-teal-700',
        metric2Bg: 'bg-slate-50 border-slate-200',
        metric2TitleColor: 'text-slate-700',
        metric2ValColor: 'text-slate-800',
        ctaColor: 'text-teal-600'
      }
    ];

    const pal = palettes[index % palettes.length];
    return {
      ...pal,
      tagText: `PROJECT ${proj.code}`,
      subtitle: proj.site_location || 'Site Tambang Digitech',
      statusBadge: 'text-slate-700 bg-slate-50 border-slate-200',
      statusText: `${proj.stats?.warehouses_count || 1} Gudang Aktif`,
      title: proj.name?.replace(/^Project\s+/i, '') || proj.name,
      description: proj.description || 'Pusat operasional inventaris, pencatatan material site, dan alur mutasi aset.',
      metric1Title: 'Total Part:',
      metric1Value: proj.stats?.total_items || 0,
      metric1Unit: 'unit',
      metric2Icon: Warehouse,
      metric2Title: 'Terpasang:',
      metric2Value: proj.stats?.installed_count || 0,
      metric2Unit: 'unit',
      stageText: 'Dokumen MOS Aktif',
      ctaText: `Buka Workspace ${proj.code}`
    };
  };

  const displayedProjects = (activeFilter && activeFilter !== 'ALL')
    ? projectsList.filter(p => (p.code || '').toUpperCase() === activeFilter.toUpperCase())
    : projectsList;

  return (
    <div className="space-y-3">
      {/* ── Dynamic Interactive Project Workspace Cards Grid ── */}
      <div className={getGridClass(displayedProjects.length)}>
        {displayedProjects.map((proj, idx) => {
          const cfg = getProjectConfig(proj, idx);
          const Icon = cfg.Icon;
          const Metric2Icon = cfg.metric2Icon;
          const isProjLocked = effectiveRole !== 'Superadmin' && (hasProjectAccess ? !hasProjectAccess(proj.id) : false);

          if (compact) {
            return (
              <div
                key={proj.id}
                onClick={() => navigate(`/project-inventory?project=${proj.id}`)}
                className={`bg-white border border-slate-200/90 ${cfg.borderHover} rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg ${cfg.iconBg} flex items-center justify-center font-bold shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[9px] font-mono font-bold ${cfg.tagBg} px-1.5 py-0.5 rounded border block w-fit`}>
                        {cfg.tagText}
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {cfg.subtitle}
                      </div>
                    </div>
                  </div>

                  {isProjLocked ? (
                    <span className="shrink-0 text-[9.5px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 text-rose-600" /> Terkunci
                    </span>
                  ) : (
                    <span className={`shrink-0 text-[9.5px] font-mono font-bold ${cfg.statusBadge} px-2 py-0.5 rounded-full`}>
                      {cfg.statusText}
                    </span>
                  )}
                </div>

                <h3 className={`font-bold text-xs ${cfg.titleColor} truncate mb-2`}>
                  {cfg.title}
                </h3>

                {/* Scaled-down Quick Metrics (2 Columns matching desktop) */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className={`${cfg.metric1Bg} p-1.5 rounded-lg border`}>
                    <div className={`text-[9px] ${cfg.metric1TitleColor} font-mono font-semibold`}>
                      {cfg.metric1Title}
                    </div>
                    <div className={`font-black ${cfg.metric1ValColor} text-xs mt-0.5`}>
                      {cfg.metric1Value} <span className="text-[8.5px] font-normal opacity-80">{cfg.metric1Unit}</span>
                    </div>
                  </div>
                  <div className={`${cfg.metric2Bg} p-1.5 rounded-lg border`}>
                    <div className={`text-[9px] ${cfg.metric2TitleColor} font-mono flex items-center gap-1 font-bold`}>
                      {Metric2Icon && <Metric2Icon className="w-2.5 h-2.5" />} {cfg.metric2Title}
                    </div>
                    <div className={`font-black ${cfg.metric2ValColor} text-xs mt-0.5`}>
                      {cfg.metric2Value} <span className="text-[8.5px] font-normal opacity-80">{cfg.metric2Unit}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with action */}
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-mono text-[9.5px]">
                    {cfg.stageText}
                  </span>
                  {isProjLocked ? (
                    <span className="font-bold text-rose-600 flex items-center gap-0.5 text-[9.5px]">
                      <Lock className="w-3 h-3" /> Butuh Otoritas
                    </span>
                  ) : (
                    <span className={`font-bold ${cfg.ctaColor} flex items-center gap-0.5 text-[10px]`}>
                      {cfg.ctaText} <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          }

          // Full Desktop Rendering
          return (
            <div
              key={proj.id}
              onClick={() => navigate(`/project-inventory?project=${proj.id}`)}
              className={`bg-white border border-slate-200/90 ${cfg.borderHover} rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between`}
            >
              {/* Background Decoration — Strictly in Background (z-0) */}
              <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none z-0 overflow-hidden rounded-tr-3xl">
                <div className={`absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br ${cfg.bgGradient} transition-transform duration-500 group-hover:scale-110`} />
                <div className={`absolute -top-2 -right-2 w-20 h-20 rounded-full border ${cfg.borderRing} pointer-events-none`} />
              </div>

              {/* Foreground Card Content (z-10) */}
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 pr-1">
                      <div className={`w-9 h-9 rounded-xl ${cfg.iconBg} flex items-center justify-center font-bold shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[10px] font-mono font-bold ${cfg.tagBg} px-2 py-0.5 rounded-md border block sm:inline-block w-fit`}>
                          {cfg.tagText}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          {cfg.subtitle}
                        </div>
                      </div>
                    </div>

                    {isProjLocked ? (
                      <span className="shrink-0 whitespace-nowrap text-[11px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1">
                        <Lock className="w-3 h-3 text-rose-600" /> Terkunci
                      </span>
                    ) : (
                      <span className={`shrink-0 whitespace-nowrap text-[11px] font-mono font-bold ${cfg.statusBadge} px-2.5 py-1 rounded-full shadow-2xs`}>
                        {cfg.statusText}
                      </span>
                    )}
                  </div>

                  <h3 className={`font-bold text-sm ${cfg.titleColor} transition-colors line-clamp-1`}>
                    {cfg.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {cfg.description}
                  </p>

                  {/* Quick Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className={`${cfg.metric1Bg} p-2 rounded-xl border`}>
                      <div className={`text-[10px] ${cfg.metric1TitleColor} font-mono font-semibold`}>
                        {cfg.metric1Title}
                      </div>
                      <div className={`font-extrabold ${cfg.metric1ValColor} text-sm mt-0.5`}>
                        {cfg.metric1Value} <span className="text-[9px] font-normal opacity-80">{cfg.metric1Unit}</span>
                      </div>
                    </div>
                    <div className={`${cfg.metric2Bg} p-2 rounded-xl border`}>
                      <div className={`text-[10px] ${cfg.metric2TitleColor} font-mono flex items-center gap-1 font-bold`}>
                        {Metric2Icon && <Metric2Icon className="w-3 h-3" />} {cfg.metric2Title}
                      </div>
                      <div className={`font-black ${cfg.metric2ValColor} text-sm mt-0.5`}>
                        {cfg.metric2Value} <span className="text-[9px] font-normal opacity-80">{cfg.metric2Unit}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    {cfg.stageText}
                  </span>
                  {isProjLocked ? (
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Butuh Otoritas Superadmin
                    </span>
                  ) : (
                    <span className={`font-bold ${cfg.ctaColor} group-hover:translate-x-1 transition-transform flex items-center gap-1`}>
                      {cfg.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
