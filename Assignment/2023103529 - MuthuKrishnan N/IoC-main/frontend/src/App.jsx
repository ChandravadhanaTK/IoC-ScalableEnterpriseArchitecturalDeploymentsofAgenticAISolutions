import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerComplaintList } from './pages/customer/CustomerComplaintList';
import { NewComplaintPage } from './pages/customer/NewComplaintPage';
import { ComplaintDetailsPage } from './pages/customer/ComplaintDetailsPage';
import { SupportDashboard } from './pages/support/SupportDashboard';
import { SupportApprovalsPage } from './pages/support/SupportApprovalsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminAgentMetricsPage } from './pages/admin/AdminAgentMetricsPage';
import './index.css';

// Reusable Route Guard enforcing strict authentication and RBAC permissions
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner-large" />
        <p>Loading enterprise session...</p>
      </div>
    );
  }

  // 1. Is user authenticated?
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Does user's role have permission?
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Strictly redirect to /unauthorized page per Requirement 2
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Root index redirector based on authenticated user's role
const RootRedirector = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner-large" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'CUSTOMER') return <Navigate to="/customer/dashboard" replace />;
  if (user.role === 'SUPPORT_AGENT') return <Navigate to="/support/dashboard" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

// Main Layout with Navbar & Sidebar
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="enterprise-app-root">
      <Navbar />
      <div className="enterprise-layout-body">
        {isAuthenticated && <Sidebar />}
        <main className={`enterprise-main-viewport ${isAuthenticated ? 'has-sidebar' : 'full-width'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public Landing & Auth Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Customer Routes (Only CUSTOMER role) */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/complaints"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <CustomerComplaintList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/complaints/new"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <NewComplaintPage />
                </ProtectedRoute>
              }
            />
            {/* Complaint details: customers see their own; support & admin can inspect to resolve */}
            <Route
              path="/customer/complaints/:id"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'SUPPORT_AGENT', 'ADMIN']}>
                  <ComplaintDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints/:id"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'SUPPORT_AGENT', 'ADMIN']}>
                  <ComplaintDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Support Agent Routes (SUPPORT_AGENT and ADMIN) */}
            <Route
              path="/support/dashboard"
              element={
                <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'ADMIN']}>
                  <SupportDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support/approvals"
              element={
                <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'ADMIN']}>
                  <SupportApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'ADMIN']}>
                  <SupportApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support/complaints/:id"
              element={
                <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'ADMIN']}>
                  <ComplaintDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes (Only ADMIN) */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/approvals"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SupportApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/agent-metrics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAgentMetricsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
