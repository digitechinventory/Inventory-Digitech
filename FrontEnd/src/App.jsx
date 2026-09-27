import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import IronNestLayout from './layouts/IronNestLayout';

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
import GISPage from './pages/GISPage';
import AuthPage from './pages/AuthPage';


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
        {/* Dynamic Role-Based Adaptive Dashboard (PRD Section 4) */}
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="overview" element={<Dashboard mode="overview" />} />
        <Route path="superadmin" element={<SuperadminDashboard />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="user" element={<UserDashboard />} />

        {/* PRD Modules */}
        <Route path="mos" element={<MOSPage />} />
        <Route path="mr" element={<MaterialRequestPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="katalog" element={<InventoryPage />} />
        <Route path="catalog" element={<InventoryPage />} />
        <Route path="warehouses" element={<IronNestWarehousesView />} />
        <Route path="tools" element={<ToolLoansPage />} />
        <Route path="opname" element={<StockOpnamePage />} />
        <Route path="lifecycle" element={<AssetLifecyclePage />} />
        <Route path="ledger" element={<InventoryLedgerPage />} />
        <Route path="reports" element={<InventoryLedgerPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<AccountSettingsPage />} />
        <Route path="account" element={<AccountSettingsPage />} />
        <Route path="profile" element={<AccountSettingsPage />} />
        <Route path="gis" element={<GISPage />} />
        <Route path="tracking" element={<GISPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
}

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
