import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderGit2,
  MapPin,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Info,
  ArrowRightLeft,
  ExternalLink,
  PackageCheck,
  Wrench,
  FileSpreadsheet,
  History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

export const DEFAULT_PROJECTS = [
  {
    id: 'proj-famous',
    code: 'FAMOUS',
    name: 'FAMOUS (Fatigue & Fleet Monitoring System)',
    description: 'Sistem pemantauan kelelahan operator (DMS/ADAS), kamera kabin MDVR, dan telemetri armada alat berat',
    site_location: 'BIB Pit Sebamban KM-24',
    color_theme: 'red'
  },
  {
    id: 'proj-wim',
    code: 'WIM',
    name: 'WIM (Weigh-In-Motion Scale System)',
    description: 'Sistem jembatan timbang dinamis otomatis, sensor load cell, dan instrumen kalibrasi muatan',
    site_location: 'BIB Pit Sebamban KM-14 & KM-28',
    color_theme: 'blue'
  },
  {
    id: 'proj-ccm',
    code: 'CCM',
    name: 'CCM (Condition & Coal Monitoring System)',
    description: 'Sistem pemantauan kualitas batubara, sensor conveyor belt, dan telemetri crusher pelabuhan',
    site_location: 'Port Bunati & ROM Stockpile',
    color_theme: 'emerald'
  }
];

/**
 * Deterministically resolves which project (proj-famous, proj-wim, proj-ccm)
 * a record belongs to based on explicit project_id, notes tag, or domain keywords.
 */
export function resolveRecordProjectId(record, fallbackIndex = 0) {
  if (!record) return 'proj-famous';

  // 1. Explicit project_id or project_code field
  const rawPid = record.project_id || record.projectId || record.project_code || record.projectCode;
  if (rawPid) {
    const low = String(rawPid).trim().toLowerCase();
    if (low === 'famous' || low === 'proj-famous') return 'proj-famous';
    if (low === 'wim' || low === 'proj-wim') return 'proj-wim';
    if (low === 'ccm' || low === 'proj-ccm') return 'proj-ccm';
    if (low.startsWith('proj-')) return low;
  }

  // 2. Check embedded [PROJECT:...] tag in notes or zone
  const combinedText = [
    record.notes,
    record.zone,
    record.item_name,
    record.tool_name,
    record.title,
    record.part_number,
    record.sku,
    record.serial_number,
    record.bin_location,
    record.rack,
    record.reference_doc_id,
    record.site,
    record.areaName,
    record.name
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  const tagMatch = combinedText.match(/\[PROJECT:(FAMOUS|WIM|CCM|PROJ-[A-Z0-9-]+)\]/i);
  if (tagMatch) {
    const t = tagMatch[1].toLowerCase();
    if (t === 'famous' || t === 'proj-famous') return 'proj-famous';
    if (t === 'wim' || t === 'proj-wim') return 'proj-wim';
    if (t === 'ccm' || t === 'proj-ccm') return 'proj-ccm';
    return t;
  }

  // 3. Domain keyword matching
  if (
    combinedText.includes('FAMOUS') ||
    combinedText.includes('FATIGUE') ||
    combinedText.includes('MDVR') ||
    combinedText.includes('ADAS') ||
    combinedText.includes('DMS') ||
    combinedText.includes('CAMERA') ||
    combinedText.includes('KAMERA') ||
    combinedText.includes('KM-24') ||
    combinedText.includes('ZONA A') ||
    combinedText.includes('R-A') ||
    combinedText.includes('777D') ||
    combinedText.includes('CAT-')
  ) {
    return 'proj-famous';
  }

  if (
    combinedText.includes('WIM') ||
    combinedText.includes('WEIGH') ||
    combinedText.includes('TIMBANGAN') ||
    combinedText.includes('LOAD CELL') ||
    combinedText.includes('LOADCELL') ||
    combinedText.includes('SENSOR') ||
    combinedText.includes('KALIBRASI') ||
    combinedText.includes('TORQUE') ||
    combinedText.includes('KM-14') ||
    combinedText.includes('KM-28') ||
    combinedText.includes('ZONA B') ||
    combinedText.includes('R-B') ||
    combinedText.includes('PC2000') ||
    combinedText.includes('KOM-')
  ) {
    return 'proj-wim';
  }

  if (
    combinedText.includes('CCM') ||
    combinedText.includes('CONVEYOR') ||
    combinedText.includes('CRUSHER') ||
    combinedText.includes('BUNATI') ||
    combinedText.includes('PORT') ||
    combinedText.includes('STOCKPILE') ||
    combinedText.includes('COAL') ||
    combinedText.includes('ZONA C') ||
    combinedText.includes('R-C') ||
    combinedText.includes('FMX') ||
    combinedText.includes('VOL-')
  ) {
    return 'proj-ccm';
  }

  // 4. Deterministic hash fallback based on id
  const idStr = String(record.id || record.opname_number || record.serial_number || fallbackIndex);
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0;
  }
  const pool = ['proj-famous', 'proj-wim', 'proj-ccm'];
  return pool[hash % pool.length];
}

