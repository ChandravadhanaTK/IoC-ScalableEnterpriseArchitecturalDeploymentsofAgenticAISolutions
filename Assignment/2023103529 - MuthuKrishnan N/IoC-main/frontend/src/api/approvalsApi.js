import api from './axiosClient';

export const approvalsApi = {
  listApprovals: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/approvals', { params });
    return response.data;
  },

  getApproval: async (id) => {
    const response = await api.get(`/approvals/${id}`);
    return response.data;
  },

  approve: async (id, notes = '') => {
    const response = await api.post(`/approvals/${id}/approve`, { notes });
    return response.data;
  },

  reject: async (id, reason = '') => {
    const response = await api.post(`/approvals/${id}/reject`, { notes: reason, reason });
    return response.data;
  }
};

