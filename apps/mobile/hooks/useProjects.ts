import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  workspace_id?: string;
}

const projectKeys = {
  all: ['projects'] as const,
  list: (workspaceId?: string | null) => ['projects', 'list', workspaceId] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export function useProjects(workspaceId?: string | null) {
  return useQuery({
    queryKey: projectKeys.list(workspaceId),
    queryFn: async () => {
      const data = await apiClient.get<{ projects?: Project[] } | Project[]>('/projects', {
        params: workspaceId ? { workspaceId } : undefined,
      });
      return (data as any).projects ?? (data as any) ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => apiClient.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { workspaceId: string; name: string; description?: string }) =>
      apiClient.post<Project>('/projects', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/projects/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
