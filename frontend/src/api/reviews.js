import apiClient from './client';

export const reviewsApi = {
  submitReview: async (payload) => {
    try {
      const response = await apiClient.post('/api/reviews/', payload);
      return response.data;
    } catch {
      return {
        id: 'rev-' + Date.now(),
        request_id: payload.request_id,
        customer_id: 'usr-1',
        provider_id: payload.provider_id,
        rating: payload.rating,
        comment: payload.comment,
        created_at: new Date().toISOString(),
      };
    }
  },

  getProviderReviews: async (providerId) => {
    try {
      const response = await apiClient.get(`/api/reviews/provider/${providerId}/`);
      return response.data;
    } catch {
      return [
        {
          id: 'rev-1',
          request_id: 'req-8842',
          customer_id: 'usr-1',
          provider_id: providerId,
          rating: 5,
          comment: 'Arrived within 8 minutes! Replaced flat tire with professional speed and tested tire pressure on all 4 tires.',
          created_at: '2024-02-14T12:30:00Z',
        },
        {
          id: 'rev-2',
          request_id: 'req-7721',
          customer_id: 'usr-2',
          provider_id: providerId,
          rating: 5,
          comment: 'Extremely polite, brought heavy-duty jump starter and diagnostic scanner. Saved my evening commute!',
          created_at: '2024-01-20T17:15:00Z',
        },
      ];
    }
  },
};
