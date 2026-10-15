import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Layers, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  GitPullRequest, 
  Sparkles, 
  Wrench, 
  ShieldCheck 
} from 'lucide-react';
import { TraceStep, AgentRole } from '../../types/agent';
import { Badge } from '../common/Badge';

interface TraceViewerProps {
  steps: TraceStep[];
}

export const TraceViewer: React.FC<TraceViewerProps> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  if (!steps || steps.length === 0) return null;

  const getAgentIcon = (agent: AgentRole) => {
    switch (agent) {
      case 'Orchestrator Agent': return <Cpu size={14} color="#60A5FA" />;
      case 'Planner': return <GitPullRequest size={14} color="#A78BFA" />;
      case 'Specialist Agent': return <Sparkles size={14} color="#22D3EE" />;
      case 'Tool Sandbox': return <Wrench size={14} color="#FBBF24" />;
      case 'Security Validator': return <ShieldCheck size={14} color="#34D399" />;
      default: return <Layers size={14} />;
    }
  };

  const getAgentColor = (agent: AgentRole): 'blue' | 'purple' | 'cyan' | 'orange' | 'green' => {
    switch (agent) {
      case 'Orchestrator Agent': return 'blue';
      case 'Planner': return 'purple';
      case 'Specialist Agent': return 'cyan';
      case 'Tool Sandbox': return 'orange';
      case 'Security Validator': return 'green';
      default: return 'blue';
    }
  };

  return (
    <div style={{
      marginTop: '14px',
      border: '1px solid #1E293B',
      borderRadius: '8px',
      background: '#090D16',
      overflow: 'hidden'
    }}>
      {/* Header bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#0E1424',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid #1E293B' : 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} color="#94A3B8" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>
            Multi-Agent Reasoning & Execution Trace
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
            ({steps.length} steps recorded)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge color="blue">{steps.filter(s => s.status === 'completed').length} / {steps.length} Completed</Badge>
          {isExpanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
        </div>
      </div>

      {/* Expanded list of steps */}
      {isExpanded && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {steps.map((step) => {
            const isSelected = selectedStepId === step.id;
            return (
              <div 
                key={step.id}
                onClick={() => setSelectedStepId(isSelected ? null : step.id)}
                style={{
                  border: '1px solid',
                  borderColor: isSelected ? '#3B82F6' : '#1E293B',
                  borderRadius: '6px',
                  background: isSelected ? '#111827' : '#0B0F19',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#1E293B',
                      color: '#94A3B8',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {step.stepNumber}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getAgentIcon(step.agent)}
                      <Badge color={getAgentColor(step.agent)}>{step.agent}</Badge>
                      {step.toolUsed && (
                        <span style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: '#F59E0B',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                          tool:{step.toolUsed}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#F1F5F9' }}>
                      {step.action}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {step.status === 'running' && (
                      <span style={{ fontSize: '11px', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="status-dot status-dot-blue animate-pulse-glow"></span> Running...
                      </span>
                    )}
                    {step.status === 'completed' && (
                      <span style={{ fontSize: '11px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> {step.durationMs}ms
                      </span>
                    )}
                    {step.status === 'waiting_approval' && (
                      <Badge color="orange">Approval Required</Badge>
                    )}
                    <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                      {step.tokensUsed} tokens
                    </span>
                  </div>
                </div>

                {/* Step Details & Output Drawer */}
                {isSelected && (
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #1E293B',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      <strong style={{ color: '#E2E8F0' }}>Operation Intent:</strong> {step.details}
                    </div>

                    {step.payload && (
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>Input Parameters Payload:</div>
                        <pre style={{ margin: 0, padding: '8px', fontSize: '11px' }}>
                          {JSON.stringify(step.payload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {step.output && (
                      <div>
                        <div style={{ fontSize: '11px', color: '#10B981', marginBottom: '4px' }}>Validation Result & Execution Output:</div>
                        <div style={{
                          background: '#060913',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '11.5px',
                          color: '#A7F3D0',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {step.output}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
