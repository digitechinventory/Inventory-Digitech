import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid,
  Store,
  PackageCheck,
  PackagePlus,
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
  FolderGit2,
  Printer,
  User,
  ChevronDown,
  ChevronRight,
  History,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import api from '../../api/client.js';
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

  // Live pending document count shared with MOSPage ('approval-documents')
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
  const pendingBadge = pendingDocsCount > 0 ? `${pendingDocsCount} Pending` : undefined;

  const getNavGroupsForRole = (currentRole) => {
    const normalizedRole = currentRole || 'User';

    if (normalizedRole === 'Superadmin') {
      return [
        {
          id: 'grp-executive',
          title: 'Otoritas Eksekutif',
          items: [
            { id: 'overview', label: 'Overview', icon: LayoutGrid, path: '/overview' },
            { id: 'mos', label: 'Otorisasi Dokumen', icon: FileCheck2, path: '/mos', badge: pendingBadge, isAlertBadge: true },
            { id: 'users', label: 'Kelola User', icon: Users, path: '/users' },
            { id: 'opname', label: 'Approval Stock Opname', icon: PackageCheck, path: '/opname' },
          ]
        },
        {
          id: 'grp-warehouse',
          title: 'Aset & Kontrol Site',
          items: [
            { id: 'inventory', label: 'Katalog Material', icon: Boxes, path: '/inventory' },
            { id: 'projectInventory', label: 'Project Site', icon: FolderGit2, path: '/project-inventory' },
            { id: 'lifecycle', label: 'Siklus Hidup Aset', icon: Truck, path: '/lifecycle' },
            { id: 'tracking', label: 'Kontrol Geofence & GIS', icon: Compass, path: '/tracking' },
          ]
        },
        {
          id: 'grp-audit',
          title: 'Audit & Pelaporan',
          items: [
            { id: 'reports', label: 'Laporan Audit', icon: FileSpreadsheet, path: '/reports' },
            { id: 'finance', label: 'Riwayat Mutasi Stok', icon: History, path: '/ledger' },
            { id: 'agenda', label: 'Agenda Kerja', icon: Calendar, path: '/agenda' },
          ]
        }
      ];
    }

    if (normalizedRole === 'Admin') {
      return [
        {
          id: 'grp-main',
          title: 'Operasional Gudang',
          items: [
            { id: 'adminDashboard', label: 'Panel Logistik', icon: LayoutGrid, path: '/dashboard' },
            { id: 'inventory', label: 'Katalog Material', icon: Boxes, path: '/inventory' },
            { id: 'projectInventory', label: 'Project Site', icon: FolderGit2, path: '/project-inventory' },
          ]
        },
        {
          id: 'grp-warehouse',
          title: 'Eksekusi & Verifikasi',
          items: [
            { id: 'mos', label: 'Verifikasi Dokumen', icon: FileCheck2, path: '/mos', badge: pendingBadge, isAlertBadge: true },
            { id: 'mr', label: 'Picking List / MR', icon: PackagePlus, path: '/mr' },
            { id: 'tools', label: 'Peminjaman Tools', icon: Compass, path: '/tools' },
            { id: 'opname', label: 'Stock Opname Fisik', icon: PackageCheck, path: '/opname' },
          ]
        },
      ];
    }

    return [
      {
        id: 'grp-main',
        title: 'Portal Teknisi',
        items: [
          { id: 'dashboard', label: 'Portal Teknisi', icon: LayoutGrid, path: '/dashboard' },
          { id: 'mr', label: 'Ambil Material (MR)', icon: PackagePlus, path: '/mr' },
          { id: 'tools', label: 'Pinjam Tools', icon: Compass, path: '/tools' },
        ]
      },
      {
        id: 'grp-warehouse',
        title: 'Dokumen & Site',
        items: [
          { id: 'mos', label: 'Status Dokumen Saya', icon: FileCheck2, path: '/mos', badge: pendingBadge, isAlertBadge: true },
          { id: 'projectInventory', label: 'Project Site', icon: FolderGit2, path: '/project-inventory' },
        ]
      },
    ];
  };

  const navGroups = getNavGroupsForRole(role);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const getRoleBadgeStyle = (currentRole) => {
    if (currentRole === 'Superadmin') return 'bg-red-50 text-red-700 border-red-200';
    if (currentRole === 'Admin') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const sidebarWidth = isCollapsed ? 'w-[76px]' : 'w-[272px]';

  return (
    <>
      {/* Shared Mega Mendung SVG defs rendered once to avoid duplicate gradient IDs */}
      <svg width="0" height="0" aria-hidden="true" className="absolute pointer-events-none">
        <MegaMendungDefs />
      </svg>

      {/* ── Floating Sidebar Wrapper (Desktop Only — Mobile uses Liquid Glass Bottom Navbar) ── */}
      <aside
        style={{ willChange: 'width', contain: 'layout style' }}
        className={`hidden lg:block fixed top-4 bottom-4 left-3 z-50 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] select-none ${sidebarWidth}`}
      >
        {/* ── Layer 2: Shadow / Accent Parallelogram (behind main body) ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate3d(6px, 6px, 0)',
            clipPath: CLIP_SHADOW,
            zIndex: 0,
            pointerEvents: 'none',
            contain: 'strict',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(160deg, #7F1D1D 0%, #B91C1C 40%, #DC2626 70%, #EF4444 100%)',
              opacity: 0.55,
            }}
          />
        </div>
        {/* ── Layer 3: Far shadow (depth) ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate3d(11px, 11px, 0)',
            clipPath: CLIP_SHADOW,
            zIndex: -1,
            pointerEvents: 'none',
            contain: 'strict',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'rgba(127,29,29,0.16)',
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
          {/* ── Corner Ornament: TOP-LEFT Mega Mendung (Fixed size, zero re-rasterize) ─── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '116px',
              height: '116px',
              pointerEvents: 'none',
              zIndex: 1,
              opacity: 0.9,
              contain: 'strict',
            }}
          >
            <svg viewBox="-5 -5 160 160" style={{ width: '100%', height: '100%', display: 'block' }}>
              <use href="#sbMegaMendungShape" x="0" y="0" />
            </svg>
          </div>

          {/* ── Corner Ornament: BOTTOM-RIGHT Mega Mendung (Fixed size, zero re-rasterize) ─── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '140px',
              height: '140px',
              pointerEvents: 'none',
              zIndex: 1,
              opacity: 0.95,
              contain: 'strict',
            }}
          >
            <svg viewBox="-5 -5 160 160" style={{ width: '100%', height: '100%', display: 'block' }}>
              <use href="#sbMegaMendungShape" transform="rotate(180, 75, 75)" />
            </svg>
          </div>

          {/* ── All content sits ABOVE ornaments (z-index: 10+) ─────── */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* ── Brand Header (Single unified DOM tree — zero snap/remount) ── */}
            <div
              style={{
                background: 'transparent',
                borderBottom: '1px solid rgba(226,232,240,0.6)',
              }}
              className={`relative flex items-center px-3.5 pt-11 transition-[padding-bottom] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isCollapsed ? 'pb-11' : 'pb-3.5'
              }`}
            >
              <NavLink
                to={role === 'Superadmin' ? '/overview' : '/dashboard'}
                className="flex items-center group min-w-0 relative z-20"
                title="Digitech IMS"
              >
                <div className="w-10 h-10 rounded-xl bg-white p-1.5 shadow-[0_4px_12px_rgba(185,28,28,0.16)] border border-red-100/90 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <img
                    src="/digitech-emblem.png"
                    alt="Digitech"
                    className="w-full h-full object-contain block"
                  />
                </div>
                <div
                  className={`flex flex-col justify-center min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isCollapsed ? 'max-w-0 opacity-0 ml-0 pointer-events-none' : 'max-w-[165px] opacity-100 ml-2.5'
                  }`}
                >
                  <span
                    style={{
                      lineHeight: 1.05,
                      textShadow: '0 1px 8px rgba(255,255,255,0.95), 0 0 12px rgba(255,255,255,0.95)'
                    }}
                    className="text-[15px] font-black tracking-wider text-slate-950 group-hover:text-red-700 transition-colors uppercase"
                  >
                    DIGITECH
                  </span>
                  <span
                    style={{
                      lineHeight: 1.2,
                      textShadow: '0 1px 6px rgba(255,255,255,0.95)'
                    }}
                    className="text-[9.5px] font-bold text-red-600 tracking-tight truncate mt-0.5"
                  >
                    Inventory Management
                  </span>
                </div>
              </NavLink>

              {/* Smoothly Gliding Collapse / Expand Button */}
              <button
                onClick={onToggleCollapse}
                style={{
                  top: isCollapsed ? '90px' : '49px',
                  right: isCollapsed ? '21px' : '14px',
                }}
                className="hidden lg:flex absolute items-center justify-center w-[30px] h-[30px] rounded-xl bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200/90 shadow-2xs transition-[top,right,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer z-20"
                title={isCollapsed ? 'Perluas Menu Navigasi' : 'Ciutkan Menu'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>

            {/* ── Role Badge Strip (Smooth max-height collapse) ─────────── */}
            <div
              className={`px-4 bg-slate-50/80 flex items-center justify-between overflow-hidden whitespace-nowrap transition-[max-height,opacity,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isCollapsed ? 'max-h-0 opacity-0 py-0 border-b-0' : 'max-h-10 opacity-100 py-2 border-b border-slate-100'
              }`}
            >
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                Hak Akses Portal
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${getRoleBadgeStyle(role)}`}>
                {role || 'User'}
              </span>
            </div>

            {/* ── Grouped Navigation Items (Constant left icon anchor — zero layout jump) ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2 custom-scrollbar overflow-x-hidden">
              {navGroups.map((group, groupIdx) => (
                <div key={group.id} className="space-y-1">
                  {/* Group Header Label — Fixed height cross-fade so vertical spacing never shifts */}
                  <div className="relative h-6 flex items-center px-3 select-none overflow-hidden">
                    <div
                      className={`w-full flex items-center justify-between whitespace-nowrap transition-opacity duration-200 ${
                        isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                      }`}
                    >
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600/70" />
                        {group.title}
                      </span>
                      <span className="text-[8.5px] font-bold text-slate-300 font-mono">
                        {group.items.length}
                      </span>
                    </div>
                    {groupIdx > 0 && (
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 w-6 border-t border-slate-200/80 transition-opacity duration-200 ${
                          isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      />
                    )}
                  </div>

                  {/* Group Items */}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const itemPathBase = item.path ? item.path.split('?')[0] : '';
                      const itemSearch = item.path && item.path.includes('?') ? item.path.split('?')[1] : null;
                      const isActive =
                        item.path &&
                        (itemSearch
                          ? location.pathname === itemPathBase && location.search.includes(itemSearch)
                          : location.pathname === item.path && (!location.search || (!location.search.includes('tab=authorities') && !location.search.includes('tab=documents'))) ||
                            ((item.path === '/dashboard' || item.path === '/overview') &&
                              location.pathname === '/'));

                      if (item.isAction) {
                        return (
                          <div key={item.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.id === 'printer') setShowPrinterSetup(true);
                                if (isOpen) onClose();
                              }}
                              className="w-full h-9 px-3.5 relative flex items-center rounded-xl transition-[background-color,color,box-shadow,transform] duration-200 ease-out cursor-pointer overflow-hidden text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-gradient-to-r hover:from-red-50/90 hover:via-white hover:to-slate-50 hover:shadow-[0_4px_14px_rgba(220,38,38,0.10)] hover:translate-x-1 border border-transparent hover:border-red-200/60"
                            >
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-red-500 to-red-700 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center opacity-0 group-hover:opacity-100" />
                              <Icon className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-red-600 transition-colors duration-200" />
                              <div
                                className={`flex items-center flex-1 min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                  isCollapsed ? 'max-w-0 opacity-0 ml-0 pointer-events-none' : 'max-w-[185px] opacity-100 ml-3'
                                }`}
                              >
                                <span className="truncate flex-1 text-left tracking-tight">{item.label}</span>
                                {item.badge && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 ml-1.5 shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            </button>

                            {isCollapsed && (
                              <div className="fixed left-[92px] px-3 py-1.5 bg-white/98 text-slate-800 text-xs font-bold rounded-xl shadow-xl border border-slate-200/90 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap backdrop-blur-md flex items-center gap-1.5">
                                <span className="text-[9px] font-mono font-bold text-red-600 uppercase">[{group.title.split(' ')[0]}]</span>
                                <span>{item.label}</span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={item.id} className="relative group">
                          <NavLink
                            to={item.path}
                            onClick={onClose}
                            className={`w-full h-9 px-3.5 relative flex items-center rounded-xl transition-[background-color,color,box-shadow,transform] duration-200 ease-out cursor-pointer overflow-hidden text-xs ${
                              isActive
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-[0_4px_14px_rgba(220,38,38,0.25)]'
                                : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-gradient-to-r hover:from-red-50/90 hover:via-white hover:to-slate-50 hover:shadow-[0_4px_14px_rgba(220,38,38,0.10)] hover:translate-x-1 border border-transparent hover:border-red-200/60'
                            }`}
                          >
                            {!isActive && (
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-red-500 to-red-700 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center opacity-0 group-hover:opacity-100" />
                            )}

                            <div className="relative shrink-0">
                              <Icon
                                className={`w-4 h-4 transition-colors duration-200 ${
                                  isActive
                                    ? 'text-white'
                                    : 'text-slate-500 group-hover:text-red-600'
                                }`}
                              />
                              {isCollapsed && item.badge && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
                              )}
                            </div>

                            <div
                              className={`flex items-center flex-1 min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                isCollapsed ? 'max-w-0 opacity-0 ml-0 pointer-events-none' : 'max-w-[185px] opacity-100 ml-3'
                              }`}
                            >
                              <span className="truncate flex-1 tracking-tight">
                                {item.label}
                              </span>

                              {item.badge && (
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ml-1.5 shrink-0 ${
                                    isActive
                                      ? 'bg-white/20 text-white border border-white/30'
                                      : item.isAlertBadge
                                      ? 'bg-red-50 text-red-700 border border-red-200 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </NavLink>

                          {isCollapsed && (
                            <div className="fixed left-[92px] px-3 py-1.5 bg-white/98 text-slate-800 text-xs font-bold rounded-xl shadow-xl border border-slate-200/90 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap backdrop-blur-md flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold text-red-600 uppercase">[{group.title.split(' ')[0]}]</span>
                              <span>{item.label}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* ── Footer: Pengaturan & Logout (Constant left icon anchor) ── */}
            <div
              className="border-t border-slate-100/80 space-y-0.5 relative z-10 px-3 pt-2.5 pb-12"
              style={{ background: 'transparent' }}
            >
              <div className="relative group">
                <button
                  onClick={() => {
                    navigate('/settings');
                    if (isOpen) onClose();
                  }}
                  title={isCollapsed ? 'Pengaturan' : undefined}
                  className={`w-full h-9 px-3.5 flex items-center rounded-xl text-xs font-semibold transition-[background-color,color] duration-200 cursor-pointer overflow-hidden ${
                    location.pathname === '/settings'
                      ? 'bg-red-50 text-red-700 font-bold border border-red-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Settings
                    className={`w-4 h-4 shrink-0 ${
                      location.pathname === '/settings' ? 'text-red-600' : 'text-slate-500'
                    }`}
                  />
                  <span
                    className={`overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isCollapsed ? 'max-w-0 opacity-0 ml-0 pointer-events-none' : 'max-w-[160px] opacity-100 ml-3'
                    }`}
                  >
                    Pengaturan
                  </span>
                </button>

                {isCollapsed && (
                  <div className="fixed left-[92px] px-3 py-1.5 bg-white/95 text-slate-800 text-xs font-bold rounded-xl shadow-xl border border-slate-200/90 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap backdrop-blur-md">
                    Pengaturan
                  </div>
                )}
              </div>

              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className="w-full h-9 px-3.5 flex items-center rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-[background-color,color] duration-200 cursor-pointer overflow-hidden"
                >
                  <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                  <span
                    className={`overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isCollapsed ? 'max-w-0 opacity-0 ml-0 pointer-events-none' : 'max-w-[160px] opacity-100 ml-3'
                    }`}
                  >
                    Keluar (Logout)
                  </span>
                </button>
                {isCollapsed && (
                  <div className="fixed left-[92px] px-3 py-1.5 bg-white/95 text-red-600 text-xs font-bold rounded-xl shadow-xl border border-red-200/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap backdrop-blur-md">
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
