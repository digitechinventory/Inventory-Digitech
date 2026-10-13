import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Navigate } from 'react-router-dom';

export default function UsersPage() {
  const { user, role, isSuperadmin, session } = useAuth();
  const { addToast } = useToast();

  // Strict Superadmin-only guard: prevent User and Admin from accessing
  if (!isSuperadmin && role !== 'Superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active' | 'security'
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedRoleForApproval, setSelectedRoleForApproval] = useState({});

  // Superadmin JWT Session Duration State
  const [sessionDuration, setSessionDuration] = useState(8);
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [sessionConfigSaving, setSessionConfigSaving] = useState(false);
  const [sessionConfigMeta, setSessionConfigMeta] = useState(null);
  const [sessionSaveMsg, setSessionSaveMsg] = useState(null);
  const [remainingTimeStr, setRemainingTimeStr] = useState('');

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
  const pendingUsers = users.filter(u => !u.is_active && !u.is_approved);
  const activeUsers = users.filter(u => u.is_active || u.is_approved);

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

        {/* 3 Tabs: Antrean, Pengguna Aktif, Keamanan Sistem & JWT — Pushed to right edge */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold ml-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-red-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Antrean Aktivasi ({pendingUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-red-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Pengguna Aktif ({activeUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Keamanan Sesi &amp; JWT</span>
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
                        u.is_active || u.is_approved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {u.is_active || u.is_approved ? 'AKTIF' : 'PENDING'}
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500">Role:</span>
                          <span className="font-mono text-xs font-bold text-red-600">{u.role}</span>
                        </div>
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer"
                        >
                          <option value="User">Ubah ke User</option>
                          <option value="Admin">Ubah ke Admin</option>
                          <option value="Superadmin">Ubah ke Superadmin</option>
                        </select>
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
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {u.is_active || u.is_approved ? 'Aktif' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleApprove(u.id)}
                            className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Aktifkan
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Terverifikasi</span>
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

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Audit Sinkronisasi
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {sessionConfigMeta?.updatedBy || 'Superadmin'}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Tersimpan di Redis Cache &amp; PostgreSQL Server.
                </p>
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

    </div>
  );
}
