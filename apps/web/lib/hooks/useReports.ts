'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const reportKeys = {
  all: ['reports'] as const,
  list: (workspaceId: string) => [...reportKeys.all, 'list', workspaceId] as const,
  detail: (id: string) => [...reportKeys.all, 'detail', id] as const,
};

export function useReports() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: reportKeys.list(workspaceId!),
    queryFn: () => apiClient.get('/reports', { params: { workspaceId } }),
    enabled: !!workspaceId,
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => apiClient.get(`/reports/${id}`),
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/reports', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: reportKeys.all }); },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/reports/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: reportKeys.all }); },
  });
}
