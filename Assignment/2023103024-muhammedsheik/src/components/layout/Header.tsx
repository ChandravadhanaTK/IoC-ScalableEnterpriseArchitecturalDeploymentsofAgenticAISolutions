import React from 'react';
import { 
  Bell, 
  Terminal, 
  RefreshCw, 
  CheckCircle, 
  ShieldCheck, 
  Zap,
  HelpCircle,
  KeyRound
} from 'lucide-react';
import { NavigationTab } from '../../types/agent';
import { Badge } from '../common/Badge';

interface HeaderProps {
  currentTab: NavigationTab;
  onResetData?: () => void;
  onOpenQuickPrompt?: (prompt: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onResetData }) => {
  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard': return 'Fleet Executive Dashboard';
      case 'assistant': return 'Agentic Task Assistant';
      case 'workflow': return 'Multi-Agent Execution Workflow';
      case 'architecture': return 'Enterprise Architectural Blueprint';
      case 'deployment': return 'Multi-Region Deployment & Runtime';
      case 'security': return 'Security, RBAC & Guardrails';
      case 'monitoring': return 'Observability & Trace Telemetry';
      default: return 'Agentic AI Platform';
    }
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: '#090D17',
      borderBottom: '1px solid #1E293B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0
    }}>
      {/* Left: Breadcrumb / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform / Core Fleet
            </span>
            <span style={{ color: '#334155' }}>•</span>
            <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>
              Live Runtime
            </span>
          </div>
          <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
            {getTabTitle(currentTab)}
          </h1>
        </div>
      </div>

      {/* Right: Telemetry & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Environment pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '5px 12px',
          borderRadius: '20px',
          fontSize: '11.5px',
          color: '#34D399',
          fontWeight: 600
        }}>
          <span className="status-dot status-dot-green"></span>
          <span>Cluster: US-East-1 (Healthy)</span>
        </div>

        {/* Security Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          padding: '5px 10px',
          borderRadius: '6px',
          fontSize: '11.5px',
          color: '#93C5FD'
        }}>
          <ShieldCheck size={14} color="#60A5FA" />
          <span>Guardrails Active (NeMo v2.2)</span>
        </div>

        {/* Local simulation tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          padding: '5px 10px',
          borderRadius: '6px',
          fontSize: '11.5px',
          color: '#C4B5FD'
        }}>
          <Zap size={14} color="#A78BFA" />
          <span>Autonomous Sandbox</span>
        </div>

        {/* Notification Bell */}
        <button 
          title="System notifications"
          style={{
            position: 'relative',
            background: '#111827',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94A3B8',
            cursor: 'pointer'
          }}
        >
          <Bell size={16} />
          <span style={{
            position: 'absolute',
            top: '7px',
            right: '7px',
            width: '7px',
            height: '7px',
            backgroundColor: '#3B82F6',
            borderRadius: '50%',
            boxShadow: '0 0 6px #3B82F6'
          }} />
        </button>
      </div>
    </header>
  );
};
