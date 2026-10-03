import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { complaintsApi } from '../../api/complaintsApi';
import {
  Activity,
  Bot,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Clock,
  CheckCircle,
  AlertTriangle,
  History,
  DollarSign,
  Layers,
  ArrowRight,
  Database,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Filter,
  FileText,
  ShieldAlert,
  Settings,
  X
} from 'lucide-react';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'complaints'
  
  // Feedback
  const [feedback, setFeedback] = useState(null);

  // User management state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('SUPPORT_AGENT');
  const [userActionLoading, setUserActionLoading] = useState(false);

  // Complaints filter state
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('');
  const [complaintPriorityFilter, setComplaintPriorityFilter] = useState('');
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, am, u, c] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getAgentMetrics(),
        adminApi.getUsers(),
        complaintsApi.listComplaints()
      ]);
      setMetrics(m);
      setAgentMetrics(am);
      setUsersList(u);
      setAllComplaints(c);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserActionLoading(true);
    setFeedback(null);
    try {
      await adminApi.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });
      setFeedback({ type: 'success', message: 'User created successfully.' });
      setShowCreateUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      const updatedUsers = await adminApi.getUsers();
      setUsersList(updatedUsers);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to create user.' });
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setFeedback(null);
    try {
      await adminApi.updateUserRole(userId, newRole);
      setFeedback({ type: 'success', message: `User role updated to ${newRole}. Recorded in audit log.` });
      const updatedUsers = await adminApi.getUsers();
      setUsersList(updatedUsers);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to change role.' });
    }
  };

  const handleStatusToggle = async (userId, currentActive) => {
    setFeedback(null);
    try {
      await adminApi.updateUserStatus(userId, !currentActive);
      setFeedback({ type: 'success', message: `User status updated to ${!currentActive ? 'Active' : 'Deactivated'}.` });
      const updatedUsers = await adminApi.getUsers();
      setUsersList(updatedUsers);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to update user status.' });
    }
  };

  const op = metrics?.operational || {};
  const ai = metrics?.ai || {};
  const biz = metrics?.business || {};
  const sec = metrics?.security || {};
  const cost = metrics?.cost || {};

  // Filter complaints
  const filteredComplaints = allComplaints.filter(c => {
    if (complaintStatusFilter && c.status !== complaintStatusFilter) return false;
    if (complaintPriorityFilter && c.priority !== complaintPriorityFilter) return false;
    if (complaintCategoryFilter && c.category !== complaintCategoryFilter) return false;
    if (complaintSearch.trim()) {
      const q = complaintSearch.toLowerCase();
      const matchId = String(c.id || '').toLowerCase().includes(q);
      const matchCust = String(c.customer_name || c.customer_id || '').toLowerCase().includes(q);
      const matchTitle = String(c.title || c.description || '').toLowerCase().includes(q);
      return matchId || matchCust || matchTitle;
    }
    return true;
  });

  return (
    <div className="dashboard-content">
      {/* Enterprise Executive Banner */}
      <div className="welcome-banner admin-theme">
        <div className="welcome-text-box">
          <h2>Enterprise AI Governance & Administration</h2>
          <p>
            System-wide observability, Role-Based Access Control, multi-agent telemetry, and audit compliance logging.
          </p>
        </div>
        <div className="banner-quick-actions">
          <Link to="/admin/audit-logs" className="btn-secondary">
            <History size={16} /> Audit Trail
          </Link>
          <Link to="/admin/agent-metrics" className="btn-primary">
            <Bot size={16} /> Agent Monitoring
          </Link>
        </div>
      </div>

      {feedback && (
        <div className={`alert-box mb-4 ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs per Requirements 14, 15, 16 */}
      <div className="admin-nav-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <Activity size={16} />
          System Overview & Metrics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          <Users size={16} />
          User Management ({usersList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('complaints')}
          className={`admin-tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
        >
          <FileText size={16} />
          Complaint Management ({allComplaints.length})
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: SYSTEM OVERVIEW & METRICS                                    */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div>
          {/* System Overview KPI Cards per Requirement 14 */}
          <div className="section-block">
            <div className="section-header-row">
              <div className="section-title">
                <Layers size={18} className="text-primary" />
                <h3>System Overview</h3>
              </div>
            </div>

            <div className="kpi-grid kpi-grid-4">
              <div className="kpi-card">
                <span className="kpi-title">Total Users</span>
                <div className="kpi-value font-mono">{op.total_users ?? usersList.length}</div>
                <span className="kpi-sub">Customers, Support & Admins</span>
              </div>

              <div className="kpi-card">
                <span className="kpi-title">Total Complaints</span>
                <div className="kpi-value font-mono">{op.total_complaints ?? 0}</div>
                <span className="kpi-sub">Total inbound customer disputes</span>
              </div>

              <div className="kpi-card">
                <span className="kpi-title">Open Complaints</span>
                <div className="kpi-value text-warning font-mono">{op.open_complaints ?? 0}</div>
                <span className="kpi-sub">Active in agentic workflow</span>
              </div>

              <div className="kpi-card">
                <span className="kpi-title">Resolved Complaints</span>
                <div className="kpi-value text-success font-mono">{op.resolved_complaints ?? 0}</div>
                <span className="kpi-sub">Automated & human-approved</span>
              </div>

              <div className="kpi-card">
                <span className="kpi-title">Escalated Complaints</span>
                <div className="kpi-value text-danger font-mono">{op.escalated_complaints ?? 0}</div>
                <span className="kpi-sub">Routed to senior specialists</span>
              </div>

              <div className="kpi-card highlight-warning">
                <span className="kpi-title">Pending Approvals</span>
                <div className="kpi-value text-warning font-mono">{op.pending_approvals ?? 0}</div>
                <span className="kpi-sub">Held in HITL governance queue</span>
              </div>
            </div>
          </div>

          {/* AI Metrics & Business Metrics Split Grid per Requirement 14 */}
          <div className="analytics-split-grid mt-6">
            {/* AI Metrics */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-title">
                  <Cpu size={18} className="text-primary" />
                  <h4>AI Metrics</h4>
                </div>
                <span className="badge-live-tag">Agentic Telemetry</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Agent Executions</span>
                <span className="metric-val font-semibold">{ai.agent_execution_count ?? 0}</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Successful Executions</span>
                <span className="metric-val text-success font-semibold">{ai.successful_executions ?? ai.agent_execution_count ?? 0}</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Failed Executions</span>
                <span className="metric-val text-danger font-semibold">{ai.failed_executions ?? 0}</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Average Agent Latency</span>
                <span className="metric-val font-semibold font-mono">{ai.avg_response_time_ms ?? 0} ms</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Tool Calls</span>
                <span className="metric-val font-semibold">{ai.total_tool_calls ?? 0}</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">RAG Retrievals</span>
                <span className="metric-val font-semibold">{ai.rag_retrievals ?? 0}</span>
              </div>
            </div>

            {/* Business Metrics */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-title">
                  <TrendingUp size={18} className="text-success" />
                  <h4>Business Metrics</h4>
                </div>
                <span className="badge-live-tag">Enterprise Outcomes</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Automatic Resolution Rate</span>
                <span className="metric-val text-success font-semibold">{biz.auto_resolution_rate ?? 0}%</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Human Escalation Rate</span>
                <span className="metric-val font-semibold">{biz.escalation_rate ?? 0}%</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Refunds Dispatched</span>
                <span className="metric-val font-semibold">{biz.refund_count ?? 0}</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Replacements Dispatched</span>
                <span className="metric-val font-semibold">{biz.replacement_count ?? 0}</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Average Resolution Time</span>
                <span className="metric-val font-semibold">{biz.avg_resolution_time_min ?? 2.4} min</span>
              </div>

              <div className="analytics-metric-row">
                <span className="metric-label">Estimated AI Infrastructure Cost</span>
                <span className="metric-val font-mono font-semibold text-primary">
                  ${(cost.estimated_cost_usd || 0).toFixed(4)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Security & Guardrails Cockpit */}
          <div className="security-cockpit-card mt-6">
            <div className="security-cockpit-header">
              <div className="security-title">
                <ShieldCheck size={20} className="text-success" />
                <h4>Security & Guardrails Assurance</h4>
              </div>
              <span className="badge-shield">Zero-Trust Agent Governance</span>
            </div>

            <div className="security-stats-grid">
              <div className="security-stat">
                <span className="sec-label">Prompt Injection Intercepts</span>
                <span className="sec-val font-mono">{sec.prompt_injection_attempts ?? 0}</span>
                <span className="sec-status text-success">Protected</span>
              </div>

              <div className="security-stat">
                <span className="sec-label">Unauthorized Access Intercepts</span>
                <span className="sec-val font-mono">{sec.unauthorized_requests ?? 0}</span>
                <span className="sec-status text-success">RBAC Enforced</span>
              </div>

              <div className="security-stat">
                <span className="sec-label">Blocked Tool Calls</span>
                <span className="sec-val font-mono">{sec.blocked_tool_calls ?? 0}</span>
                <span className="sec-status text-success">Whitelisted</span>
              </div>

              <div className="security-stat">
                <span className="sec-label">Sensitive Actions Held</span>
                <span className="sec-val font-mono">{sec.sensitive_actions_requiring_approval ?? 0}</span>
                <span className="sec-status text-warning">HITL Protected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: USER MANAGEMENT (Requirement 15)                             */}
      {/* ==================================================================== */}
      {activeTab === 'users' && (
        <div className="table-card">
          <div className="table-header">
            <div className="table-title">
              <Users size={18} className="text-primary" />
              <h3>Platform User Directory</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateUserModal(true)}
              className="btn-primary"
            >
              <UserPlus size={16} />
              + Create User
            </button>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="font-mono text-primary font-bold">{u.id}</td>
                    <td className="font-medium">{u.name}</td>
                    <td className="font-mono text-xs">{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="role-selector-dropdown"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-pill status-${u.is_active ? 'resolved' : 'failed'}`}>
                        {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-muted">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-button-group">
                        {u.role === 'CUSTOMER' && (
                          <button
                            type="button"
                            onClick={() => handleRoleChange(u.id, 'SUPPORT_AGENT')}
                            className="btn-action-small btn-promote"
                            title="Promote Customer to Support Agent"
                          >
                            Promote to Support
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(u.id, u.is_active)}
                          className={`btn-action-small ${u.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateUserModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <UserPlus size={18} className="text-primary" />
                <h3>Create User</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="btn-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="modal-body auth-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="form-input"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="modal-footer mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userActionLoading}
                  className="btn-primary"
                >
                  {userActionLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: COMPLAINT MANAGEMENT (Requirement 16)                        */}
      {/* ==================================================================== */}
      {activeTab === 'complaints' && (
        <div className="table-card">
          <div className="table-header">
            <div className="table-title">
              <FileText size={18} className="text-primary" />
              <h3>All Enterprise Complaints</h3>
            </div>
            <div className="search-input-box">
              <Search size={16} className="text-muted" />
              <input
                type="text"
                placeholder="Search ID, customer, title..."
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                className="form-input search-input"
              />
            </div>
          </div>

          {/* Filter Row per Requirement 16 */}
          <div className="table-filter-bar">
            <div className="filter-select-box">
              <Filter size={16} className="text-muted" />
              <select
                value={complaintStatusFilter}
                onChange={(e) => setComplaintStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="CLASSIFYING">CLASSIFYING</option>
                <option value="FETCHING_ORDER">FETCHING_ORDER</option>
                <option value="ANALYZING">ANALYZING</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="ESCALATED">ESCALATED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div className="filter-select-box">
              <select
                value={complaintPriorityFilter}
                onChange={(e) => setComplaintPriorityFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Priorities</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="filter-select-box">
              <select
                value={complaintCategoryFilter}
                onChange={(e) => setComplaintCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                <option value="REFUND">REFUND</option>
                <option value="REPLACEMENT">REPLACEMENT</option>
                <option value="DAMAGED_PRODUCT">DAMAGED_PRODUCT</option>
                <option value="ORDER_STATUS">ORDER_STATUS</option>
                <option value="PRODUCT_ISSUE">PRODUCT_ISSUE</option>
                <option value="GENERAL_SUPPORT">GENERAL_SUPPORT</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Customer</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-primary font-bold">{c.id}</td>
                    <td>
                      <div>
                        <span className="font-medium text-sm">{c.customer_name || 'Customer'}</span>
                        <span className="text-xs text-muted font-mono block">{c.customer_id}</span>
                      </div>
                    </td>
                    <td className="font-medium max-w-xs truncate">{c.title}</td>
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
                    <td>
                      <Link
                        to={`/support/complaints/${c.id}`}
                        className="btn-table-action"
                      >
                        Inspect AI Trace
                        <ArrowRight size={14} />
                      </Link>
                    </td>
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
