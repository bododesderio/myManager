import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

const campaignKeys = {
  all: ['campaigns'] as const,
  list: (workspaceId?: string | null) => ['campaigns', 'list', workspaceId] as const,
  detail: (id: string) => ['campaigns', 'detail', id] as const,
};

export function useCampaigns(workspaceId?: string | null) {
  return useQuery({
    queryKey: campaignKeys.list(workspaceId),
    queryFn: async () => {
      const data = await apiClient.get<{ campaigns?: Campaign[] } | Campaign[]>('/campaigns', {
        params: workspaceId ? { workspaceId } : undefined,
      });
      return (data as any).campaigns ?? (data as any) ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: async () => apiClient.get<Campaign>(`/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      workspaceId: string;
      name: string;
      description?: string;
      startDate?: string;
      endDate?: string;
    }) => apiClient.post<Campaign>('/campaigns', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/campaigns/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  });
}
