import React, { useState } from 'react';
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
  Shield
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

export default function UsersPage() {
  const { user, role, isSuperadmin } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active'
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedRoleForApproval, setSelectedRoleForApproval] = useState({});

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
      alert(`Akun pengguna berhasil diaktifkan dengan role ${assignedRole}.`);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal mengaktifkan akun.');
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('Apakah Anda yakin ingin menolak dan menghapus pendaftaran pengguna ini?')) return;
    try {
      await api.put(`/users/${userId}/reject`, { notes: 'Data tidak sesuai verifikasi pengawas site' });
      alert('Pendaftaran akun ditolak.');
      refetch();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal menolak akun.');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      alert(`Role berhasil diubah menjadi ${newRole}.`);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Gagal mengubah role.');
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans select-none animate-in fade-in duration-200">
      
      {/* ── Header ── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_12px_36px_rgba(220,38,38,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            Manajemen Akun &amp; Hak Akses
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Pengguna &amp; Antrean Aktivasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verifikasi identitas pendaftar baru, penetapan wewenang role (Teknisi / Admin / Superadmin), dan kontrol hak akses.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-red-600 shadow-xs'
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
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Pengguna Aktif ({activeUsers.length})</span>
          </button>
        </div>
      </div>

      {/* ── Toolbar: Search & View Toggle ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, perusahaan, departemen..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kartu Grid</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Tabel</span>
          </button>
        </div>
      </div>

      {/* ── CARD GRID VIEW (Default & Modern) ── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.length === 0 ? (
            <div className="col-span-3 bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Tidak ada data pengguna</h3>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === 'pending'
                  ? 'Tidak ada akun baru yang sedang menunggu aktivasi Superadmin.'
                  : 'Tidak ada data pengguna yang sesuai dengan pencarian.'}
              </p>
            </div>
          ) : (
            displayList.map((u) => {
              const currentRole = selectedRoleForApproval[u.id] || u.role || 'User';
              const isSuper = u.role === 'Superadmin';
              const isAdminRole = u.role === 'Admin';

              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-red-300 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* User Header: Avatar, Name, Email, Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                          {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 leading-tight">{u.full_name}</h3>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        u.is_active || u.is_approved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {u.is_active || u.is_approved ? '✓ Aktif' : '⏳ Pending'}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Building2 className="w-3.5 h-3.5" /> Mitra Perusahaan
                        </span>
                        <span className="font-semibold text-slate-800">{u.company || 'PT Borneo Indobara'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" /> Site / Divisi
                        </span>
                        <span className="font-semibold text-slate-800">{u.department || 'Operasional Pit'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Assignment & Action Controls */}
                  <div className="mt-4 pt-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Wewenang Role:</span>
                      {activeTab === 'pending' ? (
                        <select
                          value={currentRole}
                          onChange={(e) =>
                            setSelectedRoleForApproval({ ...selectedRoleForApproval, [u.id]: e.target.value })
                          }
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-red-500 cursor-pointer"
                        >
                          <option value="User">User (Teknisi Lapangan)</option>
                          <option value="Admin">Admin (Logistik Gudang)</option>
                          <option value="Superadmin">Superadmin</option>
                        </select>
                      ) : (
                        <select
                          value={u.role || 'User'}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-red-500 cursor-pointer"
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                          <option value="Superadmin">Superadmin</option>
                        </select>
                      )}
                    </div>

                    {activeTab === 'pending' ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleApprove(u.id)}
                          className="flex-1 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aktifkan Akun</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(u.id)}
                          className="px-3 py-2 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                        <span>ID: {u.id?.slice(0, 12)}...</span>
                        <span className="text-emerald-700 font-bold">Terverifikasi</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
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
                    <td className="px-4 py-3 font-semibold text-slate-800">{u.company || 'PT Borneo Indobara'}</td>
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
                          className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
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
        </div>
      )}

    </div>
  );
}
