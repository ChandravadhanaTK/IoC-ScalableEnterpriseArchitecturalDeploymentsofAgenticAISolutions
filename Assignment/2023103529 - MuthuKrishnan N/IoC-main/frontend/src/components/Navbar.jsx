import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-role badge-admin';
      case 'SUPPORT_AGENT': return 'badge-role badge-support';
      default: return 'badge-role badge-customer';
    }
  };

  const getHomeRoute = () => {
    if (!user) return '/login';
    if (user.role === 'CUSTOMER') return '/customer/dashboard';
    if (user.role === 'SUPPORT_AGENT') return '/support/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/login';
  };

  return (
    <header className="enterprise-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to={getHomeRoute()} className="brand-link">
            <div className="brand-icon-box">
              <Shield className="brand-shield" size={22} />
              <Sparkles className="brand-sparkle" size={12} />
            </div>
            <div className="brand-text">
              <span className="brand-title">Enterprise AI</span>
              <span className="brand-subtitle">Customer Complaint Resolution Platform</span>
            </div>
          </Link>
        </div>

        {isAuthenticated && user ? (
          <div className="navbar-actions">
            <div className="user-profile-menu">
              <div className="user-avatar">
                <User size={16} />
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-logout"
                title="Log out securely"
              >
                <LogOut size={16} />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-auth-links">
            <Link to="/login" className="btn-nav-login">Sign In</Link>
            <Link to="/register" className="btn-nav-register">Create Account</Link>
          </div>
        )}
      </div>
    </header>
  );
};
