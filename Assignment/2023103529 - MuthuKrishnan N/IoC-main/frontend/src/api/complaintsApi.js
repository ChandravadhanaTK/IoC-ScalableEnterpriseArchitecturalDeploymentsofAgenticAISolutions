import api from './axiosClient';

export const complaintsApi = {
  listComplaints: async (params = {}) => {
    const response = await api.get('/complaints', { params });
    return response.data;
  },

  getComplaint: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  createComplaint: async (complaintData) => {
    const response = await api.post('/complaints', complaintData);
    return response.data;
  },

  processComplaint: async (id) => {
    const response = await api.post(`/complaints/${id}/process`);
    return response.data;
  },

  getTimeline: async (id) => {
    const response = await api.get(`/complaints/${id}/timeline`);
    return response.data;
  },

  // Support Agent Action Methods
  escalateComplaint: async (id, notes, priority = 'HIGH') => {
    const response = await api.post(`/complaints/${id}/escalate`, { notes, priority });
    return response.data;
  },

  resolveComplaint: async (id, resolutionText) => {
    const response = await api.post(`/complaints/${id}/resolve`, { resolution_text: resolutionText });
    return response.data;
  },

  requestInfo: async (id, notes) => {
    const response = await api.post(`/complaints/${id}/request-info`, { notes });
    return response.data;
  },

  createTicket: async (id, notes) => {
    const response = await api.post(`/complaints/${id}/ticket`, { notes });
    return response.data;
  }
};
