import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Headphones,
  User,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle,
  Activity,
  Bot,
  Layers,
  ChevronRight
} from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleRoleSelect = (role) => {
    // SECURITY CRITICAL: Role buttons MUST NEVER authenticate or bypass credentials.
    // They strictly navigate to the dedicated login portal.
    navigate(`/login?role=${role}`);
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'CUSTOMER') return '/customer/dashboard';
    if (user.role === 'SUPPORT_AGENT') return '/support/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/login';
  };

  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="home-hero-badge">
          <Sparkles size={16} className="text-accent" />
          <span>Enterprise AI Agentic Resolution Architecture</span>
        </div>
        <h1 className="home-hero-title">
          Autonomous Customer Complaint Resolution & Support Platform
        </h1>
        <p className="home-hero-subtitle">
          Next-generation multi-agent system featuring Supervisor Orchestration, Policy RAG,
          Human-in-the-Loop governance gates, and real-time operational telemetry.
        </p>

        {isAuthenticated && user && (
          <div className="home-session-banner card">
            <div className="session-banner-info">
              <CheckCircle size={20} className="text-success" />
              <div>
                <p className="session-user-greeting">
                  Signed in as <strong>{user.name}</strong> ({user.email})
                </p>
                <span className="badge-role badge-admin">{user.role}</span>
              </div>
            </div>
            <Link to={getDashboardPath()} className="btn-primary">
              <span>Go to Your Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* Role Selection Grid */}
      <section className="home-portals-section">
        <div className="section-heading-center">
          <h2>Select Login Portal</h2>
          <p>Choose your organizational role to access the authenticated workspace</p>
        </div>

        <div className="home-portals-grid">
          {/* 1. Customer Card */}
          <div className="portal-card customer-portal">
            <div className="portal-card-glow"></div>
            <div className="portal-card-header">
              <div className="portal-icon-wrapper customer-theme">
                <User size={28} />
              </div>
              <span className="portal-badge badge-customer">Client Access</span>
            </div>
            <h3 className="portal-title">Customer</h3>
            <p className="portal-description">
              Submit support inquiries, track complaint resolutions in real-time, view order context,
              and interact with autonomous resolution agents.
            </p>
            <ul className="portal-features-list">
              <li><CheckCircle size={14} className="text-success" /> File & track complaints</li>
              <li><CheckCircle size={14} className="text-success" /> Transparent agent timeline</li>
              <li><CheckCircle size={14} className="text-success" /> Automated refund & replacement</li>
            </ul>
            <div className="portal-card-actions">
              <button
                type="button"
                id="btn-portal-customer"
                onClick={() => handleRoleSelect('CUSTOMER')}
                className="btn-primary w-full"
              >
                <span>Customer Login</span>
                <ChevronRight size={16} />
              </button>
              <div className="portal-sub-action">
                <span>New customer? </span>
                <Link to="/register" className="link-sub">Create an account</Link>
              </div>
            </div>
          </div>

          {/* 2. Support Agent Card */}
          <div className="portal-card support-portal">
            <div className="portal-card-glow"></div>
            <div className="portal-card-header">
              <div className="portal-icon-wrapper support-theme">
                <Headphones size={28} />
              </div>
              <span className="portal-badge badge-support">Specialist Workspace</span>
            </div>
            <h3 className="portal-title">Support Agent</h3>
            <p className="portal-description">
              Inspect enterprise complaint queues, evaluate AI-synthesized policy citations,
              override autonomous recommendations, and authorize sensitive approvals.
            </p>
            <ul className="portal-features-list">
              <li><CheckCircle size={14} className="text-warning" /> Complaint triage & queue</li>
              <li><CheckCircle size={14} className="text-warning" /> Human-in-the-Loop approvals</li>
              <li><CheckCircle size={14} className="text-warning" /> Manual resolution overrides</li>
            </ul>
            <div className="portal-card-actions">
              <button
                type="button"
                id="btn-portal-support"
                onClick={() => handleRoleSelect('SUPPORT_AGENT')}
                className="btn-primary btn-warning-theme w-full"
              >
                <span>Support Agent Login</span>
                <ChevronRight size={16} />
              </button>
              <div className="portal-sub-action">
                <Lock size={12} className="text-muted inline mr-1" />
                <span>Authorized credentials required</span>
              </div>
            </div>
          </div>

          {/* 3. Admin Card */}
          <div className="portal-card admin-portal">
            <div className="portal-card-glow"></div>
            <div className="portal-card-header">
              <div className="portal-icon-wrapper admin-theme">
                <Shield size={28} />
              </div>
              <span className="portal-badge badge-admin">Governance & Oversight</span>
            </div>
            <h3 className="portal-title">Admin</h3>
            <p className="portal-description">
              Platform administration, operational KPI monitoring, individual agent telemetry,
              user provisioning (create Support & Admin accounts), and immutable audit logs.
            </p>
            <ul className="portal-features-list">
              <li><CheckCircle size={14} className="text-primary" /> Multi-agent monitoring & RAG metrics</li>
              <li><CheckCircle size={14} className="text-primary" /> Provision Support & Admin users</li>
              <li><CheckCircle size={14} className="text-primary" /> Immutable security audit trails</li>
            </ul>
            <div className="portal-card-actions">
              <button
                type="button"
                id="btn-portal-admin"
                onClick={() => handleRoleSelect('ADMIN')}
                className="btn-primary btn-admin-theme w-full"
              >
                <span>Admin Login</span>
                <ChevronRight size={16} />
              </button>
              <div className="portal-sub-action">
                <Lock size={12} className="text-muted inline mr-1" />
                <span>Enterprise administrative access only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="home-architecture-section card mt-12">
        <div className="architecture-grid">
          <div className="arch-item">
            <Bot size={24} className="text-primary mb-2" />
            <h4>Autonomous Multi-Agent Swarm</h4>
            <p>Supervisor, Intent, Order, Policy RAG, Resolution, and Action agents collaborating in real-time.</p>
          </div>
          <div className="arch-item">
            <Layers size={24} className="text-accent mb-2" />
            <h4>Enterprise Policy RAG</h4>
            <p>Vector embeddings over company terms, return policies, and high-value threshold constraints.</p>
          </div>
          <div className="arch-item">
            <Activity size={24} className="text-warning mb-2" />
            <h4>Human-in-the-Loop Gates</h4>
            <p>Sensitive transactions held for human supervisor authorization with immutable audit logging.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
