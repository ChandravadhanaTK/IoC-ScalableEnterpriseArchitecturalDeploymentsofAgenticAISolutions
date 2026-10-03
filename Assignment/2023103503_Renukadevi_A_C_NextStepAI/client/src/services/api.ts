import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nextstep_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nextstep_token');
      localStorage.removeItem('nextstep_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, role: string, admin_secret?: string) =>
    api.post('/auth/register', { name, email, password, role, admin_secret }),
  me: () => api.get('/auth/me'),
};

// ── Goals ─────────────────────────────────────────────────────
export const goalsApi = {
  list: () => api.get('/goals'),
  create: (data: { title: string; description?: string; category?: string }) =>
    api.post('/goals', data),
  get: (id: string) => api.get(`/goals/${id}`),
  delete: (id: string) => api.delete(`/goals/${id}`),
};

// ── Agent ─────────────────────────────────────────────────────
export const agentApi = {
  dashboard: () => api.get('/agent/dashboard'),
  action: (goalId: string, action: string, message?: string) =>
    api.post(`/agent/goals/${goalId}/action`, { action, message }),
  events: (goalId: string) => api.get(`/agent/goals/${goalId}/events`),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  users: () => api.get('/admin/users'),
  monitoring: () => api.get('/admin/monitoring'),
  auditLogs: () => api.get('/admin/audit-logs'),
  allGoals: (userId?: string) => api.get('/admin/goals', { params: { user_id: userId } }),
  toggleUser: (userId: string) => api.patch(`/admin/users/${userId}/toggle-active`),
};
