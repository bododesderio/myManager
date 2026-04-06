import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export interface Post {
  id: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  mediaUrls: string[];
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
}

export function usePosts(status?: Post['status']) {
  return useQuery<Post[]>({
    queryKey: ['posts', status],
    queryFn: async () => {
      const response = await apiClient.get<Post[]>('/posts', {
        params: status ? { status } : undefined,
      });
      return response;
    },
  });
}

export function usePost(id: string) {
  return useQuery<Post>({
    queryKey: ['posts', id],
    queryFn: async () => {
      const response = await apiClient.get<Post>(`/posts/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Post, 'id' | 'metrics'>) => {
      const response = await apiClient.post<Post>('/posts', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useSchedulePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      platforms: string[];
      scheduledAt: string;
      mediaUrls: string[];
    }) => {
      return apiClient.post<Post>('/posts', {
        ...data,
        status: 'scheduled',
        scheduled_at: data.scheduledAt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