export function getProjectCodeById(projectId) {
  const norm = String(projectId || '').toLowerCase();
  if (norm.includes('famous')) return 'FAMOUS';
  if (norm.includes('wim')) return 'WIM';
  if (norm.includes('ccm')) return 'CCM';
  return String(projectId || 'FAMOUS').replace(/^proj-/i, '').toUpperCase();
}

export function getProjectBadgeClasses(projectId) {
  const code = getProjectCodeById(projectId);
  if (code === 'FAMOUS') {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (code === 'WIM') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

/**
 * Custom hook to manage active project selection, project list, and access lock state
 */
export function useProjectWorkspace() {
  const { user, role, hasProjectAccess } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);

  // Load any dynamic projects from backend
  useEffect(() => {
    let mounted = true;
    api
      .get('/project-inventory/projects')
      .then((res) => {
        const list = res.data?.data || res.data;
        if (mounted && Array.isArray(list) && list.length > 0) {
          const merged = [...DEFAULT_PROJECTS];
          list.forEach((p) => {
            if (!merged.some((m) => m.id === p.id)) {
              merged.push(p);
            }
          });
          setProjects(merged);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const initialProj = useMemo(() => {
    const fromUrl = searchParams.get('project');
    if (fromUrl) return fromUrl;
    if (role === 'Superadmin') return 'proj-famous';
    const firstAllowed = ['proj-famous', 'proj-wim', 'proj-ccm'].find((pid) =>
      hasProjectAccess ? hasProjectAccess(pid) : true
    );
    return firstAllowed || 'proj-famous';
  }, []);

  const [selectedProjectId, setSelectedProjectIdState] = useState(initialProj);

  // Sync with URL ?project= parameter
  useEffect(() => {
    const projParam = searchParams.get('project');
    if (projParam && projParam !== selectedProjectId) {
      setSelectedProjectIdState(projParam);
    }
  }, [searchParams]);

  // Auto-switch if user switched role and current project is locked (unless explicit URL param)
  useEffect(() => {
    if (role === 'Superadmin') return;
    const projParam = searchParams.get('project');
    if (!projParam && hasProjectAccess && !hasProjectAccess(selectedProjectId)) {
      const firstAllowed = projects.find((p) => hasProjectAccess(p.id));
      if (firstAllowed) {
        setSelectedProjectIdState(firstAllowed.id);
      }
    }
  }, [role, user, hasProjectAccess, projects]);

  const setSelectedProjectId = (projId) => {
    setSelectedProjectIdState(projId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('project', projId);
    setSearchParams(nextParams, { replace: true });
  };

  const activeProject = useMemo(() => {
    return (
      projects.find((p) => p.id === selectedProjectId) ||
      DEFAULT_PROJECTS.find((p) => p.id === selectedProjectId) ||
      DEFAULT_PROJECTS[0]
    );
  }, [projects, selectedProjectId]);

  const isProjectLocked = (projId) => {
    if (role === 'Superadmin') return false;
    return hasProjectAccess ? !hasProjectAccess(projId) : false;
  };

  const isCurrentProjectLocked = isProjectLocked(selectedProjectId);

  return {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    activeProject,
    isProjectLocked,
    isCurrentProjectLocked
  };
}

const SLANT = '8px';
const CLIP_PARALLELOGRAM = `polygon(0 ${SLANT}, 100% 0, 100% calc(100% - ${SLANT}), 0 100%)`;

/**
 * Reusable Project Workspace Selector & Locked Access Guard
 */
export default function ProjectWorkspaceBanner({
  projects = DEFAULT_PROJECTS,
  selectedProjectId,
  onSelectProject,
  isProjectLocked,
  projectCounts = {},
  countUnitLabel = 'Data',
  moduleName = 'Modul Operasional',
  showModuleShortcuts = true
}) {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const activeProject =
    projects.find((p) => p.id === selectedProjectId) || DEFAULT_PROJECTS[0];

  return (
    <div className="space-y-3">
      {/* Top Bar: Active Project Indicator & Shortcut to Project Site */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
            <FolderGit2 className="w-4 h-4 text-red-600" />
            Indikator Workspace Project — {moduleName}
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            (Setiap project memiliki data terpisah sesuai hak otoritas)
          </span>
        </div>

        {showModuleShortcuts && !isProjectLocked(selectedProjectId) && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(`/project-inventory?project=${selectedProjectId}`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 text-[11px] font-bold transition cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3 h-3 text-red-600" />
              <span>Buka Gudang Project {activeProject.code}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3 Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          const locked = isProjectLocked ? isProjectLocked(proj.id) : false;
          const countVal = projectCounts[proj.id] ?? 0;

          return (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              style={{
                filter: isSelected
                  ? 'drop-shadow(0 10px 22px rgba(192,17,27,0.14))'
                  : 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))'
              }}
              className={`group relative transition-all duration-200 cursor-pointer ${
                isSelected ? '-translate-y-0.5' : 'hover:-translate-y-0.5'
              }`}
            >
              <div
                style={{ clipPath: CLIP_PARALLELOGRAM }}
                className={`relative z-10 w-full p-4 pt-4 pb-4 flex flex-col justify-between transition-all border-l-[5px] border-r ${
                  locked
                    ? isSelected
                      ? 'bg-rose-50/60 border-l-rose-600 border-r-rose-300'
                      : 'bg-slate-50/90 border-l-slate-400 border-r-slate-200 opacity-80 hover:opacity-100'
                    : isSelected
                    ? 'bg-gradient-to-r from-red-50/70 via-white to-white border-l-red-600 border-r-red-400 ring-1 ring-red-200'
                    : 'bg-white hover:bg-red-50/20 border-l-red-600/70 border-r-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black tracking-wider font-mono px-2.5 py-0.5 rounded-md transition-colors ${
                        locked
                          ? 'bg-slate-200 text-slate-600 border border-slate-300'
                          : isSelected
                          ? 'bg-red-600 text-white border border-red-600 shadow-2xs'
                          : 'bg-red-50 text-red-700 border border-red-200 group-hover:bg-red-600 group-hover:text-white'
                      }`}
                    >
                      {proj.code}
                    </span>

                    {locked ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-rose-600" />
                        Terkunci
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Akses Aktif
                      </span>
                    )}
                  </div>

                  {/* Count Pill (hidden if locked so unauthorized users cannot see internal metrics) */}
                  {!locked && (
                    <span className="text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {countVal} {countUnitLabel}
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <h3 className="text-sm font-black text-slate-900 truncate">
                    {proj.name?.replace(/^Project\s+/i, '')}
                  </h3>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      {proj.site_location || 'Site Operasional BIB'}
                    </span>
                    {isSelected && !locked && (
                      <span className="text-[10px] font-mono font-bold text-red-600 uppercase shrink-0">
                        &bull; Sedang Dibuka
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Locked Project Screen rendered when a user clicks a project they don't have access to
 */
export function LockedProjectScreen({
  activeProject,
  projects = DEFAULT_PROJECTS,
  onSelectProject,
  isProjectLocked,
  moduleName = 'Modul Operasional'
}) {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const allowedProjects = projects.filter((p) => !isProjectLocked(p.id));

  return (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-red-200/90 shadow-xl p-8 md:p-12 text-center max-w-3xl mx-auto my-4 animate-in fade-in duration-200">
      <div className="relative z-10 space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/30 text-white">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Akses Project Dibatasi
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {moduleName} — Project {activeProject?.code} Terkunci
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Akun Anda (<strong className="text-slate-800">{user?.full_name || 'User'}</strong> &bull;{' '}
            <span className="font-bold text-red-600">{role}</span>) hanya diberikan hak akses ke project tertentu dan{' '}
            <strong>tidak memiliki otoritas</strong> untuk melihat atau mengubah data <strong>{moduleName}</strong> pada{' '}
            <strong>{activeProject?.name || activeProject?.code}</strong>.
          </p>
        </div>

        <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-4 max-w-lg mx-auto text-left flex items-start gap-3">
          <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <p className="font-bold text-red-900">Isolasi Data Antar-Project</p>
            <p className="text-slate-600">
              Data Stock Opname, Tracking Tools, Laporan, dan Riwayat Mutasi Stok dipisahkan secara ketat per-project. Hubungi{' '}
              <strong>Superadmin</strong> melalui menu <strong>Kelola User &gt; Hak Akses Project</strong> jika Anda memerlukan akses ke project ini.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {allowedProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectProject(p.id)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs shadow-md shadow-red-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Buka Project {p.code} (Diizinkan)</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

