import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  GitMerge, 
  Layers, 
  Server, 
  ShieldCheck, 
  Activity, 
  Sparkles,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { NavigationTab } from '../../types/agent';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeAgentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeAgentsCount = 5
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string; color: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, color: '#3B82F6' },
    { id: 'assistant', label: 'Agent Assistant', icon: <Bot size={18} />, badge: 'Live', color: '#8B5CF6' },
    { id: 'workflow', label: 'Workflow', icon: <GitMerge size={18} />, color: '#F59E0B' },
    { id: 'architecture', label: 'Architecture', icon: <Layers size={18} />, color: '#06B6D4' },
    { id: 'deployment', label: 'Deployment', icon: <Server size={18} />, color: '#3B82F6' },
    { id: 'security', label: 'Security', icon: <ShieldCheck size={18} />, color: '#10B981' },
    { id: 'monitoring', label: 'Monitoring', icon: <Activity size={18} />, badge: '99.2%', color: '#EC4899' },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#090D17',
      borderRight: '1px solid #1E293B',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 20px',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)'
        }}>
          <Sparkles size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#F8FAFC', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Agentic AI <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)' }}>v2.4</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span className="status-dot status-dot-green"></span>
            Enterprise Fleet
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px 4px' }}>
          Platform Management
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#111827';
                  e.currentTarget.style.color = '#E2E8F0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94A3B8';
                }
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '6px',
                  bottom: '6px',
                  width: '3px',
                  backgroundColor: item.color,
                  borderRadius: '0 4px 4px 0',
                  boxShadow: `0 0 8px ${item.color}`
                }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: isActive ? item.color : '#64748B' }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500 }}>
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 41, 59, 0.8)',
                  color: isActive ? '#93C5FD' : '#94A3B8'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Student / Author Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #1E293B',
        background: 'rgba(15, 23, 42, 0.6)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#111827',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #1E293B'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '12px'
          }}>
            MS
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Muhammed Sheik
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
              2023103024
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
