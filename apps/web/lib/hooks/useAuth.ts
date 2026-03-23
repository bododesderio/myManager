'use client';

import { useMutation } from '@tanstack/react-query';
import { signIn, signOut } from 'next-auth/react';
import { apiClient } from '@/lib/api/client';

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string; totp_code?: string; remember?: boolean }) => {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        totp_code: credentials.totp_code,
        remember: credentials.remember ? 'true' : 'false',
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    },
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      return apiClient.post('/auth/register', data);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      return apiClient.post('/auth/forgot-password', data);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      return apiClient.post('/auth/reset-password', data);
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (data: { token: string }) => {
      return apiClient.post('/auth/verify-email', data);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // Proceed with client-side signout even if API call fails
      }
      await signOut({ callbackUrl: '/login' });
    },
  });
}
