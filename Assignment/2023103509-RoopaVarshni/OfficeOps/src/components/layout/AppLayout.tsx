import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { User } from '../../types';

interface AppLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  onResetData: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onUserChange,
  onResetData,
  onLogout,
  children
}) => {
  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard':
        return 'Executive Workplace Dashboard';
      case 'assistant':
        return 'OfficeOps AI Workplace Assistant';
      case 'rooms':
        return 'Meeting Spaces & Facility Inventory';
      case 'requests':
        return 'Enterprise Workplace Service Requests';
      case 'monitoring':
        return 'Observability & Multi-Agent Telemetry';
      default:
        return 'OfficeOps Operations';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        currentUser={currentUser}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          currentUser={currentUser}
          onUserChange={onUserChange}
          onNavigateToAssistant={() => onNavigate('assistant')}
          onResetData={onResetData}
          onLogout={onLogout}
          pageTitle={getPageTitle(currentPage)}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
