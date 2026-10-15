import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

export const useAuth = () => {
  const { user, accessToken, isAuthenticated, setAuth, clearAuth, setUser } = useAuthStore();

  const login = async (payload) => {
    try {
      const data = await authApi.login(payload);
      setAuth(data.user, data.tokens);
      return data;
    } catch {
      // Portfolio mock login fallback: create realistic user session
      const role = payload.role || (payload.email.includes('provider') ? 'provider' : 'customer');
      const mockUser = {
        id: role === 'provider' ? 'usr-p1' : 'usr-1',
        email: payload.email,
        first_name: role === 'provider' ? 'Marcus' : 'Alex',
        last_name: role === 'provider' ? 'Vance' : 'Rivera',
        phone_number: '+1 (555) 782-9901',
        role: role,
        is_verified: true,
        created_at: new Date().toISOString(),
      };
      const mockTokens = {
        access: 'mock-jwt-access-token-' + Date.now(),
        refresh: 'mock-jwt-refresh-token-' + Date.now(),
      };
      setAuth(mockUser, mockTokens);
      return { user: mockUser, tokens: mockTokens };
    }
  };

  const register = async (payload) => {
    try {
      const data = await authApi.register(payload);
      setAuth(data.user, data.tokens);
      return data;
    } catch {
      const mockUser = {
        id: 'usr-' + Date.now(),
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone_number: payload.phone_number,
        role: payload.role,
        is_verified: true,
        created_at: new Date().toISOString(),
      };
      const mockTokens = {
        access: 'mock-jwt-access-token-' + Date.now(),
        refresh: 'mock-jwt-refresh-token-' + Date.now(),
      };
      setAuth(mockUser, mockTokens);
      return { user: mockUser, tokens: mockTokens };
    }
  };

  const logout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      clearAuth();
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated,
    isCustomer: user?.role === 'customer',
    isProvider: user?.role === 'provider',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    setUser,
  };
};

export default useAuth;
