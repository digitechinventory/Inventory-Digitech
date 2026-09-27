import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  Menu,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function IronNestHeader({ onToggleSidebar, onSearch, searchTerm = '' }) {
  const location = useLocation();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const { user, role, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'Batas Minimum Tercapai', message: 'Hydraulic Hose 1-inch di rak B3 tersisa 14 MTR (Safety Stock: 25 MTR).', time: '10 mnt lalu', type: 'warning' },
    { id: 2, title: 'MOS Menunggu Otorisasi', message: 'MOS-2026-09-001 dari PT Trakindo Utama menunggu approval Slot 3.', time: '1 jam lalu', type: 'info' },
    { id: 3, title: 'Sinkronisasi Basis Data', message: '28 item inventaris berhasil disinkronkan dengan Supabase Cloud.', time: 'Hari ini 08:30', type: 'success' },
  ];

  return (
    <header className={`w-full bg-white/85 backdrop-blur-xl py-3.5 px-4 sm:px-6 lg:px-8 items-center justify-between gap-4 sticky top-0 z-30 border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${isDashboard ? 'hidden lg:flex' : 'flex'}`}>
      {/* Left: Mobile hamburger + Universal Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs hover:shadow-md cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden flex items-center shrink-0">
          <img
            src="/digitech-emblem.png"
            alt="Digitech"
            className="w-7 h-7 object-contain"
          />
        </div>

        {/* Elevated "Timbul" Frosted Search Bar */}
        <div className="relative w-full group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            placeholder="Cari material, nomor MOS, atau laporan..."
            className="w-full bg-slate-50/80 hover:bg-white focus:bg-white text-slate-800 placeholder-slate-400 text-xs sm:text-sm pl-4 pr-10 py-2.5 rounded-full border border-slate-200/90 shadow-xs hover:shadow-sm focus:shadow-[0_4px_16px_rgba(220,38,38,0.12)] focus:border-red-500/60 focus:outline-none transition-all duration-200 font-sans"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-red-600 transition-colors pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Right Controls: Notification Bell, Calendar, and Profile (Preferences/Theme removed) */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Notification Bell with Floating Badge */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-red-600 hover:border-red-300 transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-display font-bold text-sm text-slate-900">Notifikasi Operasional</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                  {notifications.length} Baru
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar mt-2">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 hover:bg-slate-50 rounded-xl px-2 transition-colors cursor-pointer">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'warning' ? 'bg-amber-500' : n.type === 'info' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">{n.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Site Calendar Button */}
        <button
          onClick={() => setShowCalendarModal(true)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-red-600 hover:border-red-300 transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          aria-label="Calendar"
          title="Jadwal Shift & Operasional Site"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Elevated User Profile Pill */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-slate-200/90 rounded-full shadow-xs hover:shadow-md hover:border-red-300 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            {/* Avatar image with Merah-Putih Gradient */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-red-600 to-red-700 flex items-center justify-center text-white font-black text-xs overflow-hidden ring-1 ring-white shadow-2xs">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <span>{(user?.full_name || 'Digitech').charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Name */}
            <span className="text-xs font-semibold text-slate-800 max-w-[100px] sm:max-w-[140px] truncate">
              {user?.full_name || 'Arya Superadmin'}
            </span>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-100">
                <div className="font-semibold text-sm text-slate-900">{user?.full_name || 'Pengguna'}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email || 'user@digitech.co.id'}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase">
                    {role || 'Superadmin'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 truncate">{user?.company || 'PT Digitech Global'}</span>
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-slate-800/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">Jadwal Operasional Site</h3>
                  <p className="text-xs text-slate-500">PT Borneo Indobara — September 2026</p>
                </div>
              </div>
              <button onClick={() => setShowCalendarModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-bold text-slate-800">Shift A — Pit Sebamban KM 24</div>
                <div className="text-xs text-slate-500 mt-0.5">07:00 - 19:00 WITA • PIC: arya-user</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-bold text-slate-800">Penerimaan Kontrak PO Vendor Trakindo</div>
                <div className="text-xs text-slate-500 mt-0.5">Jadwal MOS: 24 September 2026 • Warehouse 1</div>
              </div>
            </div>

            <button
              onClick={() => setShowCalendarModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
