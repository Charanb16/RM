import apiClient from './client';

export const authApi = {
  login: async (payload) => {
    const response = await apiClient.post('/api/auth/login/', payload);
    return response.data;
  },

  register: async (payload) => {
    const response = await apiClient.post('/api/auth/register/', payload);
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/api/auth/me/');
    return response.data;
  },

  logout: async (refreshToken) => {
    try {
      const response = await apiClient.post('/api/auth/logout/', {
        refresh: refreshToken,
      });
      return response.data;
    } catch {
      return { success: true };
    }
  },
};
