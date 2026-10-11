import React from 'react';
import { X, Clock, Layers, CheckCircle2, AlertCircle, Cpu, GitPullRequest, Sparkles, Wrench, ShieldCheck } from 'lucide-react';
import { TraceItem, AgentRole } from '../../types/agent';
import { Badge } from '../common/Badge';

interface TraceWaterfallModalProps {
  trace: TraceItem | null;
  onClose: () => void;
}

export const TraceWaterfallModal: React.FC<TraceWaterfallModalProps> = ({ trace, onClose }) => {
  if (!trace) return null;

  const totalDuration = trace.durationMs || 1000;

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
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(6, 9, 19, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0E1424',
        border: '1px solid #1E293B',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '820px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #1E293B',
          background: '#090D17'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#3B82F6', fontWeight: 700 }}>
              {trace.traceId}
            </span>
            <Badge color={trace.status === 'Completed' ? 'green' : 'red'}>{trace.status}</Badge>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              {trace.taskTitle}
            </h3>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Trace Metadata Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '12px 20px',
          background: '#0B0F19',
          borderBottom: '1px solid #1E293B',
          fontSize: '11.5px'
        }}>
          <div>
            <span style={{ color: '#64748B' }}>Total Duration: </span>
            <strong style={{ color: '#F1F5F9', fontFamily: 'var(--font-mono)' }}>{trace.durationMs}ms</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>Tokens: </span>
            <strong style={{ color: '#F1F5F9', fontFamily: 'var(--font-mono)' }}>{trace.tokens.toLocaleString()}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>Est. Cost: </span>
            <strong style={{ color: '#10B981', fontFamily: 'var(--font-mono)' }}>${trace.costUsd.toFixed(4)}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>Tenant: </span>
            <strong style={{ color: '#93C5FD' }}>{trace.tenant}</strong>
          </div>
        </div>

        {/* Distributed Waterfall Gantt Chart */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
            <span>OpenTelemetry Span Hierarchy</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>0ms ---------------- Timeline ---------------- {totalDuration}ms</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {trace.spans.map((span, idx) => {
              const leftPct = (span.startOffsetMs / totalDuration) * 100;
              const widthPct = Math.max((span.durationMs / totalDuration) * 100, 4);

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge color={getAgentColor(span.agent)}>{span.agent}</Badge>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>
                        {span.name}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                      +{span.startOffsetMs}ms ({span.durationMs}ms)
                    </span>
                  </div>

                  {/* Waterfall Timeline Bar */}
                  <div style={{ height: '8px', background: '#1E293B', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        height: '100%',
                        borderRadius: '4px',
                        background: span.status === 'ok' ? 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)' : '#EF4444'
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '11px', color: '#94A3B8', paddingLeft: '4px' }}>
                    {span.details}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #1E293B',
          background: '#090D17',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button className="btn-secondary" onClick={onClose}>
            Close Span Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
