import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Toast, ToastMessage } from './components/Toast';
import { LandingPage } from './views/LandingPage';
import { StudentRegister } from './views/StudentRegister';
import { StudentLogin } from './views/StudentLogin';
import { AdminLogin } from './views/AdminLogin';
import { StudentDashboard } from './views/StudentDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { AdminIssueManagement } from './views/AdminIssueManagement';
import { StudentIssueTracking } from './views/StudentIssueTracking';
import { StudentProfile } from './views/StudentProfile';
import { AdminProfile } from './views/AdminProfile';
import { ReportIssueModal } from './views/ReportIssueModal';
import { Issue } from './types';

function MainApp() {
  const { user, loading } = useAuth();
  const { refreshNotifications } = useNotifications();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('landing');
  const [trackingIssueId, setTrackingIssueId] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // If user just logs in, route them appropriately if they were on a public login screen
  React.useEffect(() => {
    if (user) {
      if (currentView === 'student-login' || currentView === 'student-register') {
        setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
      } else if (currentView === 'admin-login') {
        setCurrentView('admin-dashboard');
      }
    }
  }, [user]);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  const handleNavigate = (view: string) => {
    // Route protection
    if (!user) {
      if (view === 'student-dashboard' || view === 'student-profile') {
        setCurrentView('student-login');
        return;
      }
      if (view === 'admin-dashboard' || view === 'admin-issues' || view === 'admin-profile') {
        setCurrentView('admin-login');
        return;
      }
    } else if (user.role !== 'admin') {
      if (view === 'admin-dashboard' || view === 'admin-issues' || view === 'admin-profile') {
        showToast('error', 'Administrator privileges required for this section.');
        setCurrentView('student-dashboard');
        return;
      }
    } else if (user.role === 'admin') {
      if (view === 'student-dashboard' || view === 'student-profile') {
        setCurrentView('admin-dashboard');
        return;
      }
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackIssue = (issueId: string) => {
    setTrackingIssueId(issueId);
    setCurrentView('track-issue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIssueSubmitted = (issue: Issue) => {
    showToast('success', `Issue ${issue.issueId} submitted successfully! AI routed to ${issue.assignedDepartment}.`);
    refreshNotifications();
    if (currentView === 'student-dashboard') {
      // Force refresh of dashboard via state
      setCurrentView('temp');
      setTimeout(() => setCurrentView('student-dashboard'), 10);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Initializing CampusFix System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenReportModal={user && user.role === 'student' ? () => setIsReportModalOpen(true) : undefined}
        onSelectTrackIssue={handleTrackIssue}
      />

      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage onNavigate={handleNavigate} onTrackIssue={handleTrackIssue} />
        )}

        {currentView === 'student-login' && (
          <StudentLogin onNavigate={handleNavigate} />
        )}

        {currentView === 'student-register' && (
          <StudentRegister onNavigate={handleNavigate} />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin onNavigate={handleNavigate} />
        )}

        {currentView === 'student-dashboard' && user && (
          <StudentDashboard
            onNavigate={handleNavigate}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onSelectTrackIssue={handleTrackIssue}
          />
        )}

        {currentView === 'admin-dashboard' && user && user.role === 'admin' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'admin-issues' && user && user.role === 'admin' && (
          <AdminIssueManagement />
        )}

        {currentView === 'track-issue' && (
          <StudentIssueTracking
            initialIssueId={trackingIssueId}
            onClearInitialId={() => setTrackingIssueId('')}
          />
        )}

        {currentView === 'student-profile' && user && (
          <StudentProfile />
        )}

        {currentView === 'admin-profile' && user && user.role === 'admin' && (
          <AdminProfile />
        )}
      </main>

      {/* Global Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={handleIssueSubmitted}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
