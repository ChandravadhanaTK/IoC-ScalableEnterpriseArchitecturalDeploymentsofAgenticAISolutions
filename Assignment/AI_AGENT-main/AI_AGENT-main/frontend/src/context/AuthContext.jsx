import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('collegeAgentToken'));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (activeToken = token) => {
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    } catch {
      localStorage.removeItem('collegeAgentToken');
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(token);
  }, [token]);

  const login = async (email, password, role) => {
    const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/login';
    const response = await api.post(endpoint, { email, password });

    const authToken = response.data.token;
    localStorage.setItem('collegeAgentToken', authToken);
    setToken(authToken);

    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('collegeAgentToken');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, login, logout, fetchProfile }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
