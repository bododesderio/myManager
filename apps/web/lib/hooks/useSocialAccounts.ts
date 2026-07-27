'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const socialAccountKeys = {
  all: ['social-accounts'] as const,
  list: (workspaceId: string) => [...socialAccountKeys.all, 'list', workspaceId] as const,
};

export function useSocialAccounts() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: socialAccountKeys.list(workspaceId!),
    queryFn: () => apiClient.get('/social-accounts', { params: { workspaceId } }),
    enabled: !!workspaceId,
  });
}

export function useDisconnectSocialAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/social-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialAccountKeys.all });
    },
  });
}

/**
 * Set a connected account's premium override.
 * `premium: null` clears the override and defers to auto-detection.
 */
export function useSetAccountPremium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, premium }: { id: string; premium: boolean | null }) =>
      apiClient.put(`/social-accounts/${id}/premium`, { premium }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialAccountKeys.all });
    },
  });
}
