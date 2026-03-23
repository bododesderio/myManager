'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const bioKeys = {
  all: ['bio-pages'] as const,
  list: (workspaceId: string) => [...bioKeys.all, 'list', workspaceId] as const,
  detail: (id: string) => [...bioKeys.all, 'detail', id] as const,
  analytics: (id: string) => [...bioKeys.all, 'analytics', id] as const,
};

export function useBioPages() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: bioKeys.list(workspaceId!),
    queryFn: () => apiClient.get('/bio-pages', { params: { workspaceId } }),
    enabled: !!workspaceId,
  });
}

export function useBioPage(id: string) {
  return useQuery({
    queryKey: bioKeys.detail(id),
    queryFn: () => apiClient.get(`/bio-pages/${id}`),
    enabled: !!id,
  });
}

export function useBioPageAnalytics(id: string) {
  return useQuery({
    queryKey: bioKeys.analytics(id),
    queryFn: () => apiClient.get(`/bio-pages/${id}/analytics`),
    enabled: !!id,
  });
}

export function useCreateBioPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/bio-pages', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: bioKeys.all }); },
  });
}

export function useUpdateBioPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiClient.put(`/bio-pages/${id}`, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: bioKeys.detail(v.id) });
      queryClient.invalidateQueries({ queryKey: bioKeys.all });
    },
  });
}
