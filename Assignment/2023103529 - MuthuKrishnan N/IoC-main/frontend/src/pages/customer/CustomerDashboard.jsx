import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintsApi } from '../../api/complaintsApi';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Bot,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const data = await complaintsApi.listComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const stats = {
    total: complaints.length,
    inProgress: complaints.filter(c => !['RESOLVED', 'REJECTED', 'CLOSED'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'RESOLVED').length,
  };

  const recentComplaints = complaints.slice(0, 5);

  const handleLaunchScenario = (scenarioKey) => {
    navigate(`/customer/complaints/new?scenario=${scenarioKey}`);
  };

  return (
    <div className="dashboard-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text-box">
          <h2>Welcome back, {user?.name || 'Customer'}</h2>
          <p>
            Enterprise AI Customer Care automatically analyzes issues, checks company policies, inspects order data, and executes resolutions in real-time.
          </p>
        </div>
        <Link to="/customer/complaints/new" className="btn-primary">
          <PlusCircle size={18} />
          File New Complaint
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Submissions</span>
            <FileText size={18} className="text-primary" />
          </div>
          <div className="kpi-value">{stats.total}</div>
          <div className="kpi-sub">Lifetime customer requests</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active In-Progress</span>
            <Clock size={18} className="text-warning" />
          </div>
          <div className="kpi-value text-warning">{stats.inProgress}</div>
          <div className="kpi-sub">Under agentic evaluation or review</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Successfully Resolved</span>
            <CheckCircle size={18} className="text-success" />
          </div>
          <div className="kpi-value text-success">{stats.resolved}</div>
          <div className="kpi-sub">Automated actions & approved solutions</div>
        </div>
      </div>

      {/* Evaluation Test Scenarios Launcher */}
      <div className="scenario-launcher-card">
        <div className="scenario-header">
          <div className="scenario-title">
            <Sparkles size={18} className="text-accent" />
            <h3>Academic Capstone Demo Scenarios (1-Click Test)</h3>
          </div>
          <span className="scenario-badge">Instant Evaluation</span>
        </div>
        <p className="scenario-desc">
          Select a predefined scenario to preload the complaint form and test supervisor agent orchestration, policy RAG, and approval gates:
        </p>

        <div className="scenario-cards-grid">
          <div className="scenario-card" onClick={() => handleLaunchScenario('DAMAGED_REPLACEMENT')}>
            <div className="scenario-tag tag-auto">Automatic Resolution</div>
            <h4>1. Damaged Item Replacement</h4>
            <p>Product arrived broken within 7 days. Autonomous RAG verifies policy & dispatches replacement.</p>
            <div className="scenario-order-badge">ORD-1001 (₹2,499)</div>
          </div>

          <div className="scenario-card" onClick={() => handleLaunchScenario('HIGH_VALUE_REFUND')}>
            <div className="scenario-tag tag-hitl">Human-in-the-Loop</div>
            <h4>2. High-Value Refund Gate</h4>
            <p>Refund request exceeds ₹5,000 threshold. Supervisor halts auto-execution and routes to HITL approval queue.</p>
            <div className="scenario-order-badge">ORD-1002 (₹25,000)</div>
          </div>

          <div className="scenario-card" onClick={() => handleLaunchScenario('ORDER_TRACKING')}>
            <div className="scenario-tag tag-info">Live Tool Lookup</div>
            <h4>3. Order Tracking In-Transit</h4>
            <p>Customer asks where their delivery is. OrderAgent queries database and provides real-time shipment status.</p>
            <div className="scenario-order-badge">ORD-1005 (In Transit)</div>
          </div>

          <div className="scenario-card" onClick={() => handleLaunchScenario('MISSING_ORDER_ID')}>
            <div className="scenario-tag tag-feedback">Missing Information</div>
            <h4>4. Missing Order Details</h4>
            <p>Customer submits request without Order ID. IntentAgent detects missing parameter and prompts clarification.</p>
            <div className="scenario-order-badge">No Order ID</div>
          </div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title">
            <FileText size={18} className="text-primary" />
            <h3>Recent Complaints</h3>
          </div>
          <Link to="/customer/complaints" className="table-link">
            View All ({complaints.length})
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <Bot size={24} className="animate-spin text-primary" />
            <p>Loading complaints...</p>
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="empty-state">
            <FileText size={36} className="text-muted" />
            <p>No complaints submitted yet.</p>
            <Link to="/customer/complaints/new" className="btn-secondary">
              File First Complaint
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-primary font-semibold">{c.id}</td>
                    <td className="font-medium">{c.title}</td>
                    <td>
                      <span className="badge-category">{c.category || 'PENDING'}</span>
                    </td>
                    <td className="font-mono">{c.order_id || '—'}</td>
                    <td>
                      <span className={`status-pill status-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link
                        to={`/customer/complaints/${c.id}`}
                        className="btn-table-action"
                        title="View AI Resolution Details"
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
        )}
      </div>
    </div>
  );
};
