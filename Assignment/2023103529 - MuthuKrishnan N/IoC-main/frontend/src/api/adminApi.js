import api from './axiosClient';

export const adminApi = {
  getMetrics: async () => {
    const response = await api.get('/admin/metrics');
    return response.data;
  },

  getAgentMetrics: async () => {
    const response = await api.get('/admin/agent-metrics');
    return response.data;
  },

  getAuditLogs: async (limit = 100, agent = null, action = null) => {
    const params = { limit };
    if (agent) params.agent = agent;
    if (action) params.action = action;
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  updateUserStatus: async (userId, isActive) => {
    const response = await api.patch(`/admin/users/${userId}/status`, { is_active: isActive });
    return response.data;
  }
};
