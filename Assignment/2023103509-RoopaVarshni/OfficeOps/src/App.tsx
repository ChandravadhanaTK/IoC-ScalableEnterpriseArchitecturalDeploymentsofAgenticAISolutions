import React, { useState, useEffect } from 'react';
import { User } from './types';
import { storage } from './services/storage';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssistantPage } from './pages/AssistantPage';
import { MeetingRoomsPage } from './pages/MeetingRoomsPage';
import { WorkplaceRequestsPage } from './pages/WorkplaceRequestsPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { ToastContainer, ToastMessage } from './components/common/Toast';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return storage.getCurrentUser();
  });
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [assistantPrefillPrompt, setAssistantPrefillPrompt] = useState<string>('');

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      // Re-sync if user changes
      const u = storage.getCurrentUser();
      if (u && currentUser && u.id !== currentUser.id) {
        setCurrentUser(u);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const showToast = (
    title: string,
    message?: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info'
  ) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      type
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResetData = () => {
    storage.resetAllData();
    showToast('Data Reset', 'All demo datasets have been restored to initial baseline.', 'info');
  };

  const handleNavigateToAssistantWithPrompt = (prompt: string) => {
    setAssistantPrefillPrompt(prompt);
    setCurrentPage('assistant');
  };

  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLogin={(user) => {
            setCurrentUser(user);
            showToast('Authenticated', `Signed in as ${user.name} (${user.role})`, 'success');
          }}
        />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  return (
    <>
      <AppLayout
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        currentUser={currentUser}
        onUserChange={(newUser) => {
          setCurrentUser(newUser);
          showToast('Persona Switched', `Active role is now ${newUser.role.replace('_', ' ')}.`, 'info');
        }}
        onResetData={handleResetData}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Logged Out', 'You have exited the session.', 'info');
        }}
      >
        {currentPage === 'dashboard' && (
          <DashboardPage
            currentUser={currentUser}
            onNavigate={(page) => setCurrentPage(page)}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'assistant' && (
          <AssistantPage
            currentUser={currentUser}
            onShowToast={showToast}
            onNavigateToRooms={() => setCurrentPage('rooms')}
          />
        )}

        {currentPage === 'rooms' && (
          <MeetingRoomsPage
            currentUser={currentUser}
            onNavigateToAssistantWithPrompt={handleNavigateToAssistantWithPrompt}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'requests' && (
          <WorkplaceRequestsPage
            currentUser={currentUser}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'monitoring' && (
          <MonitoringPage
            currentUser={currentUser}
            onResetData={handleResetData}
            onShowToast={showToast}
          />
        )}
      </AppLayout>

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </>
  );
}

export default App;
