import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { approvalsApi } from '../../api/approvalsApi';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Bot,
  ExternalLink,
  MessageSquare,
  Info
} from 'lucide-react';

export const SupportApprovalsPage = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadApprovals = async () => {
    try {
      const data = await approvalsApi.listApprovals();
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleApprove = async (id) => {
    setSubmittingId(id);
    setFeedback(null);
    try {
      const notes = actionNotes[id] || 'Approved by Support Agent after policy verification.';
      const res = await approvalsApi.approve(id, notes);
      setFeedback({
        type: 'success',
        message: `Approval granted! Autonomous ActionAgent successfully executed the transaction. Result: ${res.workflow_result?.message || 'Action completed'}`
      });
      await loadApprovals();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to approve action.'
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (id) => {
    setSubmittingId(id);
    setFeedback(null);
    try {
      const reason = actionNotes[id] || 'Rejected by Support Agent due to policy non-compliance.';
      await approvalsApi.reject(id, reason);
      setFeedback({
        type: 'warning',
        message: 'Action rejected. Complaint state updated and audit log recorded.'
      });
      await loadApprovals();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to reject action.'
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const pastApprovals = approvals.filter(a => a.status !== 'PENDING');

  return (
    <div className="dashboard-content">
      <div className="page-header-row">
        <div>
          <h2>Human-in-the-Loop (HITL) Approval Queue</h2>
          <p className="page-header-sub">
            Review sensitive AI recommendations requiring human authorization before financial or operational execution.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`alert-box ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Pending Reviews Section */}
      <div className="section-block">
        <div className="section-header-row">
          <div className="section-title">
            <ShieldCheck size={20} className="text-warning" />
            <h3>Pending Authorization Requests ({pendingApprovals.length})</h3>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <Bot size={28} className="animate-spin text-primary" />
            <p>Retrieving approval queue...</p>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="empty-state card">
            <CheckCircle size={36} className="text-success" />
            <p>No pending approvals. All autonomous agent recommendations are authorized or executed.</p>
          </div>
        ) : (
          <div className="approvals-cards-grid">
            {pendingApprovals.map((app) => (
              <div key={app.id} className="approval-card">
                <div className="approval-card-top">
                  <div className="approval-id-group">
                    <span className="font-mono text-primary font-bold">{app.id}</span>
                    <span className="badge-warning font-semibold">{app.status}</span>
                  </div>
                  <Link
                    to={`/support/complaints/${app.complaint_id}`}
                    className="btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Inspect AI State & Details"
                  >
                    <span>VIEW COMPLAINT</span> <ExternalLink size={13} />
                  </Link>
                </div>

                <div className="approval-body">
                  <div className="approval-grid-two-col">
                    <div className="approval-field">
                      <span className="field-label">Complaint:</span>
                      <strong className="field-value font-mono text-primary">{app.complaint_id}</strong>
                    </div>
                    <div className="approval-field">
                      <span className="field-label">Customer:</span>
                      <strong className="field-value">{app.customer_name || app.customer_id || 'Valued Customer'}</strong>
                    </div>
                    <div className="approval-field">
                      <span className="field-label">Requested Action:</span>
                      <strong className="field-action font-mono">{app.requested_action}</strong>
                    </div>
                    <div className="approval-field">
                      <span className="field-label">Amount:</span>
                      <strong className="field-value font-mono text-success">
                        {app.amount ? `₹${Number(app.amount).toLocaleString('en-IN')}` : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  <div className="approval-field">
                    <span className="field-label">Reason:</span>
                    <p className="field-reason">{app.reason}</p>
                  </div>

                  <div className="approval-field">
                    <span className="field-label">AI Recommendation:</span>
                    <p className="field-recommendation text-info" style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                      {app.ai_recommendation || 'Resolution recommended according to enterprise policy guidelines.'}
                    </p>
                  </div>

                  <div className="approval-field">
                    <span className="field-label">Created Time:</span>
                    <small className="text-muted">{app.created_at ? new Date(app.created_at).toLocaleString() : 'Recent'}</small>
                  </div>

                  <div className="approval-input-box">
                    <label htmlFor={`notes-${app.id}`}>
                      <MessageSquare size={14} /> Reviewer Justification Notes:
                    </label>
                    <input
                      id={`notes-${app.id}`}
                      type="text"
                      placeholder="e.g. Approved per refund policy after order inspection..."
                      value={actionNotes[app.id] || ''}
                      onChange={(e) => setActionNotes({ ...actionNotes, [app.id]: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="approval-actions-row">
                  <button
                    type="button"
                    disabled={submittingId === app.id}
                    onClick={() => handleReject(app.id)}
                    className="btn-danger-outline"
                  >
                    <XCircle size={16} />
                    REJECT
                  </button>

                  <button
                    type="button"
                    disabled={submittingId === app.id}
                    onClick={() => handleApprove(app.id)}
                    className="btn-primary btn-success-theme"
                  >
                    <CheckCircle size={16} />
                    {submittingId === app.id ? 'Authorizing...' : 'APPROVE'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Approvals Table */}
      {pastApprovals.length > 0 && (
        <div className="table-card mt-8">
          <div className="table-header">
            <div className="table-title">
              <CheckSquare size={18} className="text-primary" />
              <h3>Approval History & Audit Trail</h3>
            </div>
          </div>
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Approval ID</th>
                  <th>Complaint</th>
                  <th>Customer</th>
                  <th>Action</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {pastApprovals.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono">{a.id}</td>
                    <td className="font-mono text-primary">
                      <Link to={`/support/complaints/${a.complaint_id}`}>
                        {a.complaint_id}
                      </Link>
                    </td>
                    <td>{a.customer_name || a.customer_id || '—'}</td>
                    <td className="font-mono">{a.requested_action}</td>
                    <td className="font-mono">{a.amount ? `₹${Number(a.amount).toLocaleString('en-IN')}` : '—'}</td>
                    <td>
                      <span className={`status-pill status-${a.status.toLowerCase()}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>{a.reviewed_by || 'System'}</td>
                    <td className="max-w-xs truncate">{a.review_notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
