'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export const userKeys = {
  profile: ['user', 'profile'] as const,
  preferences: ['user', 'preferences'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile,
    queryFn: async () => {
      const [profile, preferences] = await Promise.all([
        apiClient.get('/users/profile'),
        apiClient.get('/users/preferences'),
      ]);
      return { ...profile, timezone: preferences?.timezone };
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; avatar_url?: string; timezone?: string }) => {
      const { timezone, ...profileData } = data;
      const updates: Promise<unknown>[] = [apiClient.put('/users/profile', profileData)];
      if (timezone) {
        updates.push(apiClient.put('/users/preferences', { timezone }));
      }
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile });
      queryClient.invalidateQueries({ queryKey: userKeys.preferences });
    },
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: userKeys.preferences,
    queryFn: () => apiClient.get('/users/preferences'),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { language?: string; currency?: string; timezone?: string; theme?: string }) =>
      apiClient.put('/users/preferences', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: userKeys.preferences }); },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      apiClient.put('/users/change-password', data),
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/auth/2fa/enable'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.preferences });
      queryClient.invalidateQueries({ queryKey: userKeys.profile });
    },
  });
}

export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string }) => apiClient.post('/auth/2fa/verify', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.preferences });
      queryClient.invalidateQueries({ queryKey: userKeys.profile });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string }) => apiClient.post('/auth/2fa/disable', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.preferences });
      queryClient.invalidateQueries({ queryKey: userKeys.profile });
    },
  });
}
