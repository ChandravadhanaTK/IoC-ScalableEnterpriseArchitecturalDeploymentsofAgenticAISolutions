import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, Key } from 'lucide-react';

export default function ApprovalModal({ incident, onClose, onSubmitApproval }) {
  const [analystName, setAnalystName] = useState('Alex Mercer (Lead SOC Analyst)');
  const [justification, setJustification] = useState(
    'Confirmed active C2 communication matching APT29 indicators. Enclave dual-authorization approved.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!incident || !incident.remediation) return null;

  const action = incident.remediation;

  const handleDecision = async (decision) => {
    setIsSubmitting(true);
    try {
      await onSubmitApproval(incident.incident_id, {
        decision,
        analyst_name: analystName,
        justification,
      });
      onClose();
    } catch (e) {
      alert(`Approval error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.2)', padding: '0.4rem', borderRadius: '8px', color: '#f43f5e' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                Human-in-the-Loop Containment Gate
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Incident: {incident.incident_id} | High-Privilege Action Enclave
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            padding: '0.85rem', 
            borderRadius: '8px',
            fontSize: '0.825rem',
            color: '#fecdd3'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <AlertTriangle size={16} color="#f43f5e" />
              Containment Impact Warning
            </div>
            This action will modify perimeter access lists or isolate the host from corporate networks. Immediate disruption to standard traffic may occur.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <span className="form-label">Proposed Containment</span>
              <div style={{ 
                background: 'rgba(0,0,0,0.4)', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '6px', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.85rem',
                color: '#fbbf24',
                border: '1px solid var(--border-subtle)'
              }}>
                {action.action_type}
              </div>
            </div>

            <div className="form-group">
              <span className="form-label">Target Asset / Host</span>
              <div style={{ 
                background: 'rgba(0,0,0,0.4)', 
                padding: '0.5rem 0.75rem', 
                borderRadius: '6px', 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.85rem',
                color: '#ffffff',
                border: '1px solid var(--border-subtle)'
              }}>
                {action.target}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deterministic Rollback Procedure</label>
            <div style={{ 
              background: 'rgba(0,0,0,0.4)', 
              padding: '0.5rem 0.75rem', 
              borderRadius: '6px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.75rem',
              color: '#94a3b8',
              border: '1px solid var(--border-subtle)'
            }}>
              {action.rollback_plan || 'Automated rollback script registered.'}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Approving Analyst / Role</label>
            <input 
              type="text" 
              className="form-input"
              value={analystName}
              onChange={(e) => setAnalystName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Incident Sign-off Justification</label>
            <textarea 
              className="form-textarea"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-reject"
            disabled={isSubmitting}
            onClick={() => handleDecision('REJECT')}
          >
            <XCircle size={15} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
            Reject & Dismiss
          </button>

          <button 
            className="btn-approve"
            disabled={isSubmitting}
            onClick={() => handleDecision('APPROVE')}
          >
            <CheckCircle size={16} />
            {isSubmitting ? 'Enforcing...' : 'Authorize & Execute Containment'}
          </button>
        </div>
      </div>
    </div>
  );
}
