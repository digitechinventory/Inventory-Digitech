import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Store,
  FileCheck2,
  PackagePlus,
  Wrench,
  ClipboardCheck,
  Users,
  ScrollText,
  User as UserIcon,
  LogOut,
  X,
  ShieldCheck,
  Building2,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Mobile Bottom Floating Glassmorphism Capsule Navbar
 * Inspired by Dribbble Mobile Nav with Liquid Gliding Lens Indicator
 * 
 * Features:
 * - Floating rounded capsule docked at bottom center on mobile devices (lg:hidden)
 * - Prismatic liquid glass lens indicator with physics spring glide transition
 * - Role-adaptive 5-slot navigation tabs (User, Admin, Superadmin)
 * - Digitech brand colors: Clean white capsule, crimson/rose active indicator (#DC2626)
 * - Interactive Account Drawer for viewing profile details & logout
 */
export default function DribbbleMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

  const normalizedRole = role || 'User';

  // Role-based 5-slot navigation items
  const getNavItems = () => {
    if (normalizedRole === 'Superadmin') {
      return [
        { id: 'home', label: 'Beranda', icon: Home, path: '/dashboard' },
        { id: 'inventory', label: 'Katalog', icon: Store, path: '/inventory' },
        { id: 'mos', label: 'MOS', icon: FileCheck2, path: '/mos' },
        { id: 'users', label: 'Pengguna', icon: Users, path: '/users' },
        { id: 'account', label: 'Akun', icon: UserIcon, isAction: true },
      ];
    }

    if (normalizedRole === 'Admin') {
      return [
        { id: 'home', label: 'Beranda', icon: Home, path: '/dashboard' },
        { id: 'inventory', label: 'Katalog', icon: Store, path: '/inventory' },
        { id: 'mos', label: 'MOS', icon: FileCheck2, path: '/mos' },
        { id: 'opname', label: 'Opname', icon: ClipboardCheck, path: '/opname' },
        { id: 'account', label: 'Akun', icon: UserIcon, isAction: true },
      ];
    }

    // Default: User (Teknisi Lapangan)
    return [
      { id: 'home', label: 'Beranda', icon: Home, path: '/dashboard' },
      { id: 'inventory', label: 'Katalog', icon: Store, path: '/inventory' },
      { id: 'mos', label: 'MOS', icon: FileCheck2, path: '/mos' },
      { id: 'mr', label: 'Ambil', icon: PackagePlus, path: '/mr' },
      { id: 'account', label: 'Akun', icon: UserIcon, isAction: true },
    ];
  };

  const navItems = getNavItems();

  // Determine active item index based on current location
  const getActiveIndex = () => {
    const currentPath = location.pathname;
    const foundIndex = navItems.findIndex(
      (item) => !item.isAction && (item.path === currentPath || (item.path !== '/dashboard' && currentPath.startsWith(item.path)))
    );
    return foundIndex !== -1 ? foundIndex : 0;
  };

  const [activeIndex, setActiveIndex] = useState(getActiveIndex);

  useEffect(() => {
    setActiveIndex(getActiveIndex());
  }, [location.pathname, normalizedRole]);

  const handleItemClick = (item, index) => {
    if (item.isAction) {
      if (item.id === 'account') {
        setIsAccountDrawerOpen(true);
      }
      return;
    }
    setActiveIndex(index);
    navigate(item.path);
  };

  const slotPercent = 100 / navItems.length;

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING LIQUID GLASS CAPSULE NAVBAR (lg:hidden)
      ───────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-[420px] lg:hidden select-none pointer-events-auto"
      >
        {/* Outer Floating Liquid Glass Capsule with Specular Highlight */}
        <div
          className="relative w-full h-[68px] rounded-full p-1.5 flex items-center justify-between transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.52) 100%)',
            backdropFilter: 'blur(32px) saturate(210%) brightness(105%)',
            WebkitBackdropFilter: 'blur(32px) saturate(210%) brightness(105%)',
            border: '1.5px solid rgba(255, 255, 255, 0.88)',
            boxShadow: '0 20px 48px -8px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.55) inset, 0 2px 4px 0 rgba(255, 255, 255, 0.95) inset'
          }}
        >
          {/* Sliding Liquid Glass Lens */}
          <div
            className="absolute top-1.5 bottom-1.5 pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
            style={{
              width: `calc(${slotPercent}% - 4px)`,
              left: '2px',
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          >
            {/* Liquid Lens Capsule with Specular Reflection & Prismatic Rim */}
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(254, 242, 242, 0.88) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 6px 18px rgba(220, 38, 38, 0.22), inset 0 2px 3px rgba(255, 255, 255, 1), inset 0 -2px 3px rgba(220, 38, 38, 0.08)'
              }}
            >
              {/* Specular Liquid Glint Highlight */}
              <div className="absolute top-1 left-2 right-2 h-1.5 bg-gradient-to-r from-transparent via-white to-transparent rounded-full opacity-90 blur-[0.3px]" />
              {/* Bottom Liquid Depth Highlight */}
              <div className="absolute bottom-0.5 inset-x-3 h-1 bg-gradient-to-r from-transparent via-red-500/25 to-transparent rounded-full" />
            </div>
          </div>

          {/* Interactive Navigation Item Slots */}
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeIndex === index && !isAccountDrawerOpen;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item, index)}
                className="relative z-10 flex-1 h-full rounded-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-transform active:scale-92"
                aria-label={item.label}
              >
                {/* Icon with Spring Lift on Active */}
                <div className="transition-transform duration-200">
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive
                        ? 'text-red-600 scale-110 drop-shadow-[0_2px_8px_rgba(220,38,38,0.4)]'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-sans tracking-tight transition-all duration-200 leading-none ${
                    isActive
                      ? 'font-black text-red-600 scale-105'
                      : 'font-semibold text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE ACCOUNT PROFILE DRAWER (Slide up when tapping Akun)
      ───────────────────────────────────────────────────────────── */}
      {isAccountDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end select-none">
          {/* Backdrop Blur */}
          <div
            onClick={() => setIsAccountDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Drawer Container */}
          <div className="relative z-10 w-full max-w-[480px] mx-auto bg-white rounded-t-[32px] p-6 pb-12 shadow-[0_-15px_40px_rgba(0,0,0,0.2)] border-t border-slate-200/80 animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-5" />

            {/* Header: User Info & Close Button */}
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center font-black text-xl shadow-[0_4px_16px_rgba(220,38,38,0.35)]">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {user?.full_name || 'Masamune'}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {user?.email || 'user@digitech.co.id'}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-red-600" />
                    <span>{normalizedRole}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsAccountDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Meta Details Cards */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <Building2 className="w-4 h-4 text-slate-400" /> Perusahaan / Divisi
                </span>
                <span className="font-bold text-slate-900">
                  {user?.company || 'DIGITECH'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400" /> Site Operasional
                </span>
                <span className="font-bold text-slate-900">
                  {user?.site_id || 'Pit South Site BIB-02'}
                </span>
              </div>
            </div>

            {/* Pengaturan Akun & Keamanan Link */}
            <button
              onClick={() => {
                setIsAccountDrawerOpen(false);
                navigate('/settings');
              }}
              className="w-full py-3 mb-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 font-bold text-xs flex items-center justify-between px-4 shadow-2xs transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <UserIcon className="w-4 h-4 text-red-600" />
                Pengaturan Akun &amp; Keamanan MFA
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Logout Action Button */}
            <button
              onClick={async () => {
                setIsAccountDrawerOpen(false);
                await logout();
                navigate('/login');
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(220,38,38,0.3)] active:scale-98 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
