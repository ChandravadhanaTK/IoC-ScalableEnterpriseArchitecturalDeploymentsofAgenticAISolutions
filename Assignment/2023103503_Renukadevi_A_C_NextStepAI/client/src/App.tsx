import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import GoalsListPage from './pages/GoalsListPage';
import GoalWorkspacePage from './pages/GoalWorkspacePage';
import CreateGoalPage from './pages/CreateGoalPage';
import AgentActivityPage from './pages/AgentActivityPage';
import AdminMonitoringPage from './pages/AdminMonitoringPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminGoalsPage from './pages/AdminGoalsPage';
import DeliverablesPage from './pages/DeliverablesPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-navy-900 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-navy-900">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GoalsListPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/goals/:goalId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GoalWorkspacePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-goal"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateGoalPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AgentActivityPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/deliverables"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DeliverablesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/monitoring"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <AdminMonitoringPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <AdminUsersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/goals"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <AdminGoalsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
