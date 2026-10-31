import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Trash2,
  Edit2,
  Mail,
  Building2,
  Phone,
  LayoutGrid,
  List,
  MapPin,
  Shield,
  SlidersHorizontal,
  Timer,
  KeyRound,
  Sparkles,
  Lock,
  Check,
  Truck,
  Scale,
  Cpu,
  FolderGit2,
  AlertTriangle,
  Save,
  RotateCcw,
  CheckSquare,
  Square,
  Unlock,
  Boxes,
  Layers,
  HardHat,
  X,
  Loader2
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  getProjects,
  getProjectAuthorities,
  updateUserProjectAuthority
} from '../api/projectInventoryApi.js';

// Dynamic Visual & Theme Mapper for Projects
const getProjectVisual = (proj, index = 0) => {
  const code = (proj?.code || '').toUpperCase();
  const theme = (proj?.color_theme || '').toLowerCase();

  if (code === 'FAMOUS' || theme === 'blue') {
    return {
      icon: Truck,
      color: 'blue',
      borderClass: 'border-blue-200',
      bgLightClass: 'bg-blue-50',
      textAccentClass: 'text-blue-600',
      textTitleClass: 'text-blue-700',
      textNumberClass: 'text-blue-900',
      pillClass: 'bg-blue-100 text-blue-800 border-blue-200',
      activeBorderClass: 'border-blue-300 bg-blue-50/50 hover:bg-blue-50',
      activePillClass: 'bg-blue-600 text-white',
    };
  }
  if (code === 'WIM' || theme === 'emerald' || theme === 'green') {
    return {
      icon: Scale,
      color: 'emerald',
      borderClass: 'border-emerald-200',
      bgLightClass: 'bg-emerald-50',
      textAccentClass: 'text-emerald-600',
      textTitleClass: 'text-emerald-700',
      textNumberClass: 'text-emerald-900',
      pillClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      activeBorderClass: 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50',
      activePillClass: 'bg-emerald-600 text-white',
    };
  }
  if (code === 'CCM' || theme === 'amber' || theme === 'orange') {
    return {
      icon: Cpu,
      color: 'amber',
      borderClass: 'border-amber-200',
      bgLightClass: 'bg-amber-50',
      textAccentClass: 'text-amber-600',
      textTitleClass: 'text-amber-700',
      textNumberClass: 'text-amber-900',
      pillClass: 'bg-amber-100 text-amber-800 border-amber-200',
      activeBorderClass: 'border-amber-300 bg-amber-50/50 hover:bg-amber-50',
      activePillClass: 'bg-amber-600 text-white',
    };
  }

  // Fallback palette cycling for any new projects added to DB
  const dynamicPalettes = [
    {
      icon: Layers,
      color: 'indigo',
      borderClass: 'border-indigo-200',
      bgLightClass: 'bg-indigo-50',
      textAccentClass: 'text-indigo-600',
      textTitleClass: 'text-indigo-700',
      textNumberClass: 'text-indigo-900',
      pillClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      activeBorderClass: 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50',
      activePillClass: 'bg-indigo-600 text-white',
    },
    {
      icon: Boxes,
      color: 'teal',
      borderClass: 'border-teal-200',
      bgLightClass: 'bg-teal-50',
      textAccentClass: 'text-teal-600',
      textTitleClass: 'text-teal-700',
      textNumberClass: 'text-teal-900',
      pillClass: 'bg-teal-100 text-teal-800 border-teal-200',
      activeBorderClass: 'border-teal-300 bg-teal-50/50 hover:bg-teal-50',
      activePillClass: 'bg-teal-600 text-white',
    },
    {
      icon: HardHat,
      color: 'purple',
      borderClass: 'border-purple-200',
      bgLightClass: 'bg-purple-50',
      textAccentClass: 'text-purple-600',
      textTitleClass: 'text-purple-700',
      textNumberClass: 'text-purple-900',
      pillClass: 'bg-purple-100 text-purple-800 border-purple-200',
      activeBorderClass: 'border-purple-300 bg-purple-50/50 hover:bg-purple-50',
      activePillClass: 'bg-purple-600 text-white',
    },
    {
      icon: FolderGit2,
      color: 'rose',
      borderClass: 'border-rose-200',
      bgLightClass: 'bg-rose-50',
      textAccentClass: 'text-rose-600',
      textTitleClass: 'text-rose-700',
      textNumberClass: 'text-rose-900',
      pillClass: 'bg-rose-100 text-rose-800 border-rose-200',
      activeBorderClass: 'border-rose-300 bg-rose-50/50 hover:bg-rose-50',
      activePillClass: 'bg-rose-600 text-white',
    }
  ];

  return dynamicPalettes[index % dynamicPalettes.length];
};

