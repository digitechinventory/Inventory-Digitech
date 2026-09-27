import React from 'react';
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
  LogOut,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function IronNestSidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Role-based navigation items strictly separated according to PRD / SDD
  const getNavItemsForRole = (currentRole) => {
    const normalizedRole = currentRole || 'User';

    if (normalizedRole === 'Superadmin') {
      return [
        { id: 'overview', label: 'Overview Eksekutif', icon: LayoutGrid, path: '/overview' },
        { id: 'warehouses', label: 'Rak Gudang', icon: Store, path: '/warehouses' },
        { id: 'orders', label: 'MOS Otorisasi', icon: PackageCheck, path: '/mos' },
        { id: 'opname', label: 'Stock Opname & Audit', icon: Truck, path: '/opname' },
        { id: 'inventory', label: 'Master Inventory & QR', icon: Boxes, path: '/inventory' },
        { id: 'finance', label: 'Ledger & Valuasi Aset', icon: CircleDollarSign, path: '/ledger' },
        { id: 'users', label: 'Manajemen User & Aktivasi', icon: Users, path: '/users', badge: 'Admin' },
        { id: 'tracking', label: 'GIS Asset Tracking', icon: Compass, path: '/gis' },
        { id: 'reports', label: 'Export Laporan Resmi', icon: FileSpreadsheet, path: '/reports' },
      ];
    }

    if (normalizedRole === 'Admin') {
      return [
        { id: 'adminDashboard', label: 'Panel Logistik & MOS', icon: LayoutGrid, path: '/dashboard', badge: 'Admin' },
        { id: 'warehouses', label: 'Rak Gudang', icon: Store, path: '/warehouses' },
        { id: 'orders', label: 'MOS Verifikasi', icon: PackageCheck, path: '/mos', badge: 'Verif' },
        { id: 'opname', label: 'Stock Opname Fisik', icon: Truck, path: '/opname' },
        { id: 'inventory', label: 'Katalog Stok', icon: Boxes, path: '/inventory' },
        { id: 'finance', label: 'Mutasi Stok & Ledger', icon: CircleDollarSign, path: '/ledger' },
        { id: 'tracking', label: 'Peminjaman Tools Lapangan', icon: Compass, path: '/tools' },
        { id: 'reports', label: 'Laporan Logistik Site', icon: FileSpreadsheet, path: '/reports' },
      ];
    }

    // Default 'User' (Teknisi Lapangan / Mitra Operasional)
    return [
      { id: 'dashboard', label: 'Portal Teknisi Lapangan', icon: LayoutGrid, path: '/dashboard', badge: 'Teknisi' },
      { id: 'orders', label: 'Penerimaan MOS', icon: PackageCheck, path: '/mos' },
      { id: 'inventory', label: 'Cari Material & Suku Cadang', icon: Boxes, path: '/inventory' },
      { id: 'tracking', label: 'Tools Saya & Pengembalian', icon: Compass, path: '/tools' },
    ];
  };

  const navItems = getNavItemsForRole(role);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadgeStyle = (currentRole) => {
    if (currentRole === 'Superadmin') return 'bg-red-50 text-red-700 border-red-200';
    if (currentRole === 'Admin') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-800/30 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Desktop / Mobile Collapsible Floating Dock Sidebar — Pure White Frosted Glass with Blur */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white/92 backdrop-blur-2xl text-slate-700 flex flex-col justify-between transition-all duration-300 ease-in-out border-r border-slate-200/90 shadow-[4px_0_30px_rgba(0,0,0,0.06),1px_0_4px_rgba(0,0,0,0.03)] select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20 w-64' : 'w-64'}`}
      >
        {/* Brand Header & Toggle Button */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          {/* Top Brand Section */}
          <div className={`flex items-center justify-between border-b border-slate-100 transition-all ${
            isCollapsed ? 'px-3 py-4 flex-col gap-3' : 'px-4 py-4'
          }`}>
            {isCollapsed ? (
              /* Collapsed Header: Emblem + Expand Toggle */
              <div className="flex flex-col items-center gap-3 w-full">
                <NavLink to="/dashboard" className="p-1 rounded-xl hover:bg-slate-100 transition-all" title="Digitech IMS">
                  <img
                    src="/digitech-emblem.png"
                    alt="Digitech"
                    className="h-8 w-8 object-contain rounded-lg drop-shadow-xs"
                  />
                </NavLink>
                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Perluas Menu Navigasi"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ) : (
              /* Expanded Header: Full Official Logo + Collapse Toggle */
              <>
                <NavLink to="/dashboard" className="flex items-center gap-2 group">
                  <img
                    src="/digitech-logo-light.png"
                    alt="DIGITECH"
                    className="h-8 w-auto object-contain transition-transform group-hover:scale-102"
                  />
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 shadow-2xs">
                    IMS
                  </span>
                </NavLink>

                <div className="flex items-center gap-1">
                  {/* Desktop Collapse Toggle Button */}
                  <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Ciutkan Menu Navigasi"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                  </button>

                  {/* Mobile Close Button */}
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

          {/* Role Status Tag (Visible in Expanded Mode) */}
          {!isCollapsed && (
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                Hak Akses Portal
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${getRoleBadgeStyle(role)}`}>
                {role || 'User'}
              </span>
            </div>
          )}

          {/* Dynamic Navigation Menu Items — Raised "Timbul" & Interactive */}
          <nav className={`py-3 space-y-1.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path
                || ((item.path === '/dashboard' || item.path === '/overview') && location.pathname === '/');

              return (
                <div key={item.id} className="relative group">
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center rounded-2xl transition-all duration-200 cursor-pointer ${
                      isCollapsed
                        ? 'w-11 h-11 mx-auto justify-center'
                        : 'gap-3 px-3.5 py-2.5 text-xs'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-[0_4px_16px_rgba(220,38,38,0.30)] scale-[1.02] transform'
                        : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/90 hover:translate-x-1 hover:shadow-xs'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-red-600'}`} />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-red-50 group-hover:text-red-700 group-hover:border-red-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>

                  {/* Floating Tooltip for Collapsed State */}
                  {isCollapsed && (
                    <div className="fixed left-20 ml-2.5 px-3 py-1.5 bg-white/95 text-slate-800 text-xs font-bold rounded-xl shadow-xl border border-slate-200/90 pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap backdrop-blur-md">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer: Pengaturan Akun & Logout */}
        <div className={`border-t border-slate-100 space-y-1 ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {/* Pengaturan Akun Shortcut */}
          <div className="relative group">
            <button
              onClick={() => {
                navigate('/settings');
                if (isOpen) onClose();
              }}
              className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                location.pathname === '/settings'
                  ? 'bg-red-50 text-red-700 font-bold border border-red-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              } ${
                isCollapsed
                  ? 'w-11 h-11 mx-auto justify-center'
                  : 'gap-2.5 px-3 py-2'
              }`}
            >
              <Settings className={`w-4 h-4 shrink-0 ${location.pathname === '/settings' ? 'text-red-600' : 'text-slate-500'}`} />
              {!isCollapsed && <span className="truncate">Pengaturan Akun</span>}
            </button>
            {isCollapsed && (
              <div className="fixed left-20 ml-2.5 px-3 py-1.5 bg-white/95 text-slate-800 text-xs font-bold rounded-xl shadow-xl border border-slate-200/90 pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap backdrop-blur-md">
                Pengaturan Akun
              </div>
            )}
          </div>

          {/* Logout Action */}
          <div className="relative group">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                isCollapsed
                  ? 'w-11 h-11 mx-auto justify-center'
                  : 'gap-2.5 px-3 py-2'
              }`}
            >
              <LogOut className="w-4 h-4 text-red-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Keluar (Logout)</span>}
            </button>
            {isCollapsed && (
              <div className="fixed left-20 ml-2.5 px-3 py-1.5 bg-white/95 text-red-600 text-xs font-bold rounded-xl shadow-xl border border-red-200/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap backdrop-blur-md">
                Keluar (Logout)
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
