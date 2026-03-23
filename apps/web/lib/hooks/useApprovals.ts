'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const approvalKeys = {
  all: ['approvals'] as const,
  pending: (workspaceId: string) => [...approvalKeys.all, 'pending', workspaceId] as const,
};

export function usePendingApprovals() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: approvalKeys.pending(workspaceId!),
    queryFn: () => apiClient.get('/approvals', { params: { workspaceId, status: 'pending_approval' } }),
    enabled: !!workspaceId,
  });
}

export function useApprovePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, comment }: { postId: string; comment?: string }) =>
      apiClient.post(`/approvals/${postId}/approve`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useRejectPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, comment }: { postId: string; comment: string }) =>
      apiClient.post(`/approvals/${postId}/reject`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useRequestRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, comment }: { postId: string; comment: string }) =>
      apiClient.post(`/approvals/${postId}/request-revision`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
