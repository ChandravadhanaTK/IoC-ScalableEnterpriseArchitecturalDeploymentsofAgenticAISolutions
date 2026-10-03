import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  CheckSquare,
  Activity,
  History,
  Bot,
  Users,
  Inbox
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside className="enterprise-sidebar">
      <div className="sidebar-section-title">
        {user.role === 'CUSTOMER' && 'Customer Portal'}
        {user.role === 'SUPPORT_AGENT' && 'Support Workspace'}
        {user.role === 'ADMIN' && 'Enterprise Governance'}
      </div>

      <nav className="sidebar-nav">
        {user.role === 'CUSTOMER' && (
          <>
            <NavLink
              to="/customer/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Customer Dashboard</span>
            </NavLink>

            <NavLink
              to="/customer/complaints"
              end
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <FileText size={18} />
              <span>My Complaints</span>
            </NavLink>

            <NavLink
              to="/customer/complaints/new"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <PlusCircle size={18} />
              <span>New Complaint</span>
            </NavLink>
          </>
        )}

        {user.role === 'SUPPORT_AGENT' && (
          <>
            <NavLink
              to="/support/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Support Dashboard</span>
            </NavLink>

            <NavLink
              to="/support/approvals"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <CheckSquare size={18} />
              <span>Pending Approvals</span>
            </NavLink>
          </>
        )}

        {user.role === 'ADMIN' && (
          <>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Activity size={18} />
              <span>Admin Dashboard</span>
            </NavLink>

            <NavLink
              to="/support/approvals"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <CheckSquare size={18} />
              <span>Pending Approvals</span>
            </NavLink>

            <NavLink
              to="/admin/agent-metrics"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Bot size={18} />
              <span>Agent Monitoring</span>
            </NavLink>

            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <History size={18} />
              <span>Audit Logs</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-dot-pulse"></span>
          <span className="status-text">Multi-Agent Engine Active</span>
        </div>
      </div>
    </aside>
  );
};
