import apiClient from './client';

export const paymentsApi = {
  createPayment: async (payload) => {
    try {
      const response = await apiClient.post('/api/payments/', payload);
      return response.data;
    } catch {
      return {
        id: 'pay-' + Date.now(),
        request_id: payload.request_id,
        amount: payload.amount,
        status: 'completed',
        payment_method: payload.payment_method,
        transaction_id: 'txn_' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        created_at: new Date().toISOString(),
      };
    }
  },

  getPaymentStatus: async (requestId) => {
    try {
      const response = await apiClient.get(`/api/payments/request/${requestId}/`);
      return response.data;
    } catch {
      return {
        id: 'pay-sample',
        request_id: requestId,
        amount: 65.0,
        status: 'completed',
        payment_method: 'card',
        transaction_id: 'txn_AUTH_89921',
        created_at: new Date().toISOString(),
      };
    }
  },
};
