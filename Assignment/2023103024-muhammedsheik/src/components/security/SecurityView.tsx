import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  UserCheck, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Download,
  Filter,
  Search,
  Database
} from 'lucide-react';
import { AUDIT_LOGS_DATA, GUARDRAIL_RULES_DATA } from '../../services/mockData';
import { Badge } from '../common/Badge';
import { GuardrailSimulator } from './GuardrailSimulator';

export const SecurityView: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'SecOps Admin' | 'Agent Developer' | 'Cloud Architect' | 'Compliance Auditor' | 'API Guest'>('SecOps Admin');
  const [searchTerm, setSearchTerm] = useState('');

  const rbacMatrix: Record<string, { desc: string; permissions: Record<string, boolean> }> = {
    'SecOps Admin': {
      desc: 'Full administrative access across all agent nodes, sandbox environments, and security guardrail policies.',
      permissions: {
        'Invoke Agent Assistant': true,
        'Execute Tool Sandboxes (MicroVM)': true,
        'Authorize HITL Production Operations': true,
        'Modify Guardrail Rules & Thresholds': true,
        'Export Immutable Audit Logs': true,
        'Rotate Dynamic Vault Credentials': true
      }
    },
    'Agent Developer': {
      desc: 'Build and tune specialist agent prompts and tool integration adapters with sandbox testing privileges.',
      permissions: {
        'Invoke Agent Assistant': true,
        'Execute Tool Sandboxes (MicroVM)': true,
        'Authorize HITL Production Operations': false,
        'Modify Guardrail Rules & Thresholds': false,
        'Export Immutable Audit Logs': false,
        'Rotate Dynamic Vault Credentials': false
      }
    },
    'Cloud Architect': {
      desc: 'Inspect cloud architecture recommendations and trigger read-only IAM infrastructure scans.',
      permissions: {
        'Invoke Agent Assistant': true,
        'Execute Tool Sandboxes (MicroVM)': true,
        'Authorize HITL Production Operations': true,
        'Modify Guardrail Rules & Thresholds': false,
        'Export Immutable Audit Logs': true,
        'Rotate Dynamic Vault Credentials': false
      }
    },
    'Compliance Auditor': {
      desc: 'Read-only access to tamper-evident audit ledgers, PII sanitization statistics, and SOC2 evidence exports.',
      permissions: {
        'Invoke Agent Assistant': false,
        'Execute Tool Sandboxes (MicroVM)': false,
        'Authorize HITL Production Operations': false,
        'Modify Guardrail Rules & Thresholds': false,
        'Export Immutable Audit Logs': true,
        'Rotate Dynamic Vault Credentials': false
      }
    },
    'API Guest': {
      desc: 'Restricted external gateway access with strict token budget limits and rate throttling.',
      permissions: {
        'Invoke Agent Assistant': true,
        'Execute Tool Sandboxes (MicroVM)': false,
        'Authorize HITL Production Operations': false,
        'Modify Guardrail Rules & Thresholds': false,
        'Export Immutable Audit Logs': false,
        'Rotate Dynamic Vault Credentials': false
      }
    }
  };

  const filteredLogs = AUDIT_LOGS_DATA.filter((log) =>
    log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div className="enterprise-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge color="green">Zero Trust Architecture</Badge>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>SOC2 Type II • HIPAA • ISO 27001</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', marginTop: '4px' }}>
            Enterprise Security, Guardrails & Trust Boundaries
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>
            Multi-layer defense: OAuth 2.0 authentication, fine-grained RBAC, NeMo safety guardrails, Presidio PII redaction, and tamper-evident audit logging.
          </p>
        </div>
      </div>

      {/* Security Pillars Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <div className="enterprise-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Key size={18} color="#3B82F6" />
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>Authentication & OIDC</span>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
            OAuth 2.0 + PKCE with short-lived JWT tokens (15-min TTL) and service-to-service mTLS mesh.
          </p>
        </div>

        <div className="enterprise-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Lock size={18} color="#8B5CF6" />
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>Secrets Management</span>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
            HashiCorp Vault dynamic ephemeral credentials injected at runtime with zero persistent disk storage.
          </p>
        </div>

        <div className="enterprise-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ShieldCheck size={18} color="#10B981" />
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>Zero-Retention Privacy</span>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
            Enterprise API agreements guarantee zero model training on customer payloads; in-memory PII scrubbers.
          </p>
        </div>

        <div className="enterprise-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Database size={18} color="#F59E0B" />
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>Audit Immutability</span>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
            Cryptographically linked SHA-256 event chains for continuous non-repudiation and compliance proofs.
          </p>
        </div>
      </div>

      {/* Interactive Guardrail Simulator */}
      <GuardrailSimulator />

      {/* RBAC Matrix & Active Guardrail Rules */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px'
      }}>
        
        {/* Interactive RBAC Matrix */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
              Role-Based Access Control (RBAC) Simulator
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B' }}>
              Select a persona to test and inspect effective runtime permissions
            </p>
          </div>

          {/* Role selector chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.keys(rbacMatrix).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: selectedRole === role ? '#3B82F6' : '#1E293B',
                  background: selectedRole === role ? 'rgba(59, 130, 246, 0.15)' : '#0B0F19',
                  color: selectedRole === role ? '#FFFFFF' : '#94A3B8',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {role}
              </button>
            ))}
          </div>

          <div style={{
            background: '#0B0F19',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '12.5px',
            color: '#94A3B8'
          }}>
            <strong style={{ color: '#F1F5F9' }}>Role Context:</strong> {rbacMatrix[selectedRole].desc}
          </div>

          {/* Permissions table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(rbacMatrix[selectedRole].permissions).map(([perm, granted]) => (
              <div 
                key={perm}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#0B0F19',
                  borderRadius: '6px',
                  border: '1px solid #1E293B'
                }}
              >
                <span style={{ fontSize: '12px', color: '#E2E8F0' }}>{perm}</span>
                <Badge color={granted ? 'green' : 'red'}>
                  {granted ? 'GRANTED' : 'DENIED'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Active Guardrail Rule Engines */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
              Enforced Guardrail Filters & Policies
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B' }}>
              Inline safety classifier configurations and blocked threat tallies
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {GUARDRAIL_RULES_DATA.map((rule) => (
              <div
                key={rule.id}
                style={{
                  background: '#0B0F19',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
                    {rule.name}
                  </span>
                  <Badge color={rule.action === 'BLOCK' ? 'red' : rule.action === 'REDACT' ? 'orange' : 'purple'}>
                    {rule.action}
                  </Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                  <span>Category: {rule.category}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#10B981' }}>
                    Blocked: {rule.blockedCount} attempts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Immutable Audit Logging Ledger */}
      <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
              Immutable Compliance Audit Ledger
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B' }}>
              Cryptographically signed trail of actor access, agent tool operations, and guardrail decisions
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search audit records..."
                style={{
                  backgroundColor: '#0B0F19',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: '#F8FAFC',
                  outline: 'none',
                  width: '220px'
                }}
              />
            </div>
            <button 
              className="btn-secondary"
              onClick={() => alert('Exporting signed audit snapshot as CSV...')}
              style={{ fontSize: '11.5px', padding: '6px 12px' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Audit Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B', color: '#64748B' }}>
                <th style={{ padding: '10px 12px' }}>Timestamp</th>
                <th style={{ padding: '10px 12px' }}>Actor</th>
                <th style={{ padding: '10px 12px' }}>Role</th>
                <th style={{ padding: '10px 12px' }}>Action & Operation</th>
                <th style={{ padding: '10px 12px' }}>Target Resource</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id}
                  style={{ borderBottom: '1px solid #1E293B', transition: 'background-color 0.15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0E1424'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>{log.timestamp}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#F1F5F9' }}>{log.actor}</td>
                  <td style={{ padding: '10px 12px', color: '#64748B' }}>{log.role}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#60A5FA' }}>{log.action}</td>
                  <td style={{ padding: '10px 12px', color: '#94A3B8', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.resource}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge color={log.status === 'SUCCESS' ? 'green' : log.status === 'DENIED' ? 'red' : 'orange'}>
                      {log.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#64748B' }}>{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
