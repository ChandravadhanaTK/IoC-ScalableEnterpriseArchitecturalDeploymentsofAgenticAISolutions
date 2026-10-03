import React, { useState, useEffect } from 'react';
import { StorageService, StorageData } from './services/storage';
import { Profile } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginView } from './components/LoginView';

// Views
import { DashboardView } from './components/views/DashboardView';
import { AssetsView } from './components/views/AssetsView';
import { RequestView } from './components/views/RequestView';
import { AgentWorkflowView } from './components/views/AgentWorkflowView';
import { ApprovalsView } from './components/views/ApprovalsView';
import { LifecycleView } from './components/views/LifecycleView';
import { TransfersView } from './components/views/TransfersView';
import { OffboardingView } from './components/views/OffboardingView';
import { AgentOperationsView } from './components/views/AgentOperationsView';
import { MonitoringView } from './components/views/MonitoringView';
import { AuditLogView } from './components/views/AuditLogView';
import { AdminView } from './components/views/AdminView';
import { MyRequestsView } from './components/views/MyRequestsView';

export const App: React.FC = () => {
  const [data, setData] = useState<StorageData>(() => StorageService.getData());
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => StorageService.getCurrentUser());
  const [currentView, setCurrentView] = useState<string>('overview');
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('req-1024');

  // Sync state from storage
  const refreshData = () => {
    const updated = StorageService.getData();
    setData(updated);
    if (updated.currentUser) {
      setCurrentUser(updated.currentUser);
    }
  };

  const handleLogin = (profile: Profile) => {
    StorageService.setCurrentUser(profile);
    setCurrentUser(profile);
    setCurrentView('overview');
    refreshData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('overview');
  };

  const handleSwitchUser = (profile: Profile) => {
    StorageService.setCurrentUser(profile);
    setCurrentUser(profile);
    refreshData();
  };

  const handleNavigateToWorkflow = (requestId: string) => {
    setActiveWorkflowId(requestId);
    setCurrentView('workflow');
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} profiles={data.profiles} />;
  }

  // Pending approvals badge
  const pendingApprovalsCount = data.approvals.filter((a) => a.status === 'PENDING').length;

  // Header Titles
  const getViewMeta = () => {
    switch (currentView) {
      case 'overview':
        return { title: 'Asset Operations Center', subtitle: 'Executive dashboard & real-time telemetry' };
      case 'assets':
        return { title: 'Asset Inventory', subtitle: 'Searchable hardware catalog with health & warranty' };
      case 'request':
        return { title: 'Request Asset', subtitle: 'Submit hardware requisitions to autonomous agent pipeline' };
      case 'my-requests':
        return { title: 'Hardware Requisitions', subtitle: 'Track submitted equipment requests and decisions' };
      case 'approvals':
        return { title: 'Approval Center', subtitle: 'Human-in-the-loop review for policy-flagged requests' };
      case 'agent-operations':
        return { title: 'Agent Operations', subtitle: 'Deterministic execution logs and tool call traces' };
      case 'lifecycle':
        return { title: 'Lifecycle Intelligence', subtitle: 'Scoring, MTBF degradation, and recurring repair alerts' };
      case 'transfers':
        return { title: 'Internal Asset Transfers', subtitle: 'Inter-departmental device reassignment' };
      case 'offboarding':
        return { title: 'Offboarding & Recovery', subtitle: 'Diagnostic inspection and inventory reconciliation' };
      case 'monitoring':
        return { title: 'System Monitoring', subtitle: 'Agent SLA health, latency, and simulated token usage' };
      case 'audit':
        return { title: 'Audit Log', subtitle: 'Immutable governance and regulatory compliance trail' };
      case 'admin':
        return { title: 'Administration', subtitle: 'Role entitlements, demo scenarios, and system reset' };
      case 'workflow':
        return { title: 'Agent Workflow Stepper', subtitle: 'Visual state pipeline and agent operational trace' };
      default:
        return { title: 'AssetCareHQ', subtitle: 'IT Asset Operations' };
    }
  };

  const { title, subtitle } = getViewMeta();

  const notifications = [
    { id: '1', title: 'REQ-1025 requires Manager Approval', time: '5m ago', type: 'warn' as const },
    { id: '2', title: 'LT-0911 recurring repairs alert (&ge;3 failures)', time: '1h ago', type: 'warn' as const },
    { id: '3', title: 'LT-1042 successfully assigned for REQ-1024', time: '3d ago', type: 'success' as const },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9FC]">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        currentUser={currentUser}
        onLogout={handleLogout}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={title}
          subtitle={subtitle}
          currentUser={currentUser}
          profiles={data.profiles}
          onSwitchUser={handleSwitchUser}
          notifications={notifications}
        />

        {/* View Container */}
        <main className="flex-1 overflow-y-auto bg-[#F7F9FC]">
          {currentView === 'overview' && (
            <DashboardView
              data={data}
              onNavigate={(view, param) => {
                if (view === 'workflow' && param) {
                  handleNavigateToWorkflow(param);
                } else {
                  setCurrentView(view);
                }
              }}
            />
          )}

          {currentView === 'assets' && (
            <AssetsView data={data} currentUser={currentUser} onRefresh={refreshData} />
          )}

          {currentView === 'request' && (
            <RequestView
              currentUser={currentUser}
              onNavigateToWorkflow={handleNavigateToWorkflow}
              onRefresh={refreshData}
            />
          )}

          {currentView === 'my-requests' && (
            <MyRequestsView
              data={data}
              currentUser={currentUser}
              onNavigateToWorkflow={handleNavigateToWorkflow}
              onNavigateToRequest={() => setCurrentView('request')}
            />
          )}

          {currentView === 'approvals' && (
            <ApprovalsView
              data={data}
              currentUser={currentUser}
              onNavigateToWorkflow={handleNavigateToWorkflow}
              onRefresh={refreshData}
            />
          )}

          {currentView === 'agent-operations' && (
            <AgentOperationsView data={data} onNavigateToWorkflow={handleNavigateToWorkflow} />
          )}

          {currentView === 'lifecycle' && (
            <LifecycleView data={data} onRefresh={refreshData} />
          )}

          {currentView === 'transfers' && (
            <TransfersView data={data} currentUser={currentUser} onRefresh={refreshData} />
          )}

          {currentView === 'offboarding' && (
            <OffboardingView data={data} currentUser={currentUser} onRefresh={refreshData} />
          )}

          {currentView === 'monitoring' && <MonitoringView data={data} />}

          {currentView === 'audit' && <AuditLogView data={data} />}

          {currentView === 'admin' && (
            <AdminView
              data={data}
              currentUser={currentUser}
              onRefresh={refreshData}
              onNavigateToWorkflow={handleNavigateToWorkflow}
            />
          )}

          {currentView === 'workflow' && (
            <AgentWorkflowView
              requestId={activeWorkflowId}
              data={data}
              currentUser={currentUser}
              onBack={() => setCurrentView('my-requests')}
              onRefresh={refreshData}
            />
          )}
        </main>
      </div>
    </div>
  );
};
export default App;
