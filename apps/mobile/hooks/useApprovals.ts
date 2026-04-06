import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

const approvalKeys = {
  all: ['approvals'] as const,
  pending: (workspaceId?: string | null) => ['approvals', 'pending', workspaceId] as const,
};

export function usePendingApprovals(workspaceId?: string | null) {
  return useQuery({
    queryKey: approvalKeys.pending(workspaceId),
    queryFn: async () => {
      const data = await apiClient.get<any>('/approvals', {
        params: { workspaceId: workspaceId!, status: 'pending_approval' },
      });
      return data?.posts ?? data?.approvals ?? data ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useApprovePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, comment }: { postId: string; comment?: string }) =>
      apiClient.post(`/approvals/${postId}/approve`, { comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: approvalKeys.all }),
  });
}

export function useRejectPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, comment }: { postId: string; comment: string }) =>
      apiClient.post(`/approvals/${postId}/reject`, { comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: approvalKeys.all }),
  });
}

export function useRequestRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, comment }: { postId: string; comment: string }) =>
      apiClient.post(`/approvals/${postId}/request-revision`, { comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: approvalKeys.all }),
  });
}
