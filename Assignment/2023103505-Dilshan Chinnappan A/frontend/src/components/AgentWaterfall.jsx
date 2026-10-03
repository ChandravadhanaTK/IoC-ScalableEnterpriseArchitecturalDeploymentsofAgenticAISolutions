import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Terminal, 
  Network, 
  Database, 
  Cpu, 
  Lock, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle,
  FileCheck,
  Hash
} from 'lucide-react';

export default function AgentWaterfall({ incident, onOpenApprovalModal }) {
  const [expandedSteps, setExpandedSteps] = useState({ 0: true, 1: true, 2: true, 3: true, 4: true });

  if (!incident) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Select an incident from the stream to view multi-agent analysis.
      </div>
    );
  }

  const toggleStep = (idx) => {
    setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const isAwaitingApproval = incident.status === 'AWAITING_APPROVAL' && incident.remediation;

  return (
    <div className="incident-detail-panel">
      {/* Overview Banner */}
      <div className="incident-banner">
        <div className="banner-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span className="incident-id-badge" style={{ fontSize: '0.9rem' }}>{incident.incident_id}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ingested from {incident.source_feed}</span>
            </div>
            <h1 className="incident-main-heading">{incident.title}</h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Threat Composite Score
            </div>
            <div style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '1.75rem', 
              fontWeight: 800,
              color: incident.composite_risk_score >= 70 ? '#f43f5e' : incident.composite_risk_score >= 35 ? '#f59e0b' : '#10b981'
            }}>
              {incident.composite_risk_score} / 100
            </div>
          </div>
        </div>

        {/* Sanitized Raw Alert Box */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
            Alert Payload (RFC1918 Scrubbed & Sanitized):
          </div>
          <div className="raw-alert-box">
            {incident.sanitized_alert || incident.raw_alert}
          </div>
        </div>

        {/* Extracted IOC Artifacts Chips */}
        {incident.iocs && incident.iocs.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
              Extracted IOC Artifacts ({incident.iocs.length}):
            </div>
            <div className="artifacts-grid">
              {incident.iocs.map(ioc => (
                <div key={ioc.id} className="artifact-chip">
                  <Hash size={13} color="#06b6d4" />
                  <span><strong>{ioc.ioc_type.toUpperCase()}:</strong> {ioc.defanged_value}</span>
                  <span style={{ 
                    color: ioc.verdict === 'MALICIOUS' ? '#f43f5e' : ioc.verdict === 'SUSPICIOUS' ? '#f59e0b' : '#10b981',
                    fontWeight: 700 
                  }}>
                    [{ioc.verdict}]
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MITRE ATT&CK & Blast Radius Summary */}
        {incident.correlation && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '0.75rem', 
            background: 'rgba(0,0,0,0.3)', 
            padding: '0.75rem', 
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)' 
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Target Asset & Host</span>
              <strong style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>{incident.correlation.matched_internal_asset}</strong>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{incident.correlation.department}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>MITRE ATT&CK Tactic</span>
              <strong style={{ fontSize: '0.85rem', color: '#06b6d4' }}>{incident.correlation.mitre_tactic}</strong>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{incident.correlation.mitre_technique_id} - {incident.correlation.mitre_technique_name}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Blast Radius Assessment</span>
              <strong style={{ 
                fontSize: '0.85rem', 
                color: incident.correlation.blast_radius === 'CRITICAL' || incident.correlation.blast_radius === 'HIGH' ? '#f43f5e' : '#f59e0b' 
              }}>
                {incident.correlation.blast_radius} ({incident.correlation.affected_endpoints_count} host affected)
              </strong>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Criticality: {incident.correlation.asset_criticality}</div>
            </div>
          </div>
        )}
      </div>

      {/* HUMAN-IN-THE-LOOP APPROVAL BANNER (If pending action) */}
      {isAwaitingApproval && (
        <div className="containment-action-box">
          <div className="action-header-alert">
            <ShieldAlert size={24} />
            <div>
              <div>HUMAN-IN-THE-LOOP APPROVAL REQUIRED</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 400, color: '#fca5a5' }}>
                High-privilege containment action halted for authorized cryptographic sign-off.
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.825rem' }}>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Proposed Action:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>{incident.remediation.action_type}</span>
            </div>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Target Indicator/Endpoint:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{incident.remediation.target}</span>
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
              <strong>Justification:</strong> {incident.remediation.justification}
            </div>
          </div>

          <div className="action-buttons-group">
            <button className="btn-approve" onClick={onOpenApprovalModal}>
              <CheckCircle2 size={16} />
              Review & Authorize Action
            </button>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Enforces Zero-Trust policy: Dual-authorization boundary active.
            </span>
          </div>
        </div>
      )}

      {/* If already remediated / executed */}
      {incident.remediation && incident.remediation.status === 'EXECUTED' && (
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.3)', 
          borderRadius: '10px', 
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileCheck size={22} color="#10b981" />
            <div>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>
                CONTAINMENT ACTION EXECUTED & ENFORCED
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {incident.remediation.action_type} on {incident.remediation.target} authorized by {incident.remediation.approved_by || 'SOC Lead'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
            Status: {incident.remediation.status}
          </div>
        </div>
      )}

      {/* Agent Reasoning Waterfall */}
      <div className="waterfall-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.025em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} color="#06b6d4" />
            Multi-Agent Reasoning & Execution Waterfall
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            LangGraph Autonomous State Pipeline
          </span>
        </div>

        {incident.agent_steps && incident.agent_steps.map((step, idx) => {
          const isExpanded = expandedSteps[idx] ?? true;

          return (
            <div key={idx} className="agent-step-card">
              <div className="agent-step-header" onClick={() => toggleStep(idx)}>
                <div className="agent-title-info">
                  <div className="agent-number-badge">{idx + 1}</div>
                  <div>
                    <div className="agent-step-name">{step.agent_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {step.summary}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.72rem', 
                    color: '#64748b' 
                  }}>
                    {step.duration_ms}ms
                  </span>
                  <span className={`badge ${step.status === 'completed' ? 'badge-low' : 'badge-high'}`}>
                    {step.status}
                  </span>
                  {isExpanded ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
                </div>
              </div>

              {isExpanded && (
                <div className="agent-step-body">
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                    Agent Reasoning Stream (Internal Trace):
                  </div>
                  <div className="thought-log-box">
                    {step.thought_stream}
                  </div>

                  {step.tool_calls && step.tool_calls.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {step.tool_calls.map((tc, tIdx) => (
                        <div key={tIdx} style={{ 
                          fontSize: '0.7rem', 
                          fontFamily: 'var(--font-mono)', 
                          background: 'rgba(255,255,255,0.03)', 
                          border: '1px solid rgba(255,255,255,0.08)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          color: '#06b6d4'
                        }}>
                          Tool: {tc.tool} {tc.calls ? `(${tc.calls} calls)` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cryptographic Audit Hash Verification */}
      {incident.audit_hash && (
        <div style={{ 
          background: 'rgba(0,0,0,0.4)', 
          border: '1px solid var(--border-subtle)', 
          padding: '0.75rem 1rem', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <Lock size={14} color="#10b981" />
            <span>WORM Cryptographic Audit Hash:</span>
            <code style={{ color: '#06b6d4', fontFamily: 'var(--font-mono)' }}>{incident.audit_hash}</code>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>[SHA-256 IMMUTABLE]</span>
        </div>
      )}
    </div>
  );
}
