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
