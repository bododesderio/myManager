'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const projectKeys = {
  all: ['projects'] as const,
  list: (workspaceId: string) => [...projectKeys.all, 'list', workspaceId] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  members: (id: string) => [...projectKeys.all, 'members', id] as const,
};

export function useProjects() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: projectKeys.list(workspaceId!),
    queryFn: () => apiClient.get('/projects', { params: { workspaceId } }),
    enabled: !!workspaceId,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => apiClient.get(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useProjectMembers(id: string) {
  return useQuery({
    queryKey: projectKeys.members(id),
    queryFn: () => apiClient.get(`/projects/${id}/members`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/projects', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: projectKeys.all }); },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiClient.put(`/projects/${id}`, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(v.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/projects/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: projectKeys.all }); },
  });
}
