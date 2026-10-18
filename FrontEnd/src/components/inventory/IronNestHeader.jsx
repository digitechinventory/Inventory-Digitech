import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  Menu,
  LogOut,
  Settings,
  X,
  Volume2,
  VolumeX,
  CheckCheck,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RealWorldCalendar from '../calendar/RealWorldCalendar';
import LogoutConfirmModal from '../common/LogoutConfirmModal';
import PrinterSetupModal from '../printer/PrinterSetupModal';
import { getPrinterConfig } from '../../services/printerService';
import { playNotificationSound, isSoundMuted, setSoundMuted } from '../../utils/notificationSound';
import api from '../../api/client';

export default function IronNestHeader({ onToggleSidebar, onSearch, searchTerm = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const { user, role, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const [printerConfig, setPrinterConfig] = useState(() => getPrinterConfig());

  useEffect(() => {
    const handlePrinterConfigChange = (e) => {
      setPrinterConfig(e.detail || getPrinterConfig());
    };
    window.addEventListener('digitech:printer-config-changed', handlePrinterConfigChange);
    return () => window.removeEventListener('digitech:printer-config-changed', handlePrinterConfigChange);
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [isMuted, setIsMuted] = useState(() => isSoundMuted());
  const prevUnreadRef = useRef(null);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const calendarRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendarModal(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications strictly scoped to current user & role
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data?.data) {
        const list = res.data.data.notifications || [];
        const count = res.data.data.unread_count ?? list.filter(n => !n.is_read).length;

        // Play chime if new unread notification arrived
        if (prevUnreadRef.current !== null && count > prevUnreadRef.current) {
          if (!isMuted) {
            playNotificationSound();
          }
        }
        prevUnreadRef.current = count;

        setNotifications(list);
        setUnreadCount(count);
      }
    } catch (err) {
      console.warn('[Notifications] Error fetching notifications:', err);
    }
  }, [user]);

  // Initial fetch and polling per 25s
  useEffect(() => {
    prevUnreadRef.current = null;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [user?.id, role, fetchNotifications]);

  // Format relative timestamp
  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Baru saja';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  };

  // Mark single notification as read & navigate
  const handleItemClick = async (n) => {
    if (!n.is_read) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      setUnreadCount(prev => Math.max(0, prev - 1));
      try {
        await api.post(`/notifications/${n.id}/read`);
      } catch (err) {
        console.warn('[Notifications] Mark read error:', err);
      }
    }
    if (n.link) {
      setShowNotifications(false);
      navigate(n.link);
    }
  };

  // Mark all notifications as read for current user
  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
    setUnreadCount(0);
    try {
      await api.post('/notifications/read-all');
    } catch (err) {
      console.warn('[Notifications] Mark all read error:', err);
    }
  };

  // Delete single notification for current user
  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    const target = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(item => item.id !== id));
    if (target && !target.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.warn('[Notifications] Delete error:', err);
    }
  };

  // Clear all notifications for current user
  const handleClearAll = async (e) => {
    e.stopPropagation();
    setNotifications([]);
    setUnreadCount(0);
    try {
      await api.delete('/notifications');
    } catch (err) {
      console.warn('[Notifications] Clear all error:', err);
    }
  };

  // Toggle mute / unmute sound
  const handleToggleMute = (e) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setSoundMuted(newMuted);
    if (!newMuted) {
      // Bunyikan chime lembut konfirmasi saat di-unmute
      playNotificationSound(true);
    }
  };

  return (
    <header className={`w-full bg-white/90 backdrop-blur-xl py-3.5 px-4 sm:px-6 lg:px-8 items-center justify-between gap-4 sticky top-0 z-50 border-y border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${isDashboard ? 'hidden lg:flex' : 'flex'}`}>
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

      {/* Right Controls: Notification Bell, Calendar, and Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Notification Bell with Floating Badge */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-red-600 hover:border-red-300 transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative cursor-pointer"
            aria-label="Notifications"
            title="Notifikasi Operasional"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white font-mono font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-50">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown (High z-index to avoid clipping behind maps/panes) */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[1200] animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
              
              {/* Header with Title & Action Tools */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-slate-900">Notifikasi</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {role || 'User'}
                  </span>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                      {unreadCount} Baru
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Semua Terbaca
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Mute / Unmute Sound Toggle Button */}
                  <button
                    onClick={handleToggleMute}
                    title={isMuted ? 'Suara Notifikasi Dibisukan (Klik untuk Aktifkan / Unmute)' : 'Suara Notifikasi Aktif (Klik untuk Bisukan / Mute)'}
                    className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                      isMuted
                        ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                        : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  {/* Mark All Read */}
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      title="Tandai Semua Sudah Dibaca"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}

                  {/* Clear All */}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      title="Bersihkan Semua Notifikasi"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Items Container (Unclipped, properly bounded) */}
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto custom-scrollbar mt-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-xs font-semibold">Tidak ada notifikasi saat ini</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Notifikasi khusus role {role} akan muncul di sini</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`group py-2.5 px-2.5 rounded-xl transition-all cursor-pointer relative ${
                        n.is_read ? 'hover:bg-slate-50 opacity-80' : 'bg-red-50/20 hover:bg-red-50/40 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Status Dot */}
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.type === 'warning'
                              ? 'bg-amber-500 ring-2 ring-amber-100'
                              : n.type === 'urgent'
                              ? 'bg-red-600 ring-2 ring-red-100 animate-pulse'
                              : n.type === 'success'
                              ? 'bg-emerald-500 ring-2 ring-emerald-100'
                              : 'bg-blue-500 ring-2 ring-blue-100'
                          }`}
                        />

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs ${n.is_read ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                              {n.title}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => handleDeleteItem(e, n.id)}
                                title="Hapus Notifikasi"
                                className="p-0.5 text-slate-400 hover:text-red-600 rounded transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </div>

                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                            <span>{formatTimeAgo(n.created_at)}</span>
                            {n.link && (
                              <span className="text-red-600 group-hover:underline flex items-center gap-0.5 text-[10px] font-sans">
                                Buka Modul <ExternalLink className="w-2.5 h-2.5 inline" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer info showing per-user isolation guarantee */}
              <div className="pt-2.5 mt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>User: {user?.full_name || 'Akun Aktif'}</span>
                <span>Role: {role || 'User'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Thermal Sticker Printer Quick Button */}
        <div className="relative">
          <button
            onClick={() => setShowPrinterSetup(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-red-600 hover:border-red-300 transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative cursor-pointer"
            aria-label="Setup Printer"
            title="Setup & Integrasi Printer Stiker QR (Wireless / USB)"
          >
            <Printer className="w-4 h-4" />
            <span
              className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                printerConfig.simulationMode ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </button>
        </div>

        {/* Site Calendar Button & Dropdown Popover */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setShowCalendarModal(!showCalendarModal)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center ${
              showCalendarModal
                ? 'bg-red-50 border-red-300 text-red-600'
                : 'bg-white border-slate-200/90 text-slate-700 hover:text-red-600 hover:border-red-300'
            }`}
            aria-label="Calendar"
            title="Jadwal Shift & Operasional Site"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Calendar Modal Overlay (Real World Interactive Calendar) via Portal */}
          {showCalendarModal && createPortal(
            <div
              className="fixed inset-0 z-[99999] bg-slate-800/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowCalendarModal(false);
                }
              }}
            >
              <div className="w-full max-w-5xl my-auto max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
                <RealWorldCalendar
                  isModal={true}
                  onClose={() => setShowCalendarModal(false)}
                />
              </div>
            </div>,
            document.body
          )}
        </div>

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
                  <span className="text-[10px] font-bold text-slate-500 truncate">{user?.company || 'DIGITECH'}</span>
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pengaturan Akun &amp; Keamanan</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowLogoutConfirm(true);
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

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          await logout();
          navigate('/login', { replace: true });
        }}
      />

      {/* Printer Setup Modal */}
      <PrinterSetupModal
        isOpen={showPrinterSetup}
        onClose={() => setShowPrinterSetup(false)}
      />
    </header>
  );
}
