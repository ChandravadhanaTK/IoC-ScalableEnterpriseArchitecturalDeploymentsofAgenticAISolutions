import React from 'react';
import { Cpu, Search, Terminal, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AgentVisualizer({ currentState, events, isExecuting }) {
  const agents = [
    { id: 'SupervisorAgent', name: 'Supervisor Agent', icon: Cpu, role: 'Master Orchestrator & DAG Router' },
    { id: 'GuardrailAgent', name: 'Security Guardrail Agent', icon: ShieldAlert, role: 'PII & Prompt Injection Shield' },
    { id: 'ResearchAgent', name: 'Research Intelligence Agent', icon: Search, role: 'Web Search & RAG Context Engine' },
    { id: 'ExecutionAgent', name: 'Code Sandbox Agent', icon: Terminal, role: 'Code execution & SQL runner' }
  ];

  const getAgentStatus = (agentId) => {
    if (!currentState) return 'IDLE';
    if (currentState.agent === agentId) return currentState.state;
    const pastEvent = events.find((e) => e.agent === agentId);
    return pastEvent ? 'COMPLETED' : 'IDLE';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Cpu size={18} color="#06b6d4" /> Active Agent Orchestration Graph (DAG)
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {agents.map((ag) => {
          const Icon = ag.icon;
          const status = getAgentStatus(ag.id);
          const isActive = currentState?.agent === ag.id;

          let borderColor = 'rgba(255,255,255,0.08)';
          let statusBadgeBg = 'rgba(148,163,184,0.1)';
          let statusBadgeColor = '#94a3b8';

          if (isActive) {
            borderColor = '#06b6d4';
            statusBadgeBg = 'rgba(6,182,212,0.2)';
            statusBadgeColor = '#06b6d4';
          } else if (status === 'COMPLETED') {
            borderColor = '#10b981';
            statusBadgeBg = 'rgba(16,185,129,0.2)';
            statusBadgeColor = '#34d399';
          } else if (status === 'PENDING_HUMAN_APPROVAL') {
            borderColor = '#f59e0b';
            statusBadgeBg = 'rgba(245,158,11,0.2)';
            statusBadgeColor = '#fbbf24';
          }

          return (
            <div
              key={ag.id}
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: `1px solid ${borderColor}`,
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s ease',
                transform: isActive ? 'scale(1.02)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ background: isActive ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                  <Icon size={20} color={isActive ? '#06b6d4' : '#94a3b8'} />
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: statusBadgeBg,
                    color: statusBadgeColor,
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  {status}
                </span>
              </div>

              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>{ag.name}</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ag.role}</p>

              {isActive && (
                <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="font-mono">Processing payload...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
