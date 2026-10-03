import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import {
  History,
  Search,
  Filter,
  Bot,
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Code,
  X
} from 'lucide-react';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs(100, agentFilter || null);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [agentFilter]);

  const filteredLogs = logs.filter(log => {
    if (statusFilter && log.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="dashboard-content">
      <div className="page-header-row">
        <div>
          <h2>Enterprise Audit & Compliance Log</h2>
          <p className="page-header-sub">
            Immutable trace of every state machine transition, agent decision, tool execution, and human approval.
          </p>
        </div>
      </div>

      <div className="table-card">
        {/* Filter bar */}
        <div className="table-filter-bar">
          <div className="filter-select-box">
            <Filter size={16} className="text-muted" />
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Agents & System</option>
              <option value="SupervisorAgent">SupervisorAgent</option>
              <option value="IntentAgent">IntentAgent</option>
              <option value="OrderAgent">OrderAgent</option>
              <option value="PolicyAgent">PolicyAgent</option>
              <option value="ResolutionAgent">ResolutionAgent</option>
              <option value="ActionAgent">ActionAgent</option>
            </select>
          </div>

          <div className="filter-select-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <Bot size={28} className="animate-spin text-primary" />
            <p>Querying enterprise audit store...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <History size={36} className="text-muted" />
            <p>No audit records match the selected filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Agent</th>
                  <th>User / Role</th>
                  <th>Complaint</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} onClick={() => setSelectedLog(log)} className="clickable-row">
                    <td className="font-mono text-xs text-muted">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="font-semibold text-primary font-mono">{log.action}</td>
                    <td>
                      <span className="badge-agent-tag font-mono">{log.agent || 'SYSTEM'}</span>
                    </td>
                    <td>
                      <span className="text-xs">{log.user_id || 'System'} ({log.role || 'CORE'})</span>
                    </td>
                    <td className="font-mono text-xs">{log.complaint_id || '—'}</td>
                    <td>
                      <span className={`status-pill status-${(log.status || 'success').toLowerCase()}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="max-w-xs truncate text-xs text-muted">
                      {typeof log.result === 'string' ? log.result : JSON.stringify(log.result)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raw Event Inspection Modal */}
      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Code size={18} className="text-primary" />
                <h3>Audit Event Record: {selectedLog.action}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-meta-grid">
                <div><strong>Log ID:</strong> <span className="font-mono">{selectedLog.id}</span></div>
                <div><strong>Agent:</strong> {selectedLog.agent || 'System'}</div>
                <div><strong>User:</strong> {selectedLog.user_id}</div>
                <div><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toISOString()}</div>
              </div>

              <div className="modal-json-box">
                <span className="json-label">Complete Event Payload:</span>
                <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
