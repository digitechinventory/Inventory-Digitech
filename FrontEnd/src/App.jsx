import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';

// Layout & Startup Splash
import IronNestLayout from './layouts/IronNestLayout';
import StartupSplashScreen from './components/common/StartupSplashScreen';

// Pages
import Dashboard from './pages/Dashboard';
import MOSPage from './pages/MOSPage';
import InventoryPage from './pages/InventoryPage';
import IronNestWarehousesView from './components/inventory/IronNestWarehousesView';
import MaterialRequestPage from './pages/MaterialRequestPage';
import ToolLoansPage from './pages/ToolLoansPage';
import StockOpnamePage from './pages/StockOpnamePage';
import AssetLifecyclePage from './pages/AssetLifecyclePage';
import InventoryLedgerPage from './pages/InventoryLedgerPage';
import UsersPage from './pages/UsersPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import AssetTrackingPage from './pages/AssetTrackingPage';
import AuthPage from './pages/AuthPage';
import AgendaCalendarPage from './pages/AgendaCalendarPage';
import ProjectInventoryPage from './pages/ProjectInventoryPage';

// Role-Specific Pages Organized in Separate Folders
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    }
  }
});

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Strict Role-Based Route Guard (RBAC)
function RoleRoute({ allowedRoles, children }) {
  const { user, role } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const currentRole = role || 'User';
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Login & Register Route */}
      <Route path="/login" element={<AuthPage />} />

      {/* Main IMS Application Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <IronNestLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Role-Based Adaptive Dashboard */}
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route
          path="overview"
          element={
            <RoleRoute allowedRoles={['Superadmin']}>
              <Dashboard mode="overview" />
            </RoleRoute>
          }
        />
        <Route
          path="superadmin"
          element={
            <RoleRoute allowedRoles={['Superadmin']}>
              <SuperadminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="admin"
          element={
            <RoleRoute allowedRoles={['Admin', 'Superadmin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="user"
          element={
            <RoleRoute allowedRoles={['User', 'Admin', 'Superadmin']}>
              <UserDashboard />
            </RoleRoute>
          }
        />

        {/* Modules */}
        <Route path="mos" element={<MOSPage />} />
        <Route path="mr" element={<MaterialRequestPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="project-inventory" element={<ProjectInventoryPage />} />
        <Route path="inventory-khusus" element={<ProjectInventoryPage />} />
        <Route path="projects" element={<ProjectInventoryPage />} />
        <Route path="katalog" element={<InventoryPage />} />
        <Route path="catalog" element={<InventoryPage />} />
        <Route
          path="warehouses"
          element={
            <RoleRoute allowedRoles={['Admin', 'Superadmin']}>
              <IronNestWarehousesView />
            </RoleRoute>
          }
        />
        <Route path="tools" element={<ToolLoansPage />} />
        <Route
          path="opname"
          element={
            <RoleRoute allowedRoles={['Admin', 'Superadmin']}>
              <StockOpnamePage />
            </RoleRoute>
          }
        />
        <Route
          path="lifecycle"
          element={
            <RoleRoute allowedRoles={['Superadmin']}>
              <AssetLifecyclePage />
            </RoleRoute>
          }
        />
        <Route
          path="ledger"
          element={
            <RoleRoute allowedRoles={['Admin', 'Superadmin']}>
              <InventoryLedgerPage />
            </RoleRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRoute allowedRoles={['Admin', 'Superadmin']}>
              <InventoryLedgerPage />
            </RoleRoute>
          }
        />
        <Route
          path="users"
          element={
            <RoleRoute allowedRoles={['Superadmin']}>
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route path="settings" element={<AccountSettingsPage />} />
        <Route path="account" element={<AccountSettingsPage />} />
        <Route path="profile" element={<AccountSettingsPage />} />
        <Route path="tracking" element={<AssetTrackingPage />} />
        <Route path="asset-tracking" element={<AssetTrackingPage />} />
        <Route path="gis" element={<AssetTrackingPage />} />
        <Route path="agenda" element={<AgendaCalendarPage />} />
        <Route path="calendar" element={<AgendaCalendarPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  // Always play the cinematic pure-code startup animation when the app opens or reloads!
  const [showSplash, setShowSplash] = useState(() => {
    try {
      // Automatically bypass splash in automated testing (e2e)
      if (typeof window !== 'undefined' && (window.navigator?.webdriver || window.__E2E__)) {
        return false;
      }
      const params = new URLSearchParams(window.location.search);
      // Only bypass if explicitly requested via query param (e.g. ?nosplash=1)
      if (params.get('nosplash') === 'true' || params.get('nosplash') === '1') {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    // Enable manual or programmatic replay of the cinematic splash screen from anywhere
    const handleReplaySplash = () => setShowSplash(true);
    window.addEventListener('app:play-splash', handleReplaySplash);
    return () => window.removeEventListener('app:play-splash', handleReplaySplash);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Toast />
            {showSplash && <StartupSplashScreen onFinish={() => setShowSplash(false)} />}
            <Router>
              <AppRoutes />
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