export default function UsersPage() {
  const { user, role, isSuperadmin, session } = useAuth();
  const { addToast } = useToast();

  // Strict Superadmin-only guard: prevent User and Admin from accessing
  if (!isSuperadmin && role !== 'Superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'pending'); // 'pending' | 'active' | 'authorities' | 'security'
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedRoleForApproval, setSelectedRoleForApproval] = useState({});
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToToggle, setUserToToggle] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Sync activeTab when query param ?tab= changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['pending', 'active', 'authorities', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Project Authorities State
  const {
    data: authoritiesData,
    isLoading: loadingAuthorities,
    refetch: refetchAuthorities
  } = useQuery({
    queryKey: ['project-authorities'],
    queryFn: getProjectAuthorities,
    enabled: isSuperadmin
  });

  // Project Workspaces State for dynamic projects
  const { data: projectsFromApi, refetch: refetchProjects } = useQuery({
    queryKey: ['project-workspaces-list'],
    queryFn: getProjects,
    enabled: isSuperadmin
  });

  // Dynamic Projects List from backend API (Supabase / local DB)
  const dynamicProjects = React.useMemo(() => {
    if (Array.isArray(authoritiesData?.projects) && authoritiesData.projects.length > 0) {
      return authoritiesData.projects;
    }
    if (Array.isArray(projectsFromApi) && projectsFromApi.length > 0) {
      return projectsFromApi;
    }
    return [
      {
        id: 'proj-famous',
        code: 'FAMOUS',
        name: 'Fleet Asset Management (FAMOUS)',
        description: 'Telematika alat berat, GPS tracker, MDVR, fleet matrix',
        site_location: 'Pit South BIB & Workshop Utama',
        color_theme: 'blue'
      },
      {
        id: 'proj-wim',
        code: 'WIM',
        name: 'Weigh-In-Motion Scale (WIM)',
        description: 'Jembatan timbang dinamis, load cell, kalibrasi QC',
        site_location: 'BIB Pit Sebamban KM-14 & KM-28',
        color_theme: 'emerald'
      },
      {
        id: 'proj-ccm',
        code: 'CCM',
        name: 'Coal Crushing & Processing (CCM)',
        description: 'Crusher plant ROM, conveyor belt weigher, motor drive',
        site_location: 'Port Terminal Sebamban & ROM Stockpile',
        color_theme: 'amber'
      }
    ];
  }, [authoritiesData?.projects, projectsFromApi]);

  const [authorityDrafts, setAuthorityDrafts] = useState({});
  const [savingAuthorityUserId, setSavingAuthorityUserId] = useState(null);
  const [savingAuthorityCell, setSavingAuthorityCell] = useState(null);
  const [authoritiesViewMode, setAuthoritiesViewMode] = useState('table'); // 'table' (default) | 'grid'
  const [authorityRoleFilter, setAuthorityRoleFilter] = useState('ALL'); // 'ALL' | 'Admin' | 'User'
  const [authorityProjectFilter, setAuthorityProjectFilter] = useState('ALL'); // 'ALL' | dynamic project IDs | 'NONE'
  const [authoritySearch, setAuthoritySearch] = useState('');

  // Sync authority drafts when data loads
  useEffect(() => {
    if (authoritiesData?.users) {
      const drafts = {};
      authoritiesData.users.forEach(u => {
        drafts[u.id] = [...(u.allowed_projects || [])];
      });
      setAuthorityDrafts(drafts);
    }
  }, [authoritiesData]);

  // Instant project toggle per cell directly in the table
  const handleToggleProjectInstant = async (targetUser, projId) => {
    if (targetUser.role === 'Superadmin') return;
    const current = authorityDrafts[targetUser.id] || targetUser.allowed_projects || [];
    const isAllowed = current.includes(projId);
    const updated = isAllowed ? current.filter(p => p !== projId) : [...current, projId];

    setAuthorityDrafts(prev => ({ ...prev, [targetUser.id]: updated }));
    setSavingAuthorityCell(`${targetUser.id}-${projId}`);

    const projObj = dynamicProjects.find(p => p.id === projId);
    const projName = projObj?.code || projObj?.name || 'Proyek';

    try {
      await updateUserProjectAuthority(targetUser.id, updated);
      addToast(`Akses ${projName} untuk ${targetUser.full_name} berhasil ${isAllowed ? 'dicabut' : 'diizinkan'}.`, 'success');
      await refetchAuthorities();
      refetch();
    } catch (err) {
      setAuthorityDrafts(prev => ({ ...prev, [targetUser.id]: current }));
      addToast(err.response?.data?.error?.message || err.message || 'Gagal memperbarui otoritas project.', 'error');
    } finally {
      setSavingAuthorityCell(null);
    }
  };

  const handleGrantAllInstant = async (targetUser) => {
    if (targetUser.role === 'Superadmin') return;
    const allIds = dynamicProjects.map(p => p.id);
    setAuthorityDrafts(prev => ({ ...prev, [targetUser.id]: allIds }));
    setSavingAuthorityUserId(targetUser.id);
    try {
      await updateUserProjectAuthority(targetUser.id, allIds);
      addToast(`Seluruh akses proyek berhasil diberikan untuk ${targetUser.full_name}.`, 'success');
      await refetchAuthorities();
      refetch();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal memberikan akses proyek.', 'error');
    } finally {
      setSavingAuthorityUserId(null);
    }
  };

  const handleRevokeAllInstant = async (targetUser) => {
    if (targetUser.role === 'Superadmin') return;
    setAuthorityDrafts(prev => ({ ...prev, [targetUser.id]: [] }));
    setSavingAuthorityUserId(targetUser.id);
    try {
      await updateUserProjectAuthority(targetUser.id, []);
      addToast(`Seluruh akses proyek dicabut untuk ${targetUser.full_name}.`, 'info');
      await refetchAuthorities();
      refetch();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal mencabut akses proyek.', 'error');
    } finally {
      setSavingAuthorityUserId(null);
    }
  };

  const handleToggleProject = (userId, projId) => {
    setAuthorityDrafts(prev => {
      const current = prev[userId] || [];
      const has = current.includes(projId);
      const updated = has ? current.filter(p => p !== projId) : [...current, projId];
      return { ...prev, [userId]: updated };
    });
  };

  const handleGrantAllProjects = (userId) => {
    setAuthorityDrafts(prev => ({
      ...prev,
      [userId]: dynamicProjects.map(p => p.id)
    }));
  };

  const handleRevokeAllProjects = (userId) => {
    setAuthorityDrafts(prev => ({
      ...prev,
      [userId]: []
    }));
  };

  const handleSaveUserAuthority = async (targetUser) => {
    const newAllowed = authorityDrafts[targetUser.id] || [];
    setSavingAuthorityUserId(targetUser.id);
    try {
      await updateUserProjectAuthority(targetUser.id, newAllowed);
      addToast(`Hak otoritas project untuk ${targetUser.full_name} berhasil disimpan!`, 'success');
      await refetchAuthorities();
      refetch();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal menyimpan otoritas project.', 'error');
    } finally {
      setSavingAuthorityUserId(null);
    }
  };

  // Superadmin JWT Session Duration State
  const [sessionDuration, setSessionDuration] = useState(8);
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [sessionConfigSaving, setSessionConfigSaving] = useState(false);
  const [sessionConfigMeta, setSessionConfigMeta] = useState(null);
  const [sessionSaveMsg, setSessionSaveMsg] = useState(null);
  const [remainingTimeStr, setRemainingTimeStr] = useState('');

  // Superadmin Confidential Audit Sinkronisasi Email State
  const [showEditAuditModal, setShowEditAuditModal] = useState(false);
  const [editAuditEmail, setEditAuditEmail] = useState('');
  const [savingAuditEmail, setSavingAuditEmail] = useState(false);

  const handleSaveAuditEmail = async (e) => {
    e?.preventDefault();
    if (!editAuditEmail || !editAuditEmail.includes('@')) {
      addToast('Masukkan format email audit yang valid.', 'error');
      return;
    }

    setSavingAuditEmail(true);
    try {
      const res = await api.put('/auth/session-config', {
        durationHours: sessionDuration,
        updatedBy: editAuditEmail.trim()
      });
      if (res.data?.data) {
        setSessionConfigMeta(res.data.data);
      }
      addToast(`Email audit sinkronisasi confidential berhasil disinkronkan ke Redis & PostgreSQL: ${editAuditEmail.trim()}`, 'success');
      setShowEditAuditModal(false);
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal memperbarui email audit sinkronisasi.', 'error');
    } finally {
      setSavingAuditEmail(false);
    }
  };

  // Live countdown timer for active user session
  useEffect(() => {
    if (!session?.expires_at) return;
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Number(session.expires_at) - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setRemainingTimeStr(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session?.expires_at]);

  // Load session duration config from backend
  useEffect(() => {
    async function loadSessionConfig() {
      try {
        const res = await api.get('/auth/session-config');
        if (res.data?.data) {
          const cfg = res.data.data;
          setSessionDuration(cfg.durationHours || 8);
          setSessionConfigMeta(cfg);
        }
      } catch (err) {
        console.warn('Gagal memuat konfigurasi durasi sesi:', err);
      }
    }
    loadSessionConfig();
  }, []);

  const handleSaveSessionDuration = async (hoursToSave) => {
    const val = parseFloat(hoursToSave);
    if (isNaN(val) || val < 0.25 || val > 72) {
      setSessionSaveMsg({ type: 'error', text: 'Durasi sesi harus berupa angka antara 0.25 jam (15 menit) hingga 72 jam.' });
      return;
    }

    setSessionConfigSaving(true);
    setSessionSaveMsg(null);
    try {
      const res = await api.put('/auth/session-config', { durationHours: val });
      setSessionDuration(val);
      setSessionConfigMeta(res.data?.data);
      setSessionSaveMsg({
        type: 'success',
        text: `Kebijakan masa berlaku sesi login sistem berhasil diset ke ${val} Jam (${Math.round(val * 60)} Menit). Sesi pengguna yang habis waktu akan otomatis auto kick-out.`
      });
      setTimeout(() => setSessionSaveMsg(null), 5000);
    } catch (err) {
      setSessionSaveMsg({
        type: 'error',
        text: err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menyimpan kebijakan sesi.'
      });
    } finally {
      setSessionConfigSaving(false);
    }
  };

  if (!isSuperadmin) return <Navigate to="/dashboard" replace />;

  const { data: usersData, refetch, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const res = await api.get('/users');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  const users = usersData || [];
  const pendingUsers = users.filter(u => u.is_approved === false);
  const activeUsers = users.filter(u => u.is_approved !== false);

  const displayList = (activeTab === 'pending' ? pendingUsers : activeUsers).filter(u => {
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.company?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
    );
  });

  const handleApprove = async (userId) => {
    const assignedRole = selectedRoleForApproval[userId] || 'User';
    try {
      await api.put(`/users/${userId}/approve`, { role: assignedRole });
      addToast(`Akun pengguna berhasil diaktifkan dengan role ${assignedRole}. Notifikasi email telah dikirim.`, 'success');
      refetch();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal mengaktifkan akun.', 'error');
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('Apakah Anda yakin ingin menolak dan menghapus pendaftaran pengguna ini?')) return;
    try {
      await api.put(`/users/${userId}/reject`, { notes: 'Data tidak sesuai verifikasi pengawas site' });
      addToast('Pendaftaran akun ditolak.', 'info');
      refetch();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal menolak akun.', 'error');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      addToast(`Role pengguna berhasil diubah menjadi ${newRole}.`, 'success');
      refetch();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal mengubah role.', 'error');
    }
  };

  const handleToggleStatus = async () => {
    if (!userToToggle) return;
    if (userToToggle.id === user?.id) {
      addToast('Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.', 'error');
      setUserToToggle(null);
      return;
    }

    const nextStatus = userToToggle.is_active === false;
    setIsProcessingAction(true);
    try {
      await api.put(`/users/${userToToggle.id}/status`, { is_active: nextStatus });
      addToast(
        `Akun ${userToToggle.full_name} berhasil ${nextStatus ? 'diaktifkan kembali' : 'dinonaktifkan'}.`,
        nextStatus ? 'success' : 'info'
      );
      setUserToToggle(null);
      refetch();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal mengubah status pengguna.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === user?.id) {
      addToast('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.', 'error');
      setUserToDelete(null);
      return;
    }

    setIsProcessingAction(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      addToast(`Pengguna ${userToDelete.full_name} (${userToDelete.email}) berhasil dihapus dari sistem.`, 'success');
      setUserToDelete(null);
      refetch();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal menghapus pengguna.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans select-none animate-in fade-in duration-200">
      
      {/* ── Header ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0 pr-0 sm:pr-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            <span>Khusus Superadmin Otoritas Sistem</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Pengguna &amp; Keamanan Web
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Otorisasi aktivasi pengguna, penetapan wewenang role, dan konfigurasi kebijakan keamanan token sesi (JWT).
          </p>
        </div>

        {/* 4 Tabs: Antrean, Pengguna Aktif, Hak Otoritas Project, Keamanan Sistem & JWT — Pushed to right edge */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold ml-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pending');
              setSearchParams({ tab: 'pending' });
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-red-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Antrean ({pendingUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('active');
              setSearchParams({ tab: 'active' });
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-red-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Pengguna ({activeUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('authorities');
              setSearchParams({ tab: 'authorities' });
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'authorities'
                ? 'bg-white text-red-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-red-600" />
            <span>Hak Otoritas Project</span>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'authorities' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-200 text-slate-700'
            }`}>
              {dynamicProjects.length > 0 ? `${dynamicProjects.length} Proyek` : 'Multi-Proyek'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setSearchParams({ tab: 'security' });
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Keamanan Sesi</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1 & 2: DAFTAR PENGGUNA (PENDING / AKTIF) ── */}
      {(activeTab === 'pending' || activeTab === 'active') && (
        <div className="space-y-4">
          {/* Search Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan nama, email, perusahaan..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl border transition ${viewMode === 'grid' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl border transition ${viewMode === 'table' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Cards Grid */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayList.map((u) => (
                <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{u.full_name}</h4>
                        <span className="text-[11px] font-mono text-slate-500">{u.email}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        u.is_approved === false
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : u.is_active !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {u.is_approved === false ? 'PENDING' : u.is_active !== false ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.company || 'DIGITECH'} &bull; {u.department || 'Operasional Site'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.phone || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    {activeTab === 'pending' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Tetapkan Role:</label>
                          <select
                            value={selectedRoleForApproval[u.id] || 'User'}
                            onChange={(e) => setSelectedRoleForApproval({ ...selectedRoleForApproval, [u.id]: e.target.value })}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800"
                          >
                            <option value="User">User (Teknisi)</option>
                            <option value="Admin">Admin Logistik</option>
                            <option value="Superadmin">Superadmin</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReject(u.id)}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(u.id)}
                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            Setujui &amp; Aktifkan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Role:</span>
                            <span className="font-mono text-xs font-bold text-red-600">{u.role}</span>
                          </div>
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            className="text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold cursor-pointer outline-none focus:border-red-500"
                          >
                            <option value="User">Ubah ke User</option>
                            <option value="Admin">Ubah ke Admin</option>
                            <option value="Superadmin">Ubah ke Superadmin</option>
                          </select>
                        </div>

                        {/* Operational Actions: Nonaktifkan / Aktifkan & Hapus User */}
                        <div className="flex items-center gap-2 pt-0.5">
                          {u.id === user?.id ? (
                            <span className="text-[11px] text-slate-400 font-mono italic py-1">
                              (Akun Anda Saat Ini)
                            </span>
                          ) : (
                            <>
                              {/* Toggle Status (Nonaktifkan / Aktifkan) */}
                              <button
                                type="button"
                                onClick={() => setUserToToggle(u)}
                                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                                  u.is_active !== false
                                    ? 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-200 hover:border-amber-300'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                                }`}
                                title={u.is_active !== false ? 'Nonaktifkan akun pengguna ini' : 'Aktifkan kembali akun ini'}
                              >
                                {u.is_active !== false ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Nonaktifkan</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Aktifkan</span>
                                  </>
                                )}
                              </button>

                              {/* Hapus User */}
                              <button
                                type="button"
                                onClick={() => setUserToDelete(u)}
                                className="py-1.5 px-3 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Hapus pengguna dari sistem"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                <span>Hapus</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                    <th className="px-4 py-3 text-left">Nama Lengkap &amp; Email</th>
                    <th className="px-4 py-3 text-left">Mitra Perusahaan</th>
                    <th className="px-4 py-3 text-left">Departemen</th>
                    <th className="px-4 py-3 text-left">Role Akses</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{u.company || 'DIGITECH'}</td>
                      <td className="px-4 py-3 text-slate-600">{u.department || 'Operasional'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-red-600">{u.role}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          u.is_approved === false
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : u.is_active !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {u.is_approved === false ? 'Pending' : u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {activeTab === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReject(u.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Tolak
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(u.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Aktifkan
                            </button>
                          </div>
                        ) : u.id === user?.id ? (
                          <span className="text-[11px] text-slate-400 font-mono italic">Akun Anda</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              className="text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold cursor-pointer outline-none focus:border-red-500"
                            >
                              <option value="User">User</option>
                              <option value="Admin">Admin</option>
                              <option value="Superadmin">Superadmin</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => setUserToToggle(u)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                u.is_active !== false
                                  ? 'bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border-slate-200 hover:border-amber-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                              }`}
                              title={u.is_active !== false ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
                            >
                              {u.is_active !== false ? (
                                <UserX className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition cursor-pointer"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: HAK OTORITAS PROJECT WEB (WIM, FAMOUS, CCM) ── */}
      {activeTab === 'authorities' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Executive Overview Banner */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                <span>Otoritas Khusus Superadmin</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-red-600" />
                <span>Matriks Hak Otoritas Akses Proyek</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 ml-1">
                  {dynamicProjects.length} Proyek Terdaftar
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-4xl leading-relaxed">
                Superadmin memegang kendali penuh wewenang akses database setiap proyek. Akun personel dengan role <strong>Admin</strong> atau <strong>User</strong> hanya dapat membuka inventaris pada proyek site yang telah diizinkan.
              </p>
            </div>
          </div>

          {/* Metric KPI Cards (Dynamic for all database projects) */}
          {(() => {
            const authUsers = authoritiesData?.users || [];
            const totalUsers = authUsers.length;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Personel</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{totalUsers} <span className="text-xs font-normal text-slate-500">Akun</span></div>
                    <div className="text-[10px] text-slate-400">Terdaftar di sistem</div>
                  </div>
                </div>

                {dynamicProjects.map((proj, idx) => {
                  const visual = getProjectVisual(proj, idx);
                  const IconComp = visual.icon;
                  const count = authUsers.filter(u =>
                    u.role === 'Superadmin' ||
                    (authorityDrafts[u.id] || u.allowed_projects || []).includes(proj.id)
                  ).length;

                  return (
                    <div
                      key={proj.id}
                      className={`bg-white rounded-2xl p-4 border ${visual.borderClass} shadow-2xs flex items-center gap-3`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${visual.bgLightClass} ${visual.textAccentClass} flex items-center justify-center shrink-0`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-[11px] font-bold ${visual.textTitleClass} uppercase tracking-wider truncate`}>
                          Otoritas {proj.code || proj.name}
                        </div>
                        <div className={`text-2xl font-black ${visual.textNumberClass} mt-0.5`}>
                          {count} <span className="text-xs font-normal opacity-70">Personel</span>
                        </div>
                        <div className={`text-[10px] ${visual.textAccentClass} truncate`}>
                          {proj.site_location || proj.description || 'Akses Operasional'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Search, Filter Toolbar & Quick Actions */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={authoritySearch}
                onChange={(e) => setAuthoritySearch(e.target.value)}
                placeholder="Cari nama personel, email, divisi, departemen..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role Filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                {['ALL', 'Admin', 'User'].map((rf) => (
                  <button
                    key={rf}
                    type="button"
                    onClick={() => setAuthorityRoleFilter(rf)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      authorityRoleFilter === rf
                        ? 'bg-white text-slate-900 shadow-2xs font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {rf === 'ALL' ? 'Semua Role' : rf}
                  </button>
                ))}
              </div>

              {/* Project Access Filter */}
              <select
                value={authorityProjectFilter}
                onChange={(e) => setAuthorityProjectFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                <option value="ALL">Semua Proyek</option>
                {dynamicProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    Hanya Akses {p.code || p.name}
                  </option>
                ))}
                <option value="NONE">Belum Ada Akses</option>
              </select>

              {/* View Mode Switcher (List / Table vs Grid) */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setAuthoritiesViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    authoritiesViewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan List / Tabel Hak Akses"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List / Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthoritiesViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    authoritiesViewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Kartu Personel"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  refetchAuthorities();
                  refetchProjects();
                }}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                title="Segarkan data otoritas dan proyek"
              >
                <RotateCcw className={`w-4 h-4 ${loadingAuthorities ? 'animate-spin text-red-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* User Project Authority View (Table / List or Grid) */}
          {loadingAuthorities ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-medium border border-slate-200">
              <RotateCcw className="w-8 h-8 animate-spin mx-auto text-red-600 mb-3" />
              Memuat konfigurasi hak otoritas proyek...
            </div>
          ) : (
            (() => {
              const rawUsers = authoritiesData?.users || [];
              const allProjIds = dynamicProjects.map(p => p.id);
              const filteredUsers = rawUsers.filter(u => {
                const q = authoritySearch.toLowerCase().trim();
                const matchesSearch = !q || (
                  u.full_name?.toLowerCase().includes(q) ||
                  u.email?.toLowerCase().includes(q) ||
                  u.department?.toLowerCase().includes(q) ||
                  u.company?.toLowerCase().includes(q)
                );
                const matchesRole = authorityRoleFilter === 'ALL' || u.role === authorityRoleFilter;
                
                const userProjects = u.role === 'Superadmin'
                  ? allProjIds
                  : (authorityDrafts[u.id] || u.allowed_projects || []);

                let matchesProject = true;
                if (authorityProjectFilter === 'NONE') {
                  matchesProject = userProjects.length === 0;
                } else if (authorityProjectFilter !== 'ALL') {
                  matchesProject = userProjects.includes(authorityProjectFilter);
                }

                return matchesSearch && matchesRole && matchesProject;
              });

              if (filteredUsers.length === 0) {
                return (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">Tidak ada personel yang sesuai filter</h3>
                    <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau pilihan filter role/proyek Anda.</p>
                  </div>
                );
              }

              {/* 1. TABLE / LIST VIEW (Default & Professional Enterprise Layout) */}
              if (authoritiesViewMode === 'table') {
                return (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                            <th className="py-3.5 px-4 w-12 text-center">#</th>
                            <th className="py-3.5 px-4 min-w-[220px]">Personel</th>
                            <th className="py-3.5 px-3 min-w-[100px]">Role</th>
                            <th className="py-3.5 px-3 min-w-[140px]">Departemen</th>
                            <th className="py-3.5 px-3 min-w-[90px] text-center">Status</th>
                            {dynamicProjects.map(proj => (
                              <th key={proj.id} className="py-3.5 px-3 text-center min-w-[120px] border-l border-slate-200/60 bg-slate-50/50">
                                <div className="flex flex-col items-center">
                                  <span className="font-mono font-black text-slate-800 text-xs">{proj.code || proj.name}</span>
                                  <span className="text-[9px] text-slate-400 font-normal truncate max-w-[110px]" title={proj.name}>
                                    {proj.name?.replace(/^Project\s+/i, '')}
                                  </span>
                                </div>
                              </th>
                            ))}
                            <th className="py-3.5 px-4 min-w-[150px] text-center border-l border-slate-200/60">Aksi Otoritas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredUsers.map((targetUser, idx) => {
                            const isSa = targetUser.role === 'Superadmin';
                            const userProjects = isSa
                              ? allProjIds
                              : (authorityDrafts[targetUser.id] || targetUser.allowed_projects || []);
                            const isSavingUser = savingAuthorityUserId === targetUser.id;

                            return (
                              <tr key={targetUser.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                                  {idx + 1}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                                      isSa ? 'bg-red-600' : targetUser.role === 'Admin' ? 'bg-amber-600' : 'bg-slate-700'
                                    }`}>
                                      {targetUser.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-900 truncate">{targetUser.full_name}</div>
                                      <div className="text-[11px] text-slate-400 font-mono truncate">{targetUser.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${
                                    isSa ? 'bg-red-50 text-red-700 border-red-200' :
                                    targetUser.role === 'Admin' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {targetUser.role}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="text-slate-700 font-medium truncate">{targetUser.department || 'Operasional'}</div>
                                  <div className="text-[10px] text-slate-400 truncate">{targetUser.company || 'DIGITECH'}</div>
                                </td>
                                <td className="py-3.5 px-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    targetUser.is_active !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}>
                                    {targetUser.is_active !== false ? 'Aktif' : 'Non-Aktif'}
                                  </span>
                                </td>

                                {/* Dynamic Project Columns from Database */}
                                {dynamicProjects.map(proj => {
                                  const isAllowed = userProjects.includes(proj.id);
                                  const isCellSaving = savingAuthorityCell === `${targetUser.id}-${proj.id}`;

                                  return (
                                    <td key={proj.id} className="py-3.5 px-3 text-center border-l border-slate-100">
                                      {isSa ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                                          <Check className="w-3 h-3 text-emerald-600" />
                                          Akses Penuh
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleProjectInstant(targetUser, proj.id)}
                                          disabled={isSavingUser || isCellSaving}
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                                            isAllowed
                                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-2xs'
                                              : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border-slate-200'
                                          }`}
                                          title={isAllowed ? `Klik untuk mencabut izin akses ${proj.code || proj.name}` : `Klik untuk memberikan izin akses ${proj.code || proj.name}`}
                                        >
                                          {isCellSaving ? (
                                            <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                                          ) : (
                                            <span className={`w-2 h-2 rounded-full ${isAllowed ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                                          )}
                                          <span>{isAllowed ? 'Diizinkan' : 'Terkunci'}</span>
                                        </button>
                                      )}
                                    </td>
                                  );
                                })}

                                {/* Aksi Cepat Column */}
                                <td className="py-3.5 px-4 text-center border-l border-slate-100">
                                  {isSa ? (
                                    <span className="text-[11px] font-mono text-slate-400 italic">Otoritas Penuh</span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleGrantAllInstant(targetUser)}
                                        disabled={isSavingUser}
                                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 text-[10px] font-bold transition cursor-pointer"
                                        title="Beri akses ke seluruh proyek"
                                      >
                                        Beri Semua
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRevokeAllInstant(targetUser)}
                                        disabled={isSavingUser}
                                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 text-[10px] font-bold transition cursor-pointer"
                                        title="Cabut seluruh akses proyek"
                                      >
                                        Cabut
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              {/* 2. CARD GRID VIEW */}
              return (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {filteredUsers.map((targetUser) => {
                    const isSa = targetUser.role === 'Superadmin';
                    const allProjIds = dynamicProjects.map(p => p.id);
                    const userDraft = isSa
                      ? allProjIds
                      : (authorityDrafts[targetUser.id] || targetUser.allowed_projects || []);

                    const originalAllowed = isSa
                      ? allProjIds
                      : (targetUser.allowed_projects || []);

                    const hasUnsavedChanges = !isSa && (
                      userDraft.length !== originalAllowed.length ||
                      userDraft.some(p => !originalAllowed.includes(p))
                    );

                    const isSavingThis = savingAuthorityUserId === targetUser.id;

                    return (
                      <div
                        key={targetUser.id}
                        className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 flex flex-col justify-between ${
                          hasUnsavedChanges
                            ? 'border-red-400 shadow-md ring-2 ring-red-100'
                            : 'border-slate-200 shadow-xs hover:border-slate-300'
                        }`}
                      >
                        {/* User Identity Header */}
                        <div>
                          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs ${
                                targetUser.role === 'Superadmin'
                                  ? 'bg-gradient-to-br from-red-600 to-rose-700'
                                  : targetUser.role === 'Admin'
                                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                  : 'bg-gradient-to-br from-slate-700 to-slate-900'
                              }`}>
                                {targetUser.full_name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-slate-900 text-sm truncate">
                                    {targetUser.full_name}
                                  </h4>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                                    targetUser.role === 'Superadmin'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : targetUser.role === 'Admin'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {targetUser.role}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 font-mono truncate mt-0.5">
                                  {targetUser.email}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  {targetUser.department || 'Operasional Site'} • {targetUser.company || 'DIGITECH'}
                                </div>
                              </div>
                            </div>

                            {/* Status Indicator */}
                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              {targetUser.is_active || targetUser.is_approved ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          </div>

                          {/* If Superadmin: VIP Unrestricted Info */}
                          {isSa ? (
                            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2">
                              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider font-mono">
                                <ShieldCheck className="w-4 h-4 text-red-600" />
                                <span>Hak Akses Penuh Superadmin</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                Akun ini bertindak sebagai <strong>Superadmin</strong> dengan hak wewenang penuh otomatis untuk seluruh proyek inventaris ({dynamicProjects.map(p => p.code || p.name).join(', ')}).
                              </p>
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {dynamicProjects.map((p, idx) => {
                                  const visual = getProjectVisual(p, idx);
                                  return (
                                    <span
                                      key={p.id}
                                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${visual.pillClass}`}
                                    >
                                      <Check className="w-3 h-3" /> {p.code || p.name}: Akses Penuh
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            /* Project Tiles for Admin & User */
                            <div className="mt-4 space-y-2.5">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                                <span>Pilih Wewenang Akses Proyek:</span>
                                <span className="text-slate-600 font-bold">
                                  {userDraft.length} dari {dynamicProjects.length} Diizinkan
                                </span>
                              </div>

                              <div className="space-y-2">
                                {dynamicProjects.map((proj, idx) => {
                                  const visual = getProjectVisual(proj, idx);
                                  const IconComponent = visual.icon;
                                  const isAllowed = userDraft.includes(proj.id);

                                  return (
                                    <div
                                      key={proj.id}
                                      onClick={() => handleToggleProject(targetUser.id, proj.id)}
                                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                        isAllowed
                                          ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 shadow-2xs'
                                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 opacity-80 hover:opacity-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                          isAllowed
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-200 text-slate-500'
                                        }`}>
                                          <IconComponent className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                                              isAllowed
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                : 'bg-slate-200 text-slate-600'
                                            }`}>
                                              {proj.code || proj.name?.substring(0, 6)?.toUpperCase()}
                                            </span>
                                            <span className="text-xs font-bold text-slate-900 truncate">
                                              {proj.name}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                            {proj.description || proj.site_location || 'Akses Operasional Proyek'}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Status Toggle Pill */}
                                      <div className="shrink-0">
                                        {isAllowed ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-2xs">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Diberi Akses</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>Terkunci</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions (Only for Admin & User) */}
                        {!isSa && (
                          <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleGrantAllProjects(targetUser.id)}
                                className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer"
                              >
                                Beri Semua
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRevokeAllProjects(targetUser.id)}
                                className="text-[11px] font-bold text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer"
                              >
                                Cabut Semua
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveUserAuthority(targetUser)}
                              disabled={isSavingThis || !hasUnsavedChanges}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                hasUnsavedChanges
                                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              }`}
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{isSavingThis ? 'Menyimpan...' : (hasUnsavedChanges ? 'Simpan Perubahan' : 'Tersimpan')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}

        </div>
      )}

      {/* ── TAB 3: KEAMANAN SISTEM & KEBIJAKAN JWT (DIPINDAHKAN KHUSUS SUPERADMIN) ── */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Alert Message */}
          {sessionSaveMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
              sessionSaveMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-red-50 border border-red-300 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {sessionSaveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
                <span>{sessionSaveMsg.text}</span>
              </div>
            </div>
          )}

          {/* Card 1: Overview & Active Session Countdown */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/70 text-red-700 text-xs font-black uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5 text-red-600" />
                  <span>Otoritas Superadmin Sistem</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-6 h-6 text-red-600" />
                  <span>Kebijakan Masa Berlaku Token Sesi Login (JWT Expiry)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                  Konfigurasikan batas waktu maksimal sesi aktif login seluruh personel di portal IMS. Saat batas waktu (misal: <strong>8 jam</strong>) tercapai, sistem secara otomatis akan <strong>mengeluarkan personel (auto kick-out)</strong> dan mewajibkan otentikasi ulang demi perlindungan data operasional.
                </p>
              </div>

              {/* Status Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/20 text-center sm:text-right min-w-[180px]">
                <span className="text-[10px] font-bold text-red-100 uppercase tracking-widest block">Kebijakan Global Aktif</span>
                <span className="text-2xl font-black font-mono tracking-tight mt-0.5 block">
                  {sessionDuration} Jam
                </span>
                <span className="text-[11px] text-red-100/80 font-medium block">
                  {Math.round(sessionDuration * 60)} Menit Auto Kick-out
                </span>
              </div>
            </div>

            {/* Diagnostic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-red-600" />
                    Sisa Waktu Sesi Anda
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                  {remainingTimeStr || '08:00:00'}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Hitung mundur live sesi Anda sebelum peramban auto kick-out.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-slate-600" />
                    Penegakan Keamanan
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">ENFORCED</span>
                </div>
                <div className="text-sm font-bold text-slate-800">
                  Dual-Layer Kick-out
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Timer browser frontend + HTTP 401 interceptor di backend.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                    Audit Sinkronisasi
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditAuditEmail(sessionConfigMeta?.updatedBy || user?.email || 'superadmin@digitech.co.id');
                      setShowEditAuditModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold transition shadow-2xs hover:shadow-xs cursor-pointer"
                    title="Ubah email / identitas penanggung jawab audit sinkronisasi (Confidential)"
                  >
                    <Edit2 className="w-3 h-3 text-slate-600" />
                    <span>Ubah Email</span>
                  </button>
                </div>
                <div className="text-xs font-bold font-mono text-slate-900 truncate">
                  {sessionConfigMeta?.updatedBy || 'Superadmin'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Tersimpan di Redis Cache &amp; PostgreSQL.</span>
                  {sessionConfigMeta?.updatedAt && (
                    <span className="text-[9px] text-slate-400 font-mono">
                      {new Date(sessionConfigMeta.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Preset Selector */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-red-600" />
                <span>Pilih Durasi Waktu Kedaluwarsa Sesi (Preset Rekomendasi)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Pilih salah satu durasi operasional yang sesuai dengan standar keamanan site tambang Sebamban dan kantor pusat Digitech.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                { hours: 1, label: '1 Jam', sub: 'Keamanan Tinggi (Pos Jaga / Perangkat Bersama)', tag: 'High Security' },
                { hours: 2, label: '2 Jam', sub: 'Audit & Sesi Pemeriksaan Singkat', tag: 'Audit' },
                { hours: 4, label: '4 Jam', sub: 'Setengah Shift Kerja Operasional', tag: 'Half-Shift' },
                { hours: 8, label: '8 Jam', sub: 'Standar 1 Shift Penuh Pit Sebamban & Kantor', tag: 'REKOMENDASI STANDAR', highlight: true },
                { hours: 12, label: '12 Jam', sub: 'Shift Extended Operator Alat Berat & Workshop', tag: 'Extended Shift' },
                { hours: 24, label: '24 Jam', sub: 'Maksimal 1 Hari Penuh (Standar Lama)', tag: 'Maksimal' },
              ].map((preset) => {
                const isSelected = Number(sessionDuration) === preset.hours;
                return (
                  <div
                    key={preset.hours}
                    onClick={() => {
                      setSessionDuration(preset.hours);
                      setCustomHoursInput('');
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-red-600 bg-red-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-red-300 hover:bg-slate-50/70 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          preset.highlight
                            ? 'bg-red-600 text-white shadow-xs'
                            : isSelected
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {preset.tag}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="text-xl font-black text-slate-900">{preset.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{preset.sub}</div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Masa Berlaku Token:</span>
                      <strong className="text-slate-700">{preset.hours * 3600} Detik</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Hours Input */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Atau tentukan durasi khusus:</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.25"
                  max="72"
                  placeholder="Contoh: 6"
                  value={customHoursInput}
                  onChange={(e) => {
                    setCustomHoursInput(e.target.value);
                    if (e.target.value) setSessionDuration(parseFloat(e.target.value));
                  }}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-slate-600">Jam</span>
              </div>

              <button
                type="button"
                onClick={() => handleSaveSessionDuration(sessionDuration)}
                disabled={sessionConfigSaving}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{sessionConfigSaving ? 'Menerapkan Kebijakan...' : 'Terapkan Kebijakan Sesi Global'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: KONFIRMASI HAPUS PENGGUNA ── */}
      {userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isProcessingAction && setUserToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 to-rose-600" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Hapus Akun Pengguna?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tindakan ini permanen dan tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5 space-y-1.5 text-xs">
                <div className="font-bold text-slate-900 text-sm">{userToDelete.full_name}</div>
                <div className="font-mono text-slate-500 text-[11px]">{userToDelete.email}</div>
                <div className="pt-2 flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold">
                    Role: {userToDelete.role}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-semibold">
                    {userToDelete.company || 'DIGITECH'} &bull; {userToDelete.department || 'Site'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-50/70 border border-red-200/80 text-[11px] text-red-800 mb-6 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>
                  Seluruh hak akses, otorisasi project, dan sesi login pengguna ini akan segera dicabut dari database.
                </span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isProcessingAction ? 'Menghapus...' : 'Ya, Hapus Pengguna'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: KONFIRMASI NONAKTIFKAN / AKTIFKAN STATUS PENGGUNA ── */}
      {userToToggle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isProcessingAction && setUserToToggle(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-1.5 w-full ${userToToggle.is_active !== false ? 'bg-amber-500' : 'bg-emerald-600'}`} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  userToToggle.is_active !== false
                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                }`}>
                  {userToToggle.is_active !== false ? (
                    <UserX className="w-6 h-6" />
                  ) : (
                    <UserCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {userToToggle.is_active !== false ? 'Nonaktifkan Akun Pengguna?' : 'Aktifkan Kembali Akun Pengguna?'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {userToToggle.is_active !== false
                      ? 'Pengguna tidak akan dapat mengakses sistem'
                      : 'Pengguna akan dapat login kembali ke sistem'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5 space-y-1 text-xs">
                <div className="font-bold text-slate-900 text-sm">{userToToggle.full_name}</div>
                <div className="font-mono text-slate-500 text-[11px]">{userToToggle.email}</div>
                <div className="text-[11px] text-slate-600 pt-1">
                  Role Akses: <strong className="text-red-600 font-mono">{userToToggle.role}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                {userToToggle.is_active !== false
                  ? `Apakah Anda yakin ingin menonaktifkan akun ${userToToggle.full_name}? Pengguna ini tidak akan bisa login ke Digitech IMS, namun data histori transaksi dan dokumen tetap aman.`
                  : `Apakah Anda yakin ingin mengaktifkan kembali akun ${userToToggle.full_name}? Pengguna ini akan dapat login kembali dengan hak akses ${userToToggle.role}.`}
              </p>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => setUserToToggle(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleToggleStatus}
                  className={`px-4 py-2.5 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                    userToToggle.is_active !== false
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isProcessingAction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : userToToggle.is_active !== false ? (
                    <UserX className="w-3.5 h-3.5" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isProcessingAction
                      ? 'Memproses...'
                      : userToToggle.is_active !== false
                      ? 'Ya, Nonaktifkan'
                      : 'Ya, Aktifkan Kembali'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: UBAH EMAIL AUDIT SINKRONISASI & IDENTITAS CONFIDENTIAL (KHUSUS SUPERADMIN) ── */}
      {showEditAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header (Clean Light Theme) */}
            <div className="p-5 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shadow-2xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-slate-900">Ubah Email Audit Sinkronisasi</h3>
                  <p className="text-[10px] text-slate-400 font-mono font-semibold">CONFIDENTIAL SUPERADMIN CREDENTIAL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditAuditModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveAuditEmail} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <strong>Otoritas Rahasia (Confidential):</strong> Email ini dicatat sebagai identitas sah penanggung jawab audit mutasi, rekonsiliasi data, serta penandatangan kebijakan keamanan sesi pada Redis Cache dan server database PostgreSQL.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Penanggung Jawab Audit
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={editAuditEmail}
                    onChange={(e) => setEditAuditEmail(e.target.value)}
                    placeholder="nama.superadmin@perusahaan.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ganti email default/fiksi dengan email resmi operasional Superadmin Anda.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Penyimpanan:</span>
                  <span className="font-mono font-bold text-slate-700">Redis Cache + PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Durasi Sesi Saat Ini:</span>
                  <span className="font-mono font-bold text-slate-700">{sessionDuration} Jam</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditAuditModal(false)}
                  disabled={savingAuditEmail}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAuditEmail}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingAuditEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Email Audit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

