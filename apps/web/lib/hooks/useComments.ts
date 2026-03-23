'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const commentKeys = {
  all: ['comments'] as const,
  list: (workspaceId: string, filters?: Record<string, unknown>) =>
    [...commentKeys.all, 'list', workspaceId, filters] as const,
};

export function useComments(filters: { platform?: string; status?: string; page?: number } = {}) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: commentKeys.list(workspaceId!, filters),
    queryFn: () => apiClient.get('/comments', { params: { workspaceId, ...filters } }),
    enabled: !!workspaceId,
  });
}

export function useReplyToComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      apiClient.post(`/comments/${commentId}/reply`, { text }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: commentKeys.all }); },
  });
}

export function useAssignComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, userId }: { commentId: string; userId: string }) =>
      apiClient.post(`/comments/${commentId}/assign`, { userId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: commentKeys.all }); },
  });
}
