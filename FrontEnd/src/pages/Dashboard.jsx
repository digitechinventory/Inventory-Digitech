import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import SuperadminDashboard from './superadmin/SuperadminDashboard.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import UserDashboard from './user/UserDashboard.jsx';
import IronNestWarehousesView from '../components/inventory/IronNestWarehousesView.jsx';
import MobileHomeDashboard from '../components/dashboard/MobileHomeDashboard.jsx';

/**
 * Dynamic Multi-Role IMS Dashboard Dispatcher
 * 
 * - Mobile Experience (< lg):
 *   Renders the unified MobileHomeDashboard matching reference layout with
 *   Digitech login card crimson/slate-950 palette, circular gauge meter,
 *   3 white stat cards, OLT attention list, and role-specific small clickable menus.
 * 
 * - Desktop Experience (>= lg):
 *   Dispatches to dedicated desktop role dashboard views:
 *   - Superadmin: pages/superadmin/SuperadminDashboard.jsx
 *   - Admin: pages/admin/AdminDashboard.jsx
 *   - User (Teknisi): pages/user/UserDashboard.jsx
 */
export default function Dashboard({ mode }) {
  const { role } = useAuth();
  const normalizedRole = role || 'User';

  // Explicit Mode Overrides
  if (mode === 'warehouses') {
    return <IronNestWarehousesView />;
  }

  const renderDesktopDashboard = () => {
    if (mode === 'admin') return <AdminDashboard />;
    if (mode === 'user') return <UserDashboard />;
    if (mode === 'superadmin' || mode === 'overview') return <SuperadminDashboard />;

    if (normalizedRole === 'Superadmin') return <SuperadminDashboard />;
    if (normalizedRole === 'Admin') return <AdminDashboard />;
    return <UserDashboard />;
  };

  return (
    <div>
      {/* Mobile View: High-fidelity Mobile Home Dashboard */}
      <div className="block lg:hidden">
        <MobileHomeDashboard />
      </div>

      {/* Desktop View: Full-featured desktop role dashboard */}
      <div className="hidden lg:block">
        {renderDesktopDashboard()}
      </div>
    </div>
  );
}
