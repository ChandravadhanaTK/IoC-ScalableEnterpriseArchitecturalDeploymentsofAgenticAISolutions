import React from 'react';
import { X, CheckCircle2, Clock, Cpu, GitPullRequest, Sparkles, Wrench, ShieldCheck, Layers, AlertCircle } from 'lucide-react';
import { WorkflowNode } from '../../types/agent';
import { Badge } from '../common/Badge';

interface NodeDetailModalProps {
  node: WorkflowNode | null;
  onClose: () => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ node, onClose }) => {
  if (!node) return null;

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
        maxWidth: '620px',
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
            <Badge color={node.color}>{node.role}</Badge>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              {node.label}
            </h3>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Current Node State
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <Badge color={
                node.status === 'Completed' ? 'green' :
                node.status === 'Running' ? 'blue' :
                node.status === 'Waiting for Approval' ? 'orange' :
                node.status === 'Failed' ? 'red' : 'gray'
              }>
                {node.status}
              </Badge>
              {node.model && (
                <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                  Model: {node.model}
                </span>
              )}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Description & Purpose
            </span>
            <p style={{ fontSize: '13px', color: '#E2E8F0', marginTop: '4px', lineHeight: 1.6 }}>
              {node.description}
            </p>
          </div>

          {/* Telemetry metrics */}
          {node.metrics && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '12px',
              background: '#0B0F19',
              borderRadius: '8px',
              border: '1px solid #1E293B'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Avg Latency</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
                  {node.metrics.avgLatency}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Success Rate</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                  {node.metrics.successRate}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Invocations Today</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-mono)' }}>
                  {node.metrics.callsToday.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Inputs & Outputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#93C5FD', marginBottom: '6px' }}>Input Ingestion Schema</div>
              <ul style={{ fontSize: '12px', color: '#94A3B8', paddingLeft: '16px', lineHeight: 1.6 }}>
                {node.inputs.map((inp, i) => (
                  <li key={i}>{inp}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px', border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#34D399', marginBottom: '6px' }}>Output Delivery Schema</div>
              <ul style={{ fontSize: '12px', color: '#94A3B8', paddingLeft: '16px', lineHeight: 1.6 }}>
                {node.outputs.map((out, i) => (
                  <li key={i}>{out}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* System Prompt Snippet */}
          {node.systemPromptSnippet && (
            <div>
              <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                System Prompt / Directive Boundary
              </span>
              <pre style={{ marginTop: '4px', fontSize: '11.5px' }}>
                {node.systemPromptSnippet}
              </pre>
            </div>
          )}
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
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
