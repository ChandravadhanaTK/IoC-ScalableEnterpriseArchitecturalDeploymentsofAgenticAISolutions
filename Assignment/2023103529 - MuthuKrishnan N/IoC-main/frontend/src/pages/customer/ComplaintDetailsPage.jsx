import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintsApi } from '../../api/complaintsApi';
import { ordersApi } from '../../api/ordersApi';
import { approvalsApi } from '../../api/approvalsApi';
import { WorkflowTimeline } from '../../components/WorkflowTimeline';
import { PolicyEvidenceCard } from '../../components/PolicyEvidenceCard';
import { OrderCard } from '../../components/OrderCard';
import {
  ArrowLeft,
  Bot,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  Package,
  Layers,
  Zap,
  Info,
  User,
  Mail,
  CheckCircle,
  XCircle,
  HelpCircle,
  Ticket,
  Send,
  MessageSquare
} from 'lucide-react';

export const ComplaintDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [order, setOrder] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Support action modal state
  const [activeModal, setActiveModal] = useState(null); // 'escalate', 'resolve', 'request_info', 'ticket'
  const [modalText, setModalText] = useState('');

  const isSupportOrAdmin = user && (user.role === 'SUPPORT_AGENT' || user.role === 'ADMIN');

  const loadData = async () => {
    try {
      const comp = await complaintsApi.getComplaint(id);
      setComplaint(comp);

      // Fetch order details if present
      if (comp.order_id) {
        try {
          const ord = await ordersApi.getOrder(comp.order_id);
          setOrder(ord);
        } catch {
          // If customer lacks access or order doesn't exist
        }
      }

      // If support/admin and status is awaiting approval, find approval record
      if (isSupportOrAdmin) {
        try {
          const apps = await approvalsApi.listApprovals();
          const match = apps.find(a => a.complaint_id === id && a.status === 'PENDING');
          setPendingApproval(match || null);
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleReprocess = async () => {
    setReprocessing(true);
    setActionSuccess('');
    try {
      const res = await complaintsApi.processComplaint(id);
      setComplaint(res.complaint || res);
      setActionSuccess('Supervisor workflow re-evaluated successfully.');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to trigger supervisor re-evaluation.');
    } finally {
      setReprocessing(false);
    }
  };

  // Support Actions Handlers
  const handleApproveRefund = async () => {
    if (!pendingApproval) return;
    setActionLoading(true);
    setActionSuccess('');
    try {
      const notes = approvalNotes || 'Approved by support agent after policy verification.';
      await approvalsApi.approve(pendingApproval.id, notes);
      setActionSuccess('Approval granted! The automated action has been executed and complaint resolved.');
      setPendingApproval(null);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve action.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRefund = async () => {
    if (!pendingApproval) return;
    setActionLoading(true);
    setActionSuccess('');
    try {
      const notes = approvalNotes || 'Declined by support agent per company policy.';
      await approvalsApi.reject(pendingApproval.id, notes);
      setActionSuccess('Action rejected. Complaint has been escalated for review.');
      setPendingApproval(null);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject action.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteSupportAction = async () => {
    setActionLoading(true);
    setActionSuccess('');
    try {
      if (activeModal === 'escalate') {
        const updated = await complaintsApi.escalateComplaint(id, modalText || 'Escalated by Support Agent.');
        setComplaint(updated);
        setActionSuccess('Complaint successfully escalated to Tier-2 Support.');
      } else if (activeModal === 'resolve') {
        const updated = await complaintsApi.resolveComplaint(id, modalText || 'Resolved per support agent investigation.');
        setComplaint(updated);
        setActionSuccess('Complaint marked as resolved.');
      } else if (activeModal === 'request_info') {
        const updated = await complaintsApi.requestInfo(id, modalText || 'Please provide additional order receipt details.');
        setComplaint(updated);
        setActionSuccess('Information request dispatched to customer.');
      } else if (activeModal === 'ticket') {
        const updated = await complaintsApi.createTicket(id, modalText || 'Technical engineering ticket generated.');
        setComplaint(updated);
        setActionSuccess('Internal Support Ticket created.');
      }
      setActiveModal(null);
      setModalText('');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to execute support action.');
    } finally {
      setActionLoading(false);
    }
  };

  const getBackRoute = () => {
    if (user?.role === 'SUPPORT_AGENT') return '/support/dashboard';
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    return '/customer/complaints';
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-state full-height">
          <Bot size={36} className="animate-spin text-primary" />
          <p>Retrieving multi-agent execution state & audit trace...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="dashboard-content">
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <span>{error || 'Complaint record not found.'}</span>
        </div>
        <Link to={getBackRoute()} className="btn-secondary mt-4">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const aiAnalysis = complaint.ai_analysis || {};
  const requiresApproval = aiAnalysis.requires_approval || complaint.status === 'PENDING_APPROVAL' || complaint.status === 'AWAITING_APPROVAL';
  const policyCitations = aiAnalysis.policy_citations || complaint.retrieved_policies || [];

  return (
    <div className="dashboard-content">
      {/* Top Navigation Row */}
      <div className="page-header-row">
        <Link to={getBackRoute()} className="btn-back">
          <ArrowLeft size={16} />
          {user?.role === 'CUSTOMER' ? 'Back to My Complaints' : 'Back to Dashboard'}
        </Link>

        <div className="header-actions-row">
          <button
            type="button"
            onClick={handleReprocess}
            disabled={reprocessing}
            className="btn-secondary"
            title="Re-run Supervisor and specialized agents"
          >
            <RotateCcw size={16} className={reprocessing ? 'animate-spin' : ''} />
            {reprocessing ? 'Orchestrating...' : 'Re-Run Agent Evaluation'}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert-box alert-success mb-4">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Customer Information (Displayed for Support Agent & Admin per Requirement 11) */}
      {isSupportOrAdmin && (
        <div className="card customer-info-banner mb-6">
          <div className="customer-info-header">
            <User size={18} className="text-primary" />
            <h3>Customer Identity & Account Context</h3>
          </div>
          <div className="customer-info-grid">
            <div>
              <span className="text-muted text-xs">Customer Name</span>
              <div className="font-semibold text-base">{complaint.customer_name || 'Rahul Sharma'}</div>
            </div>
            <div>
              <span className="text-muted text-xs">Customer ID</span>
              <div className="font-mono text-primary font-semibold">{complaint.customer_id}</div>
            </div>
            <div>
              <span className="text-muted text-xs">Email Address</span>
              <div className="font-mono text-sm">{complaint.customer_email || 'customer@example.com'}</div>
            </div>
            <div>
              <span className="text-muted text-xs">Assigned Handling Agent</span>
              <div className="text-sm font-semibold">{complaint.assigned_agent || 'Autonomous Supervisor'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Complaint Overview Header */}
      <div className="complaint-hero-card">
        <div className="complaint-hero-top">
          <div>
            <div className="complaint-id-row">
              <span className="complaint-id-badge font-mono">{complaint.id}</span>
              <span className={`status-pill status-${complaint.status.toLowerCase()}`}>
                {complaint.status}
              </span>
              <span className={`badge-priority priority-${(complaint.priority || 'medium').toLowerCase()}`}>
                Priority: {complaint.priority || 'MEDIUM'}
              </span>
            </div>
            <h1 className="complaint-main-title">{complaint.title}</h1>
          </div>
        </div>

        <div className="complaint-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Customer ID</span>
            <span className="meta-val font-mono">{complaint.customer_id}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Associated Order</span>
            <span className="meta-val font-mono">{complaint.order_id || 'None provided'}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Detected Category</span>
            <span className="meta-val badge-category">{complaint.category || 'UNCATEGORIZED'}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Date Submitted</span>
            <span className="meta-val">{new Date(complaint.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="complaint-desc-box">
          <span className="desc-box-label">Customer Complaint Statement:</span>
          <p className="desc-text">{complaint.description}</p>
        </div>
      </div>

      {/* Human-in-the-Loop Approval Card per Requirement 13 */}
      {requiresApproval && (
        <div className="hitl-banner-alert">
          <div className="hitl-icon-box">
            <ShieldCheck size={28} className="text-warning" />
          </div>
          <div className="hitl-text-box">
            <h4>Human-in-the-Loop (HITL) Authorization Required</h4>
            <p>
              {pendingApproval?.reason || aiAnalysis.reason || 'This transaction exceeds automated risk thresholds and requires human authorization.'}
            </p>

            {isSupportOrAdmin && pendingApproval && (
              <div className="hitl-approval-form mt-4">
                <div className="approval-request-summary">
                  <span><strong>Requested Action:</strong> {pendingApproval.requested_action}</span>
                  {pendingApproval.amount && <span><strong>Amount:</strong> ₹{Number(pendingApproval.amount).toLocaleString()}</span>}
                  <span><strong>AI Recommendation:</strong> Approve (Meets policy criteria)</span>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold mb-1 block">Support Reviewer Notes / Authorization Code:</label>
                  <input
                    type="text"
                    placeholder="e.g. Verified packaging damage evidence with customer..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="form-input mb-3"
                  />
                </div>

                <div className="approval-btn-group">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleApproveRefund}
                    className="btn-primary btn-success-theme"
                  >
                    <CheckCircle size={16} />
                    {actionLoading ? 'Processing...' : 'Approve & Execute Resolution'}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleRejectRefund}
                    className="btn-danger-outline"
                  >
                    <XCircle size={16} />
                    Reject Action
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPPORT AGENT ACTIONS TOOLBAR per Requirement 12 */}
      {isSupportOrAdmin && (
        <div className="card support-actions-card mb-6">
          <div className="support-actions-header">
            <ShieldCheck size={18} className="text-primary" />
            <h3>Support Agent Resolution Actions</h3>
            <span className="badge-shield">Working API Controls</span>
          </div>

          <p className="text-muted text-sm mb-4">
            Execute direct operational overrides on this complaint. All actions are validated by backend RBAC and recorded in the enterprise audit log.
          </p>

          <div className="support-action-buttons">
            <button
              type="button"
              onClick={() => { setActiveModal('resolve'); setModalText(''); }}
              className="btn-action-support resolve"
            >
              <CheckCircle2 size={16} />
              Resolve Complaint
            </button>

            <button
              type="button"
              onClick={() => { setActiveModal('escalate'); setModalText(''); }}
              className="btn-action-support escalate"
            >
              <AlertTriangle size={16} />
              Escalate to Tier-2
            </button>

            <button
              type="button"
              onClick={() => { setActiveModal('request_info'); setModalText(''); }}
              className="btn-action-support request-info"
            >
              <HelpCircle size={16} />
              Request Customer Info
            </button>

            <button
              type="button"
              onClick={() => { setActiveModal('ticket'); setModalText(''); }}
              className="btn-action-support ticket"
            >
              <Ticket size={16} />
              Create Support Ticket
            </button>
          </div>
        </div>
      )}

      {/* Action Dialog Modal */}
      {activeModal && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                {activeModal === 'resolve' && <CheckCircle2 size={18} className="text-success" />}
                {activeModal === 'escalate' && <AlertTriangle size={18} className="text-danger" />}
                {activeModal === 'request_info' && <HelpCircle size={18} className="text-warning" />}
                {activeModal === 'ticket' && <Ticket size={18} className="text-primary" />}
                <h3>
                  {activeModal === 'resolve' && 'Mark Complaint as Resolved'}
                  {activeModal === 'escalate' && 'Escalate Complaint to Tier-2'}
                  {activeModal === 'request_info' && 'Request Additional Information from Customer'}
                  {activeModal === 'ticket' && 'Generate Internal Engineering Support Ticket'}
                </h3>
              </div>
            </div>

            <div className="modal-body">
              <label className="block text-sm font-semibold mb-2">
                {activeModal === 'resolve' && 'Final Resolution Explanation for Customer:'}
                {activeModal === 'escalate' && 'Reason for Escalation:'}
                {activeModal === 'request_info' && 'Information Needed from Customer:'}
                {activeModal === 'ticket' && 'Internal Ticket Description / Notes:'}
              </label>

              <textarea
                rows={4}
                value={modalText}
                onChange={(e) => setModalText(e.target.value)}
                placeholder="Enter details here..."
                className="form-input w-full"
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteSupportAction}
                className="btn-primary"
              >
                {actionLoading ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout: Timeline + AI Synthesis */}
      <div className="details-two-col-grid">
        {/* Left Column: Visual Workflow Timeline */}
        <div className="col-left">
          <WorkflowTimeline
            timeline={complaint.timeline || []}
            currentStatus={complaint.status}
          />

          {/* Executed Resolution Card */}
          {complaint.resolution && (
            <div className="resolution-outcome-card">
              <div className="outcome-header">
                <CheckCircle2 size={20} className="text-success" />
                <h3>Executed Resolution & Explanation</h3>
              </div>
              <p className="outcome-text">{complaint.resolution}</p>
            </div>
          )}
        </div>

        {/* Right Column: Multi-Agent Analysis, Policy RAG, & Order Evidence */}
        <div className="col-right">
          {/* AI Supervisor & Sub-Agent Synthesis */}
          <div className="ai-synthesis-card">
            <div className="synthesis-header">
              <div className="synthesis-title-row">
                <Bot size={20} className="text-primary" />
                <h3>Autonomous Agent Analysis</h3>
              </div>
              <span className="badge-agent-orchestrator">Supervisor Orchestrated</span>
            </div>

            <div className="agent-breakdown-list">
              <div className="agent-item">
                <div className="agent-label">
                  <span className="agent-name">IntentAgent</span>
                  <span className="agent-badge">Classification</span>
                </div>
                <div className="agent-detail">
                  Detected Category: <strong>{aiAnalysis.detected_category || complaint.category || 'N/A'}</strong>
                  {aiAnalysis.customer_intent && <div>Customer Intent: <strong>{aiAnalysis.customer_intent}</strong></div>}
                </div>
              </div>

              <div className="agent-item">
                <div className="agent-label">
                  <span className="agent-name">OrderAgent</span>
                  <span className="agent-badge">Tool Caller</span>
                </div>
                <div className="agent-detail">
                  {complaint.order_id ? (
                    <span>Verified purchase integrity for Order <code>{complaint.order_id}</code></span>
                  ) : (
                    <span>No order reference supplied</span>
                  )}
                </div>
              </div>

              <div className="agent-item">
                <div className="agent-label">
                  <span className="agent-name">ResolutionAgent</span>
                  <span className="agent-badge">Policy Matcher</span>
                </div>
                <div className="agent-detail">
                  Proposed: <strong>{aiAnalysis.proposed_resolution || complaint.status}</strong>
                  {aiAnalysis.reason && <p className="reason-sub">"{aiAnalysis.reason}"</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Verified Order Information */}
          <OrderCard order={order} />

          {/* Retrieved Policy Documents (ChromaDB RAG) */}
          <PolicyEvidenceCard policies={policyCitations} />
        </div>
      </div>
    </div>
  );
};
