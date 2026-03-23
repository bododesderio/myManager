'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const mediaKeys = {
  all: ['media'] as const,
  list: (workspaceId: string, filters?: Record<string, unknown>) =>
    [...mediaKeys.all, 'list', workspaceId, filters] as const,
};

export function useMedia(filters: { type?: string; page?: number; per_page?: number; search?: string } = {}) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: mediaKeys.list(workspaceId!, filters),
    queryFn: () => apiClient.get('/media', { params: { workspaceId, ...filters } }),
    enabled: !!workspaceId,
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId!);
      return apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}
