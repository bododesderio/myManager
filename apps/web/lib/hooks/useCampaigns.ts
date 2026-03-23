'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (workspaceId: string) => [...campaignKeys.all, 'list', workspaceId] as const,
  detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
};

export function useCampaigns() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: campaignKeys.list(workspaceId!),
    queryFn: () => apiClient.get('/campaigns', { params: { workspaceId } }),
    enabled: !!workspaceId,
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => apiClient.get(`/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/campaigns', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: campaignKeys.all }); },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiClient.put(`/campaigns/${id}`, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(v.id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/campaigns/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: campaignKeys.all }); },
  });
}
