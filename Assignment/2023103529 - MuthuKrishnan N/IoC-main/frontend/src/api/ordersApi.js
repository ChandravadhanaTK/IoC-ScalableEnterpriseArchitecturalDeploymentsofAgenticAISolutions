import api from './axiosClient';

export const ordersApi = {
  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  listMyOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  }
};
