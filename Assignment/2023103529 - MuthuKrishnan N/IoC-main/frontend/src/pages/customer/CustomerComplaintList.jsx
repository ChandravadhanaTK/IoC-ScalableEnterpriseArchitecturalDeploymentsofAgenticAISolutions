import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../../api/complaintsApi';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const CustomerComplaintList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.order_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dashboard-content">
      <div className="page-header-row">
        <div>
          <h2>My Complaints & Inquiries</h2>
          <p className="page-header-sub">
            Track real-time agentic state transitions, policy references, and resolutions.
          </p>
        </div>
        <Link to="/customer/complaints/new" className="btn-primary">
          <PlusCircle size={18} />
          New Complaint
        </Link>
      </div>

      <div className="table-card">
        {/* Filters and Search Bar */}
        <div className="table-filter-bar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, Complaint ID, or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-select-box">
            <Filter size={16} className="text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="ANALYZING">Analyzing</option>
              <option value="AWAITING_APPROVAL">Awaiting Human Approval</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <Bot size={28} className="animate-spin text-primary" />
            <p>Loading your complaint history...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <FileText size={36} className="text-muted" />
            <p>No complaints match your query.</p>
            {searchTerm || statusFilter ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            ) : (
              <Link to="/customer/complaints/new" className="btn-secondary">
                File a Complaint
              </Link>
            )}
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
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-primary font-semibold">{c.id}</td>
                    <td className="font-medium max-w-xs truncate">{c.title}</td>
                    <td>
                      <span className="badge-category">{c.category || 'UNCATEGORIZED'}</span>
                    </td>
                    <td className="font-mono">{c.order_id || '—'}</td>
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
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link
                        to={`/customer/complaints/${c.id}`}
                        className="btn-table-action"
                      >
                        Details
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
