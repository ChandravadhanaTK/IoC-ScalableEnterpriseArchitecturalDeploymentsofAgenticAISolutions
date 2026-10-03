import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'CUSTOMER') {
      navigate('/customer/dashboard');
    } else if (user.role === 'SUPPORT_AGENT') {
      navigate('/support/dashboard');
    } else if (user.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="unauthorized-page-container">
      <div className="unauthorized-card">
        <div className="unauthorized-icon-box">
          <ShieldAlert size={48} className="text-danger" />
        </div>
        <h1 className="unauthorized-title">Access Denied</h1>
        <p className="unauthorized-message">
          You do not have permission to access this section.
        </p>
        <div className="unauthorized-role-info">
          <span>Your Current Role:</span>
          <strong className="badge-role font-mono">{user?.role || 'UNAUTHENTICATED'}</strong>
        </div>
        <p className="unauthorized-sub">
          Enterprise Role-Based Access Control (RBAC) restricts this resource to authorized personnel only.
        </p>

        <button
          type="button"
          onClick={handleReturnToDashboard}
          className="btn-primary btn-lg mt-6"
        >
          <Home size={18} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
