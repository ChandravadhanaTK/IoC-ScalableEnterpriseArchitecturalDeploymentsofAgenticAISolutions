import React, { useState } from 'react';
import { NavigationTab } from './types/agent';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { AssistantView } from './components/assistant/AssistantView';
import { WorkflowView } from './components/workflow/WorkflowView';
import { ArchitectureView } from './components/architecture/ArchitectureView';
import { DeploymentView } from './components/deployment/DeploymentView';
import { SecurityView } from './components/security/SecurityView';
import { MonitoringView } from './components/monitoring/MonitoringView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [activePromptForAssistant, setActivePromptForAssistant] = useState<string | undefined>(undefined);

  const handleSelectPromptFromDashboard = (prompt: string) => {
    setActivePromptForAssistant(prompt);
    setCurrentTab('assistant');
  };

  const handleClearActivePrompt = () => {
    setActivePromptForAssistant(undefined);
  };

  return (
    <div className="app-container">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={(tab) => setCurrentTab(tab)} 
      />

      {/* Main Right Content Area */}
      <div className="main-content">
        <Header 
          currentTab={currentTab} 
        />

        <main style={{ flex: 1, minHeight: 0 }}>
          {currentTab === 'dashboard' && (
            <DashboardView 
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onSelectPrompt={handleSelectPromptFromDashboard}
            />
          )}

          {currentTab === 'assistant' && (
            <AssistantView 
              initialPrompt={activePromptForAssistant}
              onClearInitialPrompt={handleClearActivePrompt}
            />
          )}

          {currentTab === 'workflow' && (
            <WorkflowView />
          )}

          {currentTab === 'architecture' && (
            <ArchitectureView />
          )}

          {currentTab === 'deployment' && (
            <DeploymentView />
          )}

          {currentTab === 'security' && (
            <SecurityView />
          )}

          {currentTab === 'monitoring' && (
            <MonitoringView />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
