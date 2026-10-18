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
  ChevronRight,
  Printer,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LogoutConfirmModal from '../common/LogoutConfirmModal';
import PrinterSetupModal from '../printer/PrinterSetupModal';

/**
 * Mobile Bottom Floating Liquid Glass Capsule Navbar
 * Inspired by WhatsApp Swipe Navigation & Liquid Glassmorphism Aesthetics
 * 
 * Features:
 * - Fluid Liquid Glass Capsule with dynamic blur, specular reflection, and crimson glow
 * - Sliding Liquid Lens Indicator that tracks touch drag continuously like a slider
 * - WhatsApp-style horizontal screen swipe listener (window 'app:swipe-tab')
 * - Snappy spring physics on release
 * - Role-adaptive 5-slot navigation tabs (User, Admin, Superadmin)
 * - Interactive Account Profile Drawer
 */
export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const navRef = useRef(null);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);

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

  // Handle clicking or snapping to a tab
  const handleItemClick = (item, index) => {
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

  // WhatsApp-style horizontal screen swipe event listener
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

  // Pointer / Touch Drag & Slider Support on the navbar itself
  const [isDragging, setIsDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState(null);
  const [dragDirection, setDragDirection] = useState(0); // -1: left, 1: right

  const pointerStartPos = useRef({ x: 0, y: 0, time: 0 });
  const isPointerDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const draggedRecentlyRef = useRef(false);

  const updatePointerPosition = (clientX) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedRatio = Math.max(0, Math.min(1, x / rect.width));
    setDragRatio(clampedRatio);
  };

  const handlePointerDown = (e) => {
    // Only primary mouse button or touch
    if (e.button !== undefined && e.button !== 0) return;
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    pointerStartPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    // NOTE: Do NOT setPointerCapture here so child buttons can receive normal click events if it's a tap!
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    const deltaX = e.clientX - pointerStartPos.current.x;
    const deltaY = e.clientY - pointerStartPos.current.y;

    // Detect intentional drag movement (> 6px)
    if (!hasDraggedRef.current && Math.hypot(deltaX, deltaY) > 6) {
      hasDraggedRef.current = true;
      setIsDragging(true);
      // Once user is definitely dragging, capture the pointer
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }

    if (hasDraggedRef.current) {
      updatePointerPosition(e.clientX);
      setDragDirection(deltaX > 0 ? 1 : -1);
    }
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

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
      // Tap / Click fallback: resolve which tab was clicked directly from pointer coordinates
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
    hasDraggedRef.current = false;
  };

  const handlePointerCancel = () => {
    isPointerDownRef.current = false;
    setIsDragging(false);
    setDragRatio(null);
    setDragDirection(0);
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

  // Real-time Slider Position calculation (smooth continuous position during dragging)
  const calculatedSlotPos = isDragging && dragRatio !== null
    ? Math.max(0, Math.min((navItems.length - 1) * 100, (dragRatio * navItems.length - 0.5) * 100))
    : activeIndex * 100;

  // Active or dragged highlight index
  const highlightedIndex = isDragging && dragRatio !== null
    ? Math.min(Math.max(Math.floor(dragRatio * navItems.length), 0), navItems.length - 1)
    : activeIndex;

  // Elastic liquid deformation during sliding ala iOS
  const liquidScaleX = isDragging ? 1.08 : 1;
  const liquidOrigin = dragDirection > 0 ? 'left center' : dragDirection < 0 ? 'right center' : 'center';

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING APPLE-STYLE LIQUID GLASS CAPSULE NAVBAR (lg:hidden)
      ───────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-3.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-[390px] lg:hidden select-none pointer-events-auto nav-safe-bottom"
      >
        {/* Outer Floating Apple Liquid Glass Dock with Refraction & Specular Bevel */}
        <div
          ref={navRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`relative w-full h-[54px] rounded-full p-1 flex items-center justify-between transition-all duration-300 touch-none select-none ${
            isDragging ? 'cursor-grabbing scale-[1.01]' : 'cursor-grab'
          }`}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 100%)',
            backdropFilter: 'blur(30px) saturate(190%) contrast(105%)',
            WebkitBackdropFilter: 'blur(30px) saturate(190%) contrast(105%)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: isDragging
              ? '0 24px 50px -6px rgba(0, 0, 0, 0.18), 0 8px 20px -4px rgba(0, 0, 0, 0.10), inset 0 1px 1px 0 rgba(255, 255, 255, 1)'
              : '0 16px 40px -6px rgba(0, 0, 0, 0.12), 0 4px 14px -2px rgba(0, 0, 0, 0.06), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.03)'
          }}
        >
          {/* Sliding Apple-style Liquid Glass Lens */}
          <div
            className={`absolute top-1 bottom-1 pointer-events-none z-0 ${
              isDragging
                ? 'transition-none'
                : 'transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]'
            }`}
            style={{
              width: `calc(${slotPercent}% - 4px)`,
              left: '2px',
              transform: `translateX(${calculatedSlotPos}%) scaleX(${liquidScaleX})`,
              transformOrigin: liquidOrigin,
            }}
          >
            {/* Pure Optical White Liquid Lens with Apple Soft Depth Shadow */}
            <div
              className={`relative w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
                isDragging
                  ? 'shadow-[0_8px_24px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,1)]'
                  : 'shadow-[0_3px_12px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
              }`}
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                border: '0.5px solid rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Apple Specular Gloss Line at top edge */}
              <div className="absolute top-0 inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95" />
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
                className="relative z-10 flex-1 h-full rounded-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-transform active:scale-95"
                aria-label={item.label}
              >
                {/* Icon with Apple Spring Pop on Active */}
                <div className="transition-transform duration-200">
                  <Icon
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-all duration-200 ${
                      isSelected
                        ? 'text-red-600 scale-105'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    strokeWidth={isSelected ? 2.3 : 1.85}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-[9px] sm:text-[9.5px] font-sans tracking-tight transition-all duration-200 leading-none ${
                    isSelected
                      ? 'font-bold text-red-600 scale-105'
                      : 'font-medium text-slate-500'
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

            {/* ── Pengaturan Section ── */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <Settings className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pengaturan</span>
              </div>
              <div className="space-y-1.5 pl-1 border-l-2 border-red-100">
                <button
                  onClick={() => { setIsAccountDrawerOpen(false); navigate('/settings'); }}
                  className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 font-bold text-xs flex items-center justify-between px-4 shadow-2xs transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <UserIcon className="w-4 h-4 text-red-600" />
                    Pengaturan Akun &amp; Keamanan
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => { setIsAccountDrawerOpen(false); setShowPrinterSetup(true); }}
                  className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 font-bold text-xs flex items-center justify-between px-4 shadow-2xs transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Printer className="w-4 h-4 text-red-600" />
                    Pengaturan Web (Printer QR)
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
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

      {/* Printer Setup Modal for Mobile */}
      <PrinterSetupModal
        isOpen={showPrinterSetup}
        onClose={() => setShowPrinterSetup(false)}
      />
    </>
  );
}
