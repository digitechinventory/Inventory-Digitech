import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Store,
  PackageCheck,
  Truck,
  Boxes,
  CircleDollarSign,
  Users,
  Compass,
  FileSpreadsheet,
  Calendar,
  LogOut,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  HardHat,
  FolderGit2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import LogoutConfirmModal from '../common/LogoutConfirmModal.jsx';

/* ─── Authentic Mega Mendung Batik Ornament (Matching Login Card) ─────────── */
const MegaMendungDefs = () => (
  <defs>
    <linearGradient id="sbMmCrimsonDeep" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.92" />
      <stop offset="100%" stopColor="#991B1B" stopOpacity="0.82" />
    </linearGradient>
    <linearGradient id="sbMmRedMid" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#B91C1C" stopOpacity="0.95" />
      <stop offset="100%" stopColor="#DC2626" stopOpacity="0.88" />
    </linearGradient>
    <linearGradient id="sbMmRedVibrant" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#DC2626" stopOpacity="0.98" />
      <stop offset="100%" stopColor="#EF4444" stopOpacity="0.92" />
    </linearGradient>
    <linearGradient id="sbMmRoseLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F87171" stopOpacity="0.92" />
      <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0.82" />
    </linearGradient>
    <linearGradient id="sbMmWhiteTip" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
      <stop offset="100%" stopColor="#FFF1F2" stopOpacity="0.88" />
    </linearGradient>

    <g id="sbMegaMendungShape">
      {/* Cloud Lobe 1 (Dominant corner cloud with stepped lobes) */}
      <path
        d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142 Z"
        fill="url(#sbMmCrimsonDeep)"
      />
      <path
        d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116 Z"
        fill="url(#sbMmRedMid)"
      />
      <path
        d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90 Z"
        fill="url(#sbMmRedVibrant)"
      />
      <path
        d="M-5,-5 L60,-5 C54,6 58,15 46,20 C36,24 38,34 26,38 C16,42 18,54 4,60 C-3,64 -5,66 -5,66 Z"
        fill="url(#sbMmRoseLight)"
      />
      <path
        d="M-5,-5 L30,-5 C26,2 28,8 20,11 C14,14 16,21 9,24 C4,27 -2,32 -5,35 Z"
        fill="url(#sbMmWhiteTip)"
      />

      {/* Cloud Lobe 2 (Vertical flank trailing wave) */}
      <path
        d="M-5,72 C18,72 26,58 46,63 C66,68 62,84 76,88 C90,92 86,112 66,116 C46,120 32,140 -5,150 Z"
        fill="url(#sbMmCrimsonDeep)"
        opacity="0.85"
      />
      <path
        d="M-5,82 C12,82 18,71 34,75 C50,79 46,91 58,94 C68,97 65,110 50,113 C35,117 24,130 -5,138 Z"
        fill="url(#sbMmRedMid)"
      />
      <path
        d="M-5,92 C4,92 10,83 22,86 C34,89 30,99 40,101 C48,103 45,113 35,116 C25,118 16,126 -5,130 Z"
        fill="url(#sbMmRedVibrant)"
      />
      <path
        d="M-5,102 C-1,102 3,95 12,97 C20,99 18,106 24,108 C30,110 27,117 19,119 C12,120 4,124 -5,126 Z"
        fill="url(#sbMmRoseLight)"
      />

      {/* Traditional Batik Linework Overlays */}
      <path
        d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142"
        fill="none"
        stroke="#991B1B"
        strokeWidth="1.2"
        opacity="0.8"
      />
      <path
        d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116"
        fill="none"
        stroke="#DC2626"
        strokeWidth="1.2"
        opacity="0.85"
      />
      <path
        d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90"
        fill="none"
        stroke="#F87171"
        strokeWidth="1"
        opacity="0.9"
      />
    </g>
  </defs>
);

// Jajaran genjang vertikal: sisi kanan lebih tinggi (miring ke atas ke arah kanan)
// Sisi atas: dari (0, SLANT) ke (100%, 0) -> kanan lebih tinggi
// Sisi bawah: dari (0, 100%) ke (100%, calc(100% - SLANT)) -> kanan lebih tinggi
const SLANT = '40px';
const CLIP_MAIN   = `polygon(0 ${SLANT}, 100% 0, 100% calc(100% - ${SLANT}), 0 100%)`;
const CLIP_SHADOW = `polygon(0 ${SLANT}, 100% 0, 100% calc(100% - ${SLANT}), 0 100%)`;

