import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const login = useCallback(async (email: string, _password: string) => {
    // TODO: implement API login call
    const mockUser: AuthUser = {
      id: '1',
      email,
      name: 'User',
    };
    setAuth(mockUser, 'mock-token');
  }, [setAuth]);

  const logout = useCallback(async () => {
    // TODO: implement API logout call
    clearAuth();
  }, [clearAuth]);

  const signup = useCallback(async (name: string, email: string, _password: string) => {
    // TODO: implement API signup call
    const mockUser: AuthUser = {
      id: '1',
      email,
      name,
    };
    setAuth(mockUser, 'mock-token');
  }, [setAuth]);

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    signup,
  };
}
