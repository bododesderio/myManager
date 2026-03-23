import { create } from 'zustand';
import { storage, storageKeys } from './storage';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  hydrate: () => void;
}

function persistAuth(user: AuthUser | null, token: string | null) {
  if (user && token) {
    storage.set(storageKeys.AUTH_TOKEN, token);
    storage.set(storageKeys.AUTH_USER, JSON.stringify(user));
  } else {
    storage.delete(storageKeys.AUTH_TOKEN);
    storage.delete(storageKeys.AUTH_USER);
  }
}

function loadPersistedAuth(): { user: AuthUser | null; token: string | null } {
  const token = storage.getString(storageKeys.AUTH_TOKEN) ?? null;
  const userJson = storage.getString(storageKeys.AUTH_USER);
  const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
  return { user, token };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token) => {
    persistAuth(user, token);
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: () => {
    persistAuth(null, null);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  updateUser: (updates) =>
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...updates } : null;
      if (updatedUser && state.token) {
        storage.set(storageKeys.AUTH_USER, JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    }),

  hydrate: () => {
    const { user, token } = loadPersistedAuth();
    set({
      user,
      token,
      isAuthenticated: !!(user && token),
      isLoading: false,
    });
  },
}));