export default function IronNestSidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavItemsForRole = (currentRole) => {
    const normalizedRole = currentRole || 'User';

    if (normalizedRole === 'Superadmin') {
      return [
        { id: 'overview', label: 'Overview', icon: LayoutGrid, path: '/overview' },
        { id: 'projectInventory', label: 'Project', icon: FolderGit2, path: '/project-inventory' },
        { id: 'warehouses', label: 'Rak Gudang', icon: Store, path: '/warehouses' },
        { id: 'orders', label: 'MOS Otorisasi', icon: PackageCheck, path: '/mos', badge: 'Otor' },
        { id: 'opname', label: 'Stock Opname', icon: Truck, path: '/opname' },
        { id: 'inventory', label: 'Katalog & QR', icon: Boxes, path: '/inventory' },
        { id: 'agenda', label: 'Agenda Site', icon: Calendar, path: '/agenda', badge: 'Live' },
        { id: 'finance', label: 'Mutasi & Ledger', icon: CircleDollarSign, path: '/ledger' },
        { id: 'users', label: 'Manajemen User', icon: Users, path: '/users', badge: 'Admin' },
        { id: 'tracking', label: 'Asset Tracking', icon: Compass, path: '/tracking' },
        { id: 'reports', label: 'Laporan Resmi', icon: FileSpreadsheet, path: '/reports' },
      ];
    }

    if (normalizedRole === 'Admin') {
      return [
        { id: 'adminDashboard', label: 'Panel Logistik', icon: LayoutGrid, path: '/dashboard', badge: 'Admin' },
        { id: 'projectInventory', label: 'Project', icon: FolderGit2, path: '/project-inventory' },
        { id: 'warehouses', label: 'Rak Gudang', icon: Store, path: '/warehouses' },
        { id: 'orders', label: 'MOS Verifikasi', icon: PackageCheck, path: '/mos', badge: 'Verif' },
        { id: 'opname', label: 'Stock Opname', icon: Truck, path: '/opname' },
        { id: 'inventory', label: 'Katalog Stok', icon: Boxes, path: '/inventory' },
        { id: 'agenda', label: 'Agenda & Shift', icon: Calendar, path: '/agenda', badge: 'Live' },
        { id: 'finance', label: 'Mutasi & Ledger', icon: CircleDollarSign, path: '/ledger' },
        { id: 'tracking', label: 'Peminjaman Tools', icon: Compass, path: '/tools' },
        { id: 'reports', label: 'Laporan Logistik', icon: FileSpreadsheet, path: '/reports' },
      ];
    }

    return [
      { id: 'dashboard', label: 'Portal Teknisi', icon: LayoutGrid, path: '/dashboard', badge: 'Teknisi' },
      { id: 'projectInventory', label: 'Project', icon: FolderGit2, path: '/project-inventory' },
      { id: 'orders', label: 'Penerimaan MOS', icon: PackageCheck, path: '/mos' },
      { id: 'inventory', label: 'Katalog Material', icon: Boxes, path: '/inventory' },
      { id: 'agenda', label: 'Agenda Kerja', icon: Calendar, path: '/agenda', badge: 'Live' },
      { id: 'tracking', label: 'Peminjaman Tools', icon: Compass, path: '/tools' },
    ];
  };

  const navItems = getNavItemsForRole(role);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const getRoleBadgeStyle = (currentRole) => {
    if (currentRole === 'Superadmin') return 'bg-red-50 text-red-700 border-red-200';
    if (currentRole === 'Admin') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const sidebarWidth = isCollapsed ? 'lg:w-[76px] w-64' : 'w-64';

  return (
    <>
      {/* ── Mobile Backdrop ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-800/30 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* ── Floating Sidebar Wrapper ─────────────────────────────────── */}
      <aside
        className={`fixed top-4 bottom-4 left-3 z-50 transition-all duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : 'hidden lg:block -translate-x-full lg:translate-x-0'
        } ${sidebarWidth}`}
      >
        {/* ── Layer 2: Shadow / Accent Parallelogram (behind main body) ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate(6px, 6px)',
            clipPath: CLIP_SHADOW,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(160deg, #7F1D1D 0%, #B91C1C 40%, #DC2626 70%, #EF4444 100%)',
              opacity: 0.55,
              border: '1.5px solid rgba(220,38,38,0.5)',
              boxShadow: '0 12px 40px rgba(185,28,28,0.35), 0 4px 16px rgba(127,29,29,0.3)',
            }}
          />
        </div>
        {/* ── Layer 3: Far shadow (depth) ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate(11px, 11px)',
            clipPath: CLIP_SHADOW,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'rgba(127,29,29,0.18)',
              boxShadow: '0 16px 48px rgba(127,29,29,0.2)',
            }}
          />
        </div>

        {/* ── Layer 1: Main Parallelogram Body ─────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: CLIP_MAIN,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            borderLeft: '5px solid #C0111B',
            borderRight: '1px solid #CBD5E1',
            boxShadow: '0 2px 20px rgba(0,0,0,0.10), 1px 0 8px rgba(0,0,0,0.05)',
          }}
        >
          {/* ── Top Slanted Edge Border (Diagonal from 0,40 to 100%,0) ──── */}
          <svg
            aria-hidden="true"
            className="absolute top-0 left-0 w-full pointer-events-none overflow-visible"
            style={{ height: '40px', zIndex: 30 }}
          >
            <line
              x1="0"
              y1="40"
              x2="100%"
              y2="0"
              stroke="#CBD5E1"
              strokeWidth="2.5"
            />
          </svg>

          {/* ── Bottom Slanted Edge Border (Diagonal from 0,40 to 100%,0 of bottom slice) ──── */}
          <svg
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-full pointer-events-none overflow-visible"
            style={{ height: '40px', zIndex: 30 }}
          >
            <line
              x1="0"
              y1="40"
              x2="100%"
              y2="0"
              stroke="#CBD5E1"
              strokeWidth="2.5"
            />
          </svg>
          {/* ── Corner Ornament: TOP-LEFT Mega Mendung (Batik Merah Khas Card Login) ─── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: isCollapsed ? '110px' : '155px',
              height: isCollapsed ? '110px' : '155px',
              pointerEvents: 'none',
              zIndex: 1,
              opacity: 0.95,
            }}
          >
            <svg viewBox="-5 -5 160 160" style={{ width: '100%', height: '100%', display: 'block' }}>
              <MegaMendungDefs />
              <use href="#sbMegaMendungShape" x="0" y="0" />
            </svg>
          </div>

          {/* ── Corner Ornament: BOTTOM-RIGHT Mega Mendung (Batik Merah Khas Card Login) ─── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: isCollapsed ? '110px' : '155px',
              height: isCollapsed ? '110px' : '155px',
              pointerEvents: 'none',
              zIndex: 1,
              opacity: 0.95,
            }}
          >
            <svg viewBox="-5 -5 160 160" style={{ width: '100%', height: '100%', display: 'block' }}>
              <MegaMendungDefs />
              <use href="#sbMegaMendungShape" transform="rotate(180, 75, 75)" />
            </svg>
          </div>

          {/* ── All content sits ABOVE ornaments (z-index: 10+) ─────── */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* ── Brand Header ────────────────────────────────── */}
            <div
              style={{
                background: 'transparent',
                borderBottom: '1px solid rgba(226,232,240,0.6)',
              }}
              className={`flex items-center justify-between transition-all ${
                isCollapsed ? 'px-2 pt-11 pb-3 flex-col gap-2' : 'px-4 pt-12 pb-4'
              }`}
            >
              {isCollapsed ? (
                /* Collapsed: emblem only with white container */
                <div className="flex flex-col items-center gap-2 w-full">
                  <NavLink
                    to="/dashboard"
                    className="p-1.5 rounded-xl bg-white shadow-sm border border-slate-200/80 hover:bg-red-50 transition-all flex items-center justify-center relative z-20"
                    title="Digitech IMS"
                  >
                    <img
                      src="/digitech-emblem.png"
                      alt="Digitech"
                      className="h-8 w-8 object-contain drop-shadow-2xs"
                    />
                  </NavLink>
                  <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex p-1.5 rounded-xl text-slate-500 hover:text-red-600 bg-white/90 hover:bg-white transition-all cursor-pointer relative z-20 shadow-2xs border border-slate-200/60"
                    title="Perluas Menu Navigasi"
                    aria-label="Expand sidebar"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Expanded: logo + text + collapse button */
                <>
                  <NavLink
                    to="/dashboard"
                    className="flex items-center gap-3 group min-w-0"
                  >
                    {/* Logo with white background pill so it's always visible */}
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '10px',
                        padding: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 20,
                      }}
                    >
                      <img
                        src="/digitech-emblem.png"
                        alt="Digitech"
                        style={{ height: '36px', width: '36px', objectFit: 'contain', display: 'block' }}
                        className="transition-transform group-hover:scale-105"
                      />
                    </div>
                    {/* Brand text */}
                    <div className="flex flex-col justify-center min-w-0 relative z-20">
                      <span
                        style={{ lineHeight: 1.1 }}
                        className="text-sm font-black tracking-widest text-slate-900 group-hover:text-red-700 transition-colors uppercase drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]"
                      >
                        DIGITECH
                      </span>
                      <span
                        style={{ lineHeight: 1.2, marginTop: '3px' }}
                        className="text-[9px] font-bold text-red-700 tracking-tight whitespace-nowrap leading-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]"
                      >
                        Inventory Management System
                      </span>
                    </div>
                  </NavLink>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <button
                      onClick={onToggleCollapse}
                      className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                      title="Ciutkan Menu"
                      aria-label="Collapse sidebar"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onClose}
                      className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                      aria-label="Close sidebar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── Role Badge Strip ─────────────────────────────── */}
            {!isCollapsed && (
              <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                  Hak Akses Portal
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${getRoleBadgeStyle(role)}`}>
                  {role || 'User'}
                </span>
              </div>
            )}

            {/* ── Navigation Items ─────────────────────────────── */}
            <nav
              className={`flex-1 overflow-y-auto py-3 space-y-1 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-3'}`}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  ((item.path === '/dashboard' || item.path === '/overview') &&
                    location.pathname === '/');

                return (
                  <div key={item.id} className="relative group">
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center rounded-xl transition-all duration-200 cursor-pointer ${
                        isCollapsed
                          ? 'w-11 h-11 mx-auto justify-center'
                          : 'gap-3 px-3.5 py-2.5 text-xs'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-[0_4px_16px_rgba(220,38,38,0.28)]'
                          : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100 hover:translate-x-0.5'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-red-600'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${
                            isActive
                              ? 'bg-white/20 text-white border border-white/30'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-red-50 group-hover:text-red-700 group-hover:border-red-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>

                    {/* Tooltip for collapsed */}
                    {isCollapsed && (
                      <div className="fixed left-[88px] px-3 py-1.5 bg-white/95 text-slate-800 text-xs font-bold rounded-xl shadow-xl border border-slate-200/90 pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap backdrop-blur-md">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* ── Footer: Settings & Logout ────────────────────── */}
            <div
              className={`border-t border-slate-100/80 space-y-1 relative z-10 ${isCollapsed ? 'p-2 pb-12' : 'p-3 pb-12'}`}
              style={{ background: 'transparent' }}
            >
              {/* Settings */}
              <div className="relative group">
                <button
                  onClick={() => {
                    navigate('/settings');
                    if (isOpen) onClose();
                  }}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    location.pathname === '/settings'
                      ? 'bg-red-50 text-red-700 font-bold border border-red-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  } ${
                    isCollapsed
                      ? 'w-11 h-11 mx-auto justify-center'
                      : 'gap-2.5 px-3 py-2'
                  }`}
                >
                  <Settings
                    className={`w-4 h-4 shrink-0 ${
                      location.pathname === '/settings' ? 'text-red-600' : 'text-slate-500'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">Pengaturan Akun</span>}
                </button>
                {isCollapsed && (
                  <div className="fixed left-[88px] px-3 py-1.5 bg-white/95 text-slate-800 text-xs font-bold rounded-xl shadow-xl border border-slate-200/90 pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap backdrop-blur-md">
                    Pengaturan Akun
                  </div>
                )}
              </div>

              {/* Logout */}
              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-200 cursor-pointer ${
                    isCollapsed
                      ? 'w-11 h-11 mx-auto justify-center'
                      : 'gap-2.5 px-3 py-2'
                  }`}
                >
                  <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                  {!isCollapsed && <span className="truncate">Keluar (Logout)</span>}
                </button>
                {isCollapsed && (
                  <div className="fixed left-[88px] px-3 py-1.5 bg-white/95 text-red-600 text-xs font-bold rounded-xl shadow-xl border border-red-200/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap backdrop-blur-md">
                    Keluar (Logout)
                  </div>
                )}
              </div>
            </div>

          </div>{/* /content z-10 */}
        </div>{/* /main body */}
      </aside>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          await logout();
          navigate('/login', { replace: true });
        }}
      />
    </>
  );
}
