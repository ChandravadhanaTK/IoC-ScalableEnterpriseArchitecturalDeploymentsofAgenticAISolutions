import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { Shield, Sparkles, User, Headphones, Lock, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

export const LoginPage = () => {
  const { login, loginAsDemo, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected portal context: 'CUSTOMER', 'SUPPORT_AGENT', 'ADMIN'
  const roleParam = searchParams.get('role')?.toUpperCase();
  const [selectedRole, setSelectedRole] = useState(
    roleParam === 'ADMIN' ? 'ADMIN' : roleParam === 'SUPPORT_AGENT' ? 'SUPPORT_AGENT' : 'CUSTOMER'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync selectedRole if URL query param changes
  useEffect(() => {
    if (roleParam === 'ADMIN' || roleParam === 'SUPPORT_AGENT' || roleParam === 'CUSTOMER') {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  const handlePortalSwitch = (role) => {
    setSelectedRole(role);
    setSearchParams({ role });
    setError('');
  };

  const redirectByRole = (role) => {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'SUPPORT_AGENT') navigate('/support/dashboard');
    else if (role === 'CUSTOMER') navigate('/customer/dashboard');
    else navigate('/');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);

      // Verify portal access authorization per Parts 11, 12, 13
      if (selectedRole === 'ADMIN' && user.role !== 'ADMIN') {
        logout();
        setError('This account does not have Administrator access.');
        return;
      }

      if (selectedRole === 'SUPPORT_AGENT' && user.role !== 'SUPPORT_AGENT' && user.role !== 'ADMIN') {
        logout();
        setError('This account does not have Support Agent access.');
        return;
      }

      // Validated session: navigate to appropriate dashboard
      redirectByRole(user.role);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (roleKey) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginAsDemo(roleKey);
      redirectByRole(user.role);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to authenticate with demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  const getPortalInfo = () => {
    switch (selectedRole) {
      case 'ADMIN':
        return {
          title: 'Admin Login',
          sub: 'Enterprise Administrator credentials required',
          icon: Shield,
          themeClass: 'admin-portal-active',
          demoLabel: 'Login as Demo Admin',
          demoKey: 'ADMIN'
        };
      case 'SUPPORT_AGENT':
        return {
          title: 'Support Agent Login',
          sub: 'Customer Support Specialist credentials required',
          icon: Headphones,
          themeClass: 'support-portal-active',
          demoLabel: 'Login as Demo Support Agent',
          demoKey: 'SUPPORT_AGENT'
        };
      default:
        return {
          title: 'Customer Login',
          sub: 'Customer account credentials required',
          icon: User,
          themeClass: 'customer-portal-active',
          demoLabel: 'Login as Demo Customer',
          demoKey: 'CUSTOMER'
        };
    }
  };

  const portal = getPortalInfo();
  const IconComponent = portal.icon;

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Navigation back to Portal selection */}
        <div className="auth-back-nav">
          <Link to="/" className="btn-back-link">
            <ArrowLeft size={14} />
            <span>All Portals</span>
          </Link>
        </div>

        {/* Portal Switching Tabs */}
        <div className="login-portal-tabs">
          <button
            type="button"
            className={`portal-tab ${selectedRole === 'CUSTOMER' ? 'active customer' : ''}`}
            onClick={() => handlePortalSwitch('CUSTOMER')}
          >
            <User size={14} />
            <span>Customer</span>
          </button>
          <button
            type="button"
            className={`portal-tab ${selectedRole === 'SUPPORT_AGENT' ? 'active support' : ''}`}
            onClick={() => handlePortalSwitch('SUPPORT_AGENT')}
          >
            <Headphones size={14} />
            <span>Support</span>
          </button>
          <button
            type="button"
            className={`portal-tab ${selectedRole === 'ADMIN' ? 'active admin' : ''}`}
            onClick={() => handlePortalSwitch('ADMIN')}
          >
            <Shield size={14} />
            <span>Admin</span>
          </button>
        </div>

        <div className="auth-header">
          <div className={`auth-brand-badge ${portal.themeClass}`}>
            <IconComponent size={26} className="text-primary" />
          </div>
          <h2>{portal.title}</h2>
          <p className="auth-sub">{portal.sub}</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              required
              placeholder={
                selectedRole === 'ADMIN'
                  ? 'admin@example.com'
                  : selectedRole === 'SUPPORT_AGENT'
                  ? 'support@example.com'
                  : 'customer@example.com'
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            disabled={loading}
            className="btn-primary btn-block"
          >
            {loading ? 'Authenticating...' : 'Login'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Explicit Academic Demo Login (Part 14) */}
        <div className="demo-credentials-card mt-6">
          <div className="demo-card-title">
            <Sparkles size={14} className="text-accent" />
            <span>Demo Authentication (Evaluation Helper)</span>
          </div>
          <div className="demo-buttons-single">
            <button
              type="button"
              id={`btn-demo-${portal.demoKey.toLowerCase()}`}
              onClick={() => handleDemoLogin(portal.demoKey)}
              disabled={loading}
              className={`btn-demo-quick ${portal.demoKey.toLowerCase()} w-full`}
            >
              <IconComponent size={15} />
              <div>
                <strong>{portal.demoLabel}</strong>
                <small>{DEMO_CREDENTIALS[portal.demoKey].email}</small>
              </div>
            </button>
          </div>
        </div>

        {selectedRole === 'CUSTOMER' && (
          <div className="auth-footer">
            <span>New customer? </span>
            <Link to="/register" className="auth-link">Create an account</Link>
          </div>
        )}
      </div>
    </div>
  );
};
