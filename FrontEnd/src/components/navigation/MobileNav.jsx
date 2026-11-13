import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  Store,
  FileCheck2,
  FolderGit2,
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
  ChevronRight,
  Printer,
  Settings,
  FileSpreadsheet,
  History,
  Compass,
  Calendar,
  Truck,
  LayoutGrid
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LogoutConfirmModal from '../common/LogoutConfirmModal';

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const { data: mosDocs = [] } = useQuery({
    queryKey: ['approval-documents'],
    queryFn: async () => {
      try {
        const res = await api.get('/mos');
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 30000
  });

  const pendingDocsCount = Array.isArray(mosDocs)
    ? mosDocs.filter((d) => d.status !== 'completed').length
    : 0;

  const navRef = useRef(null);
  const lensRef = useRef(null);
  const tapStretchTimerRef = useRef(null);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [tapStretch, setTapStretch] = useState(null); // { scaleX, scaleY, origin }

  const normalizedRole = role || 'User';

  // Role-based 5-slot navigation items (strict role separation)
  const getNavItems = () => {
    if (normalizedRole === 'Superadmin') {
      return [
        { id: 'overview', label: 'Overview', icon: Home, path: '/overview' },
        { id: 'mos', label: 'Approval', icon: FileCheck2, path: '/mos', countBadge: pendingDocsCount },
        { id: 'projects', label: 'Proyek', icon: FolderGit2, path: '/project-inventory' },
        { id: 'users', label: 'Pengguna', icon: Users, path: '/users' },
        { id: 'account', label: 'Menu', icon: LayoutGrid, isAction: true },
      ];
    }

    if (normalizedRole === 'Admin') {
      return [
        { id: 'home', label: 'Beranda', icon: Home, path: '/dashboard' },
        { id: 'mos', label: 'Verifikasi', icon: FileCheck2, path: '/mos', countBadge: pendingDocsCount },
        { id: 'inventory', label: 'Katalog', icon: Store, path: '/inventory' },
        { id: 'opname', label: 'Opname', icon: ClipboardCheck, path: '/opname' },
        { id: 'account', label: 'Menu', icon: LayoutGrid, isAction: true },
      ];
    }

    // Default: User (Teknisi Lapangan)
    return [
      { id: 'home', label: 'Beranda', icon: Home, path: '/dashboard' },
      { id: 'mr', label: 'Ambil', icon: PackagePlus, path: '/mr' },
      { id: 'mos', label: 'Dokumen', icon: FileCheck2, path: '/mos', countBadge: pendingDocsCount },
      { id: 'projects', label: 'Proyek', icon: FolderGit2, path: '/project-inventory' },
      { id: 'account', label: 'Menu', icon: LayoutGrid, isAction: true },
    ];
  };

  const navItems = getNavItems();

  // Complete role-scoped menu items accessible inside the Liquid Glass drawer (Superadmin 12 > Admin 8 > User 6)
  const getRoleDrawerMenus = () => {
    if (normalizedRole === 'Superadmin') {
      return [
        { label: 'Overview', path: '/overview', icon: Home, color: 'text-red-600' },
        { label: 'Otorisasi MOS', path: '/mos', icon: FileCheck2, color: 'text-red-600', badge: pendingDocsCount },
        { label: 'Kelola User', path: '/users', icon: Users, color: 'text-indigo-600' },
        { label: 'Approval Opname', path: '/opname', icon: ClipboardCheck, color: 'text-amber-600' },
        { label: 'Katalog Material', path: '/inventory', icon: Store, color: 'text-sky-600' },
        { label: 'Project Site', path: '/project-inventory', icon: FolderGit2, color: 'text-blue-600' },
        { label: 'Siklus Hidup Aset', path: '/lifecycle', icon: Truck, color: 'text-purple-600' },
        { label: 'Kontrol Geofence', path: '/tracking', icon: Compass, color: 'text-emerald-600' },
        { label: 'Laporan Audit', path: '/reports', icon: FileSpreadsheet, color: 'text-emerald-700' },
        { label: 'Riwayat Mutasi', path: '/ledger', icon: History, color: 'text-slate-700' },
        { label: 'Agenda Kerja', path: '/agenda', icon: Calendar, color: 'text-rose-600' },
        { label: 'Pengaturan Akun', path: '/settings', icon: UserIcon, color: 'text-slate-700' },
      ];
    }

    if (normalizedRole === 'Admin') {
      return [
        { label: 'Panel Logistik', path: '/dashboard', icon: Home, color: 'text-red-600' },
        { label: 'Verifikasi MOS', path: '/mos', icon: FileCheck2, color: 'text-red-600', badge: pendingDocsCount },
        { label: 'Katalog Material', path: '/inventory', icon: Store, color: 'text-blue-600' },
        { label: 'Project Site', path: '/project-inventory', icon: FolderGit2, color: 'text-indigo-600' },
        { label: 'Picking List / MR', path: '/mr', icon: PackagePlus, color: 'text-sky-600' },
        { label: 'Peminjaman Tools', path: '/tools', icon: Wrench, color: 'text-purple-600' },
        { label: 'Stock Opname', path: '/opname', icon: ClipboardCheck, color: 'text-amber-600' },
        { label: 'Pengaturan Akun', path: '/settings', icon: UserIcon, color: 'text-slate-700' },
      ];
    }

    return [
      { label: 'Portal Teknisi', path: '/dashboard', icon: Home, color: 'text-red-600' },
      { label: 'Ambil Material', path: '/mr', icon: PackagePlus, color: 'text-blue-600' },
      { label: 'Status Dokumen', path: '/mos', icon: FileCheck2, color: 'text-red-600', badge: pendingDocsCount },
      { label: 'Project Site', path: '/project-inventory', icon: FolderGit2, color: 'text-indigo-600' },
      { label: 'Pinjam Tools', path: '/tools', icon: Wrench, color: 'text-purple-600' },
      { label: 'Pengaturan Akun', path: '/settings', icon: UserIcon, color: 'text-slate-700' },
    ];
  };

  const roleDrawerMenus = getRoleDrawerMenus();

  // Determine active item index based on current location (secondary routes highlight Menu tab)
  const getActiveIndex = () => {
    const currentPath = location.pathname;
    if (isAccountDrawerOpen) return navItems.length - 1;
    const foundIndex = navItems.findIndex(
      (item) => !item.isAction && (item.path === currentPath || (item.path !== '/dashboard' && currentPath.startsWith(item.path)))
    );
    if (foundIndex !== -1) return foundIndex;
    const onDrawerRoute = roleDrawerMenus.some(
      (m) => currentPath === m.path || (m.path !== '/dashboard' && currentPath.startsWith(m.path))
    );
    return onDrawerRoute ? navItems.length - 1 : 0;
  };

  const [activeIndex, setActiveIndex] = useState(getActiveIndex);

  useEffect(() => {
    setActiveIndex(getActiveIndex());
  }, [location.pathname, normalizedRole, isAccountDrawerOpen]);

  // Handle clicking or snapping to a tab with elastic liquid stretch
  const triggerLiquidTapPulse = (fromIdx, toIdx) => {
    const distance = Math.abs(toIdx - fromIdx);
    if (distance === 0) return;
    if (tapStretchTimerRef.current) clearTimeout(tapStretchTimerRef.current);
    const stretchX = Math.min(1.32, 1.12 + distance * 0.06);
    const squashY = Math.max(0.86, 0.94 - distance * 0.02);
    setTapStretch({
      scaleX: stretchX,
      scaleY: squashY,
      origin: toIdx > fromIdx ? 'left center' : 'right center'
    });
    tapStretchTimerRef.current = setTimeout(() => {
      setTapStretch(null);
    }, 170);
  };

  const handleItemClick = (item, index) => {
    triggerLiquidTapPulse(activeIndex, index);
    if (item.isAction) {
      if (item.id === 'account') {
        setIsAccountDrawerOpen(true);
      }
      return;
    }
    setIsAccountDrawerOpen(false);
    setActiveIndex(index);
    navigate(item.path);
  };

  // horizontal screen swipe event listener
  useEffect(() => {
    const handleSwipeTab = (e) => {
      const direction = e.detail?.direction;
      if (!direction) return;

      setActiveIndex((prev) => {
        let target = prev;
        if (direction === 'next' && prev < navItems.length - 1) {
          target = prev + 1;
        } else if (direction === 'prev' && prev > 0) {
          target = prev - 1;
        }

        if (target !== prev) {
          const targetItem = navItems[target];
          if (targetItem.isAction) {
            if (targetItem.id === 'account') {
              setIsAccountDrawerOpen(true);
            }
          } else {
            setIsAccountDrawerOpen(false);
            navigate(targetItem.path);
          }
        }
        return target;
      });
    };

    window.addEventListener('app:swipe-tab', handleSwipeTab);
    return () => window.removeEventListener('app:swipe-tab', handleSwipeTab);
  }, [navItems, navigate]);

  // Pointer / Touch Drag & Fluid Direct-GPU Liquid Lens Physics
  const [isDragging, setIsDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState(null);
  const [dragDirection, setDragDirection] = useState(0); // -1: left, 1: right
  const [dragVelocity, setDragVelocity] = useState(0);

  const pointerStartPos = useRef({ x: 0, y: 0, lastX: 0, lastTime: 0 });
  const isPointerDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const draggedRecentlyRef = useRef(false);
  const rafRef = useRef(null);

  const applyFluidLensTransform = (ratio, velX) => {
    if (!lensRef.current) return;
    const slotPos = Math.max(0, Math.min((navItems.length - 1) * 100, (ratio * navItems.length - 0.5) * 100));
    const speedMag = Math.min(Math.abs(velX), 1.8);
    const sX = 1.08 + speedMag * 0.14;
    const sY = 0.94 - speedMag * 0.04;
    const origin = velX >= 0 ? 'left center' : 'right center';
    lensRef.current.style.transformOrigin = origin;
    lensRef.current.style.transform = `translate3d(${slotPos}%, 0, 0) scaleX(${sX.toFixed(3)}) scaleY(${sY.toFixed(3)})`;
  };

  const updatePointerPosition = (clientX) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedRatio = Math.max(0, Math.min(1, x / rect.width));
    const now = performance.now();
    const dt = Math.max(8, now - (pointerStartPos.current.lastTime || now));
    const vx = (clientX - (pointerStartPos.current.lastX ?? clientX)) / dt;
    pointerStartPos.current.lastX = clientX;
    pointerStartPos.current.lastTime = now;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      applyFluidLensTransform(clampedRatio, vx);
    });

    setDragVelocity(vx);
    setDragRatio(clampedRatio);
  };

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    pointerStartPos.current = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastTime: performance.now() };
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    const deltaX = e.clientX - pointerStartPos.current.x;
    const deltaY = e.clientY - pointerStartPos.current.y;

    if (!hasDraggedRef.current && Math.hypot(deltaX, deltaY) > 5) {
      hasDraggedRef.current = true;
      setIsDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch { }
    }

    if (hasDraggedRef.current) {
      updatePointerPosition(e.clientX);
      setDragDirection(deltaX > 0 ? 1 : -1);
    }
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { }

    if (hasDraggedRef.current && dragRatio !== null) {
      draggedRecentlyRef.current = true;
      setTimeout(() => {
        draggedRecentlyRef.current = false;
      }, 160);

      const targetIndex = Math.min(
        Math.max(Math.floor(dragRatio * navItems.length), 0),
        navItems.length - 1
      );
      handleItemClick(navItems[targetIndex], targetIndex);
    } else if (!hasDraggedRef.current) {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x >= 0 && x <= rect.width) {
          const tappedIndex = Math.min(
            Math.max(Math.floor((x / rect.width) * navItems.length), 0),
            navItems.length - 1
          );
          handleItemClick(navItems[tappedIndex], tappedIndex);
        }
      }
    }

    setIsDragging(false);
    setDragRatio(null);
    setDragDirection(0);
    setDragVelocity(0);
    hasDraggedRef.current = false;
  };

  const handlePointerCancel = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    isPointerDownRef.current = false;
    setIsDragging(false);
    setDragRatio(null);
    setDragDirection(0);
    setDragVelocity(0);
    hasDraggedRef.current = false;
  };

  const handleButtonClick = (item, index, e) => {
    if (hasDraggedRef.current || isDragging || draggedRecentlyRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handleItemClick(item, index);
  };

  const slotPercent = 100 / navItems.length;

  const calculatedSlotPos = isDragging && dragRatio !== null
    ? Math.max(0, Math.min((navItems.length - 1) * 100, (dragRatio * navItems.length - 0.5) * 100))
    : activeIndex * 100;

  const highlightedIndex = isDragging && dragRatio !== null
    ? Math.min(Math.max(Math.floor(dragRatio * navItems.length), 0), navItems.length - 1)
    : activeIndex;

  // Fluid elastic liquid droplet deformation during both drag & tap spring transitions
  const velocityStretch = isDragging ? 1.1 + Math.min(Math.abs(dragVelocity), 1.6) * 0.12 : (tapStretch?.scaleX || 1);
  const velocitySquash = isDragging ? 0.93 : (tapStretch?.scaleY || 1);
  const liquidOrigin = tapStretch?.origin || (dragDirection > 0 ? 'left center' : dragDirection < 0 ? 'right center' : 'center');

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING APPLE-STYLE LIQUID GLASS CAPSULE NAVBAR (lg:hidden)
      ───────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-3.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-[396px] lg:hidden select-none pointer-events-auto nav-safe-bottom"
      >
        {/* Outer Floating Apple Liquid Glass Dock with Optical Refraction */}
        <div
          ref={navRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`relative w-full h-[56px] rounded-full p-1 flex items-center justify-between transition-transform duration-300 ease-[cubic-bezier(0.22,1.38,0.36,1)] touch-none select-none ${isDragging ? 'cursor-grabbing scale-[1.022]' : 'cursor-grab'
            }`}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 246, 246, 0.46) 100%)',
            backdropFilter: 'blur(34px) saturate(210%) contrast(106%)',
            WebkitBackdropFilter: 'blur(34px) saturate(210%) contrast(106%)',
            border: '1px solid rgba(255, 255, 255, 0.88)',
            boxShadow: isDragging
              ? '0 24px 52px -8px rgba(220, 38, 38, 0.22), 0 10px 24px -4px rgba(15, 23, 42, 0.14), inset 0 1.5px 2px 0 rgba(255, 255, 255, 1)'
              : '0 16px 40px -6px rgba(15, 23, 42, 0.14), 0 4px 16px -2px rgba(220, 38, 38, 0.08), inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.98), inset 0 -1px 1px 0 rgba(15, 23, 42, 0.04)'
          }}
        >
          {/* Fluid Sliding Optical Liquid Glass Droplet */}
          <div
            ref={lensRef}
            className={`absolute top-1 bottom-1 pointer-events-none z-0 ${isDragging
              ? 'transition-none'
              : 'transition-transform duration-[460ms] ease-[cubic-bezier(0.22,1.38,0.36,1)]'
              }`}
            style={{
              width: `calc(${slotPercent}% - 4px)`,
              left: '2px',
              willChange: 'transform',
              transform: `translate3d(${calculatedSlotPos}%, 0, 0) scaleX(${velocityStretch}) scaleY(${velocitySquash})`,
              transformOrigin: liquidOrigin,
            }}
          >
            {/* Translucent Multi-layer Liquid Glass Droplet with Crimson Refraction */}
            <div
              className={`relative w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${isDragging
                ? 'shadow-[0_10px_28px_rgba(220,38,38,0.22),0_3px_10px_rgba(15,23,42,0.12),inset_0_1.5px_2px_rgba(255,255,255,1)]'
                : 'shadow-[0_4px_16px_rgba(220,38,38,0.14),0_2px_6px_rgba(15,23,42,0.08),inset_0_1.5px_1.5px_rgba(255,255,255,1)]'
                }`}
              style={{
                background: 'linear-gradient(155deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 241, 242, 0.68) 100%)',
                backdropFilter: 'blur(12px) brightness(1.06)',
                WebkitBackdropFilter: 'blur(12px) brightness(1.06)',
                border: '0.75px solid rgba(255, 255, 255, 0.92)',
              }}
            >
              {/* Specular Top Edge Arc */}
              <div className="absolute top-0 inset-x-2 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95" />
              {/* Subtle Inner Crimson Rim Refraction */}
              <div className="absolute bottom-0 inset-x-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-red-400/35 to-transparent" />
            </div>
          </div>

          {/* Interactive Navigation Item Slots */}
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isSelected = highlightedIndex === index && !isAccountDrawerOpen;

            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleButtonClick(item, index, e)}
                className="relative z-10 flex-1 h-full rounded-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-transform active:scale-92"
                aria-label={item.label}
              >
                {/* Icon with Magnetic Fluid Lift on Active */}
                <div className={`relative transition-all duration-300 ease-[cubic-bezier(0.22,1.38,0.36,1)] ${isSelected ? '-translate-y-0.5 scale-110' : 'translate-y-0 scale-100'}`}>
                  <Icon
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors duration-200 ${isSelected
                      ? 'text-red-600'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                    strokeWidth={isSelected ? 2.35 : 1.85}
                  />
                  {item.countBadge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-600 text-white text-[8px] font-mono font-bold flex items-center justify-center shadow-2xs ring-1 ring-white">
                      {item.countBadge > 99 ? '99+' : item.countBadge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[9px] sm:text-[9.5px] font-sans tracking-tight transition-all duration-200 leading-none ${isSelected
                    ? 'font-bold text-red-600'
                    : 'font-medium text-slate-600'
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
            className="absolute inset-0 bg-slate-800/50 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Drawer Container */}
          <div className="relative z-10 w-full max-w-[480px] max-h-[86vh] overflow-y-auto mx-auto bg-white rounded-t-[32px] p-5 sm:p-6 pb-10 shadow-[0_-15px_40px_rgba(0,0,0,0.2)] border-t border-slate-200/80 animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-4" />

            {/* Header: User Info & Close Button */}
            <div className="flex items-start justify-between gap-3 mb-4">
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

            {/* ── Menu Lengkap Sesuai Role (Pengganti Sidebar di Mobile) ── */}
            <div className="mb-4">
              <div className="flex items-center justify-between gap-1.5 mb-2 px-1">
                <span className="flex items-center gap-1.5">
                  <Settings className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {normalizedRole === 'Superadmin'
                      ? 'Menu Otoritas Eksekutif'
                      : normalizedRole === 'Admin'
                        ? 'Menu Supervisor Gudang'
                        : 'Menu Teknisi Lapangan'}
                  </span>
                </span>
                <span className="text-[9.5px] font-mono font-bold text-slate-400">
                  {roleDrawerMenus.length} Fitur
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {roleDrawerMenus.map((menu) => {
                  const MenuIcon = menu.icon;
                  const isCurrent =
                    location.pathname === menu.path ||
                    (menu.path !== '/dashboard' && location.pathname.startsWith(menu.path));
                  return (
                    <button
                      key={menu.path}
                      type="button"
                      onClick={() => {
                        setIsAccountDrawerOpen(false);
                        navigate(menu.path);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-red-50/90 border-red-300 text-red-700 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 shadow-2xs'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrent ? 'bg-red-600 text-white' : 'bg-slate-100'
                          }`}
                        >
                          <MenuIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : menu.color}`} />
                        </span>
                        <span className="text-[11px] font-bold leading-tight truncate">
                          {menu.label}
                        </span>
                      </span>
                      {menu.badge > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold shrink-0">
                          {menu.badge}
                        </span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout Action Button */}
            <button
              onClick={() => {
                setShowLogoutConfirm(true);
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(220,38,38,0.3)] active:scale-98 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setIsAccountDrawerOpen(false);
          await logout();
          navigate('/login');
        }}
      />
    </>
  );
}
