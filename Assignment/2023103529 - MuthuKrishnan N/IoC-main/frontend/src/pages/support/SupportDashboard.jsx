import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../../api/complaintsApi';
import { approvalsApi } from '../../api/approvalsApi';
import {
  CheckSquare,
  FileText,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Bot,
  UserCheck,
  Filter,
  CheckCircle2,
  Search,
  ExternalLink
} from 'lucide-react';

export const SupportDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, apps] = await Promise.all([
        complaintsApi.listComplaints(),
        approvalsApi.listApprovals('PENDING')
      ]);
      setComplaints(comps);
      setApprovals(apps);
    } catch (err) {
      console.error('Failed to load support dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute overview cards
  const openComplaintsCount = complaints.filter(c => !['RESOLVED', 'REJECTED', 'CLOSED'].includes(c.status)).length;
  const pendingApprovalsCount = approvals.length;
  const escalatedComplaintsCount = complaints.filter(c => c.status === 'ESCALATED').length;
  
  // Resolved today calculation
  const todayDateStr = new Date().toDateString();
  const resolvedTodayCount = complaints.filter(c => {
    if (c.status !== 'RESOLVED') return false;
    const updatedAt = new Date(c.updated_at || c.created_at).toDateString();
    return updatedAt === todayDateStr;
  }).length;

  // Filter queue
  const filteredComplaints = complaints.filter(c => {
    // 1. Tab filter
    if (activeFilter === 'OPEN') {
      if (['RESOLVED', 'REJECTED', 'CLOSED'].includes(c.status)) return false;
    } else if (activeFilter === 'PENDING_APPROVAL') {
      if (c.status !== 'PENDING_APPROVAL' && c.status !== 'AWAITING_APPROVAL') return false;
    } else if (activeFilter === 'ESCALATED') {
      if (c.status !== 'ESCALATED') return false;
    } else if (activeFilter === 'RESOLVED') {
      if (c.status !== 'RESOLVED') return false;
    } else if (activeFilter === 'HIGH_PRIORITY') {
      if (c.priority !== 'HIGH' && c.priority !== 'CRITICAL') return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(c.id || '').toLowerCase().includes(q);
      const matchCustomer = String(c.customer_name || c.customer_id || '').toLowerCase().includes(q);
      const matchSubject = String(c.title || c.description || '').toLowerCase().includes(q);
      const matchCategory = String(c.category || '').toLowerCase().includes(q);
      return matchId || matchCustomer || matchSubject || matchCategory;
    }

    return true;
  });

  return (
    <div className="dashboard-content">
      {/* Support Workspace Banner */}
      <div className="welcome-banner support-theme">
        <div className="welcome-text-box">
          <h2>Support Agent Operations Center</h2>
          <p>
            Review automated agent triage, inspect order history and policy evidence, approve sensitive financial requests, and resolve customer complaints.
          </p>
        </div>
        <Link to="/support/approvals" className="btn-primary btn-warning-theme">
          <CheckSquare size={18} />
          Pending Approvals Queue ({approvals.length})
        </Link>
      </div>

      {/* KPI Overview Cards per Requirement 10 */}
      <div className="kpi-grid kpi-grid-4">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Open Complaints</span>
            <FileText size={18} className="text-primary" />
          </div>
          <div className="kpi-value">{openComplaintsCount}</div>
          <div className="kpi-sub">Awaiting action or in pipeline</div>
        </div>

        <div className="kpi-card highlight-warning">
          <div className="kpi-header">
            <span className="kpi-title">Pending Approvals</span>
            <CheckSquare size={18} className="text-warning" />
          </div>
          <div className="kpi-value text-warning">{pendingApprovalsCount}</div>
          <div className="kpi-sub">High-value refunds & exceptions</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Escalated Complaints</span>
            <AlertTriangle size={18} className="text-danger" />
          </div>
          <div className="kpi-value text-danger">{escalatedComplaintsCount}</div>
          <div className="kpi-sub">Requires Tier-2 intervention</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Resolved Today</span>
            <CheckCircle2 size={18} className="text-success" />
          </div>
          <div className="kpi-value text-success">{resolvedTodayCount}</div>
          <div className="kpi-sub">Successfully closed cases</div>
        </div>
      </div>

      {/* Urgent HITL Approvals Alert */}
      {approvals.length > 0 && (
        <div className="alert-card-actionable">
          <div className="actionable-content">
            <ShieldCheck size={24} className="text-warning" />
            <div>
              <h4>{approvals.length} Sensitive Action(s) Require Support Sign-off</h4>
              <p>Refunds exceeding ₹5,000 or policy overrides require authorized review before payout.</p>
            </div>
          </div>
          <Link to="/support/approvals" className="btn-primary btn-warning-theme">
            Review Approvals
          </Link>
        </div>
      )}

      {/* Complaint Queue Table with Filters per Requirement 10 */}
      <div className="table-card mt-6">
        <div className="table-header">
          <div className="table-title">
            <FileText size={18} className="text-primary" />
            <h3>Complaint Queue</h3>
          </div>
          <div className="search-input-box">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search by ID, customer, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input search-input"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="table-filter-bar queue-filter-bar">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
          >
            All ({complaints.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('OPEN')}
            className={`filter-pill ${activeFilter === 'OPEN' ? 'active' : ''}`}
          >
            Open ({openComplaintsCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('PENDING_APPROVAL')}
            className={`filter-pill ${activeFilter === 'PENDING_APPROVAL' ? 'active' : ''}`}
          >
            Pending Approval ({pendingApprovalsCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ESCALATED')}
            className={`filter-pill ${activeFilter === 'ESCALATED' ? 'active' : ''}`}
          >
            Escalated ({escalatedComplaintsCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('RESOLVED')}
            className={`filter-pill ${activeFilter === 'RESOLVED' ? 'active' : ''}`}
          >
            Resolved ({complaints.filter(c => c.status === 'RESOLVED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('HIGH_PRIORITY')}
            className={`filter-pill ${activeFilter === 'HIGH_PRIORITY' ? 'active' : ''}`}
          >
            High Priority ({complaints.filter(c => ['HIGH', 'CRITICAL'].includes(c.priority)).length})
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <Bot size={28} className="animate-spin text-primary" />
            <p>Loading complaint queue...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={36} className="text-success" />
            <p>No complaints match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Assigned Agent</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-primary font-bold">
                      <Link to={`/support/complaints/${c.id}`} className="table-cell-link">
                        {c.id}
                      </Link>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name font-medium">{c.customer_name || 'Customer'}</span>
                        <span className="customer-id text-xs text-muted font-mono">{c.customer_id}</span>
                      </div>
                    </td>
                    <td className="font-medium max-w-xs truncate" title={c.title}>
                      {c.title}
                    </td>
                    <td>
                      <span className="badge-category">{c.category || 'UNCATEGORIZED'}</span>
                    </td>
                    <td>
                      <span className={`badge-priority priority-${(c.priority || 'medium').toLowerCase()}`}>
                        {c.priority || 'MEDIUM'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-muted">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-xs font-mono">
                      {c.assigned_agent || 'AI Supervisor'}
                    </td>
                    <td>
                      <Link
                        to={`/support/complaints/${c.id}`}
                        className="btn-table-action"
                      >
                        Inspect & Resolve
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
