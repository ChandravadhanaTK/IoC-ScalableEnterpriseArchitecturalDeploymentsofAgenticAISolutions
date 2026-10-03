import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { Navbar, MainTab } from './components/navigation/Navbar';
import { CapstoneDeliverableId, Task } from './types';

// Deliverables
import { CapstoneOverview } from './components/deliverables/CapstoneOverview';
import { ArchitectureDiagram } from './components/deliverables/ArchitectureDiagram';
import { AgentWorkflowDesign } from './components/deliverables/AgentWorkflowDesign';
import { DeploymentStrategy } from './components/deliverables/DeploymentStrategy';
import { SecurityModel } from './components/deliverables/SecurityModel';
import { MonitoringDashboard } from './components/deliverables/MonitoringDashboard';

// Task Management & Prioritization
import { TaskListView } from './components/tasks/TaskListView';
import { EisenhowerMatrixView } from './components/tasks/EisenhowerMatrixView';
import { CreateTaskModal } from './components/tasks/CreateTaskModal';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { AutoPrioritizeModal } from './components/tasks/AutoPrioritizeModal';
import { AgentExecutionModal } from './components/tasks/AgentExecutionModal';

// Audit & Auth
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { AuthModal } from './components/auth/AuthModal';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<MainTab>('tasks');
  const [selectedDeliverable, setSelectedDeliverable] = useState<CapstoneDeliverableId>('overview');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAutoPrioritizeOpen, setIsAutoPrioritizeOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [executionTask, setExecutionTask] = useState<Task | null>(null);

  const handleSelectDeliverableFromOverview = (id: CapstoneDeliverableId) => {
    setSelectedDeliverable(id);
    setCurrentTab('deliverables');
  };

  const handleRunAgent = (task: Task) => {
    setExecutionTask(task);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedDeliverable={selectedDeliverable}
        onSelectDeliverable={setSelectedDeliverable}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: Tasks List */}
        {currentTab === 'tasks' && (
          <TaskListView
            onOpenCreate={() => setIsCreateOpen(true)}
            onOpenAutoPrioritize={() => setIsAutoPrioritizeOpen(true)}
            onSelectTask={(task) => setDetailTask(task)}
            onRunAgent={handleRunAgent}
          />
        )}

        {/* TAB 2: Eisenhower Matrix */}
        {currentTab === 'matrix' && (
          <EisenhowerMatrixView
            onSelectTask={(task) => setDetailTask(task)}
            onRunAgent={handleRunAgent}
            onOpenAutoPrioritize={() => setIsAutoPrioritizeOpen(true)}
          />
        )}

        {/* TAB 3: Capstone Deliverables */}
        {currentTab === 'deliverables' && (
          <>
            {selectedDeliverable === 'overview' && (
              <CapstoneOverview onSelectDeliverable={handleSelectDeliverableFromOverview} />
            )}
            {selectedDeliverable === 'architecture' && <ArchitectureDiagram />}
            {selectedDeliverable === 'workflow' && <AgentWorkflowDesign />}
            {selectedDeliverable === 'deployment' && <DeploymentStrategy />}
            {selectedDeliverable === 'security' && <SecurityModel />}
            {selectedDeliverable === 'monitoring' && <MonitoringDashboard />}
          </>
        )}

        {/* TAB 4: Audit Trail */}
        {currentTab === 'audit' && <AuditLogViewer />}
      </main>

      {/* Global Modals */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <AutoPrioritizeModal
        isOpen={isAutoPrioritizeOpen}
        onClose={() => setIsAutoPrioritizeOpen(false)}
      />

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onRunAgent={handleRunAgent}
      />

      <AgentExecutionModal
        task={executionTask}
        isOpen={!!executionTask}
        onClose={() => setExecutionTask(null)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <AppContent />
      </TaskProvider>
    </AuthProvider>
  );
}
