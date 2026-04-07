import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  is_superadmin?: boolean;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

interface SignupResponse {
  user: AuthUser;
  accessToken: string;
}

function splitName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || 'User';
  return { firstName, lastName };
}

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } =
    useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const data = await apiClient.post<LoginResponse>('/auth/login', {
          email,
          password,
        });
        if (data.user.is_superadmin) {
          setLoading(false);
          throw new Error(
            'Superadmin accounts cannot sign in on mobile. Please use the web admin portal.',
          );
        }
        setAuth(data.user, data.accessToken);
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setAuth, setLoading]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Proceed with local logout even if server call fails
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true);
      try {
        const { firstName, lastName } = splitName(name);
        const data = await apiClient.post<SignupResponse>('/auth/register', {
          accountType: 'individual',
          firstName,
          lastName,
          email,
          password,
          country: 'Other',
          planSlug: 'free',
          billingCycle: 'monthly',
        });
        setAuth(data.user, data.accessToken);
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setAuth, setLoading]
  );

  const forgotPassword = useCallback(async (email: string) => {
    await apiClient.post('/auth/forgot-password', { email });
  }, []);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    signup,
    forgotPassword,
  };
}
