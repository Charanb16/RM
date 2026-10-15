import { create } from 'zustand';

const STORAGE_KEY_AUTH = 'roadmate_auth_state';

const loadInitialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        user: parsed.user || null,
        accessToken: parsed.accessToken || null,
        refreshToken: parsed.refreshToken || null,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { user: null, accessToken: null, refreshToken: null };
};

const initial = loadInitialState();

export const useAuthStore = create((set) => ({
  user: initial.user,
  accessToken: initial.accessToken,
  refreshToken: initial.refreshToken,
  isAuthenticated: Boolean(initial.accessToken && initial.user),

  setAuth: (user, tokens) => {
    const newState = {
      user,
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      isAuthenticated: true,
    };
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({
        user,
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
      }));
    } catch {
      // storage unavailable
    }
    set(newState);
  },

  setTokens: (accessToken, refreshToken) => {
    set((state) => {
      const newRefreshToken = refreshToken ?? state.refreshToken;
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({
          user: state.user,
          accessToken,
          refreshToken: newRefreshToken,
        }));
      } catch {
        // storage unavailable
      }
      return {
        accessToken,
        refreshToken: newRefreshToken,
        isAuthenticated: Boolean(accessToken && state.user),
      };
    });
  },

  setUser: (user) => {
    set((state) => {
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({
          user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        }));
      } catch {
        // storage unavailable
      }
      return { user };
    });
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {
      // storage unavailable
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
