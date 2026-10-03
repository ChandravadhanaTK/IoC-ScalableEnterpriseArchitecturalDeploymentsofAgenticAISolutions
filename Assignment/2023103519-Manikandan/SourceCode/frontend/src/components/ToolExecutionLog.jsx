import React from 'react';
import { Terminal, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ToolExecutionLog({ logs }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Terminal size={18} color="#8b5cf6" /> Live Agent Handoff & Audit Log Stream
      </h3>

      <div
        className="font-mono"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '12px',
          padding: '16px',
          flexGrow: 1,
          overflowY: 'auto',
          maxHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
            No agent actions recorded yet. Enter a goal above to execute.
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                fontSize: '0.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                paddingBottom: '6px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <span style={{ color: '#64748b' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span style={{ color: '#06b6d4', fontWeight: 700 }}>[{log.agent || 'SYSTEM'}]:</span>
              <span style={{ color: log.state === 'REJECTED' ? '#ef4444' : log.state === 'PENDING_HUMAN_APPROVAL' ? '#fbbf24' : '#e2e8f0' }}>
                {log.message || log.error || JSON.stringify(log.output?.summary || '')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
