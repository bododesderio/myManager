import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useWorkspaceStore } from '@/store/workspaceStore';

export interface Post {
  id: string;
  caption: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string;
  published_at?: string;
  media?: Array<{ id: string; url?: string }>;
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
}

export interface CreatePostInput {
  /** Plain text body — translated to API field `caption`. */
  content: string;
  platforms: string[];
  /** Uploaded media asset IDs (from useUploadMedia). API expects them as `mediaIds`. */
  mediaUrls: string[];
  status?: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;
}

function toApiPayload(workspaceId: string, input: CreatePostInput) {
  return {
    workspaceId,
    caption: input.content,
    platforms: input.platforms,
    contentType: input.mediaUrls.length > 0 ? 'media' : 'text',
    mediaIds: input.mediaUrls,
    ...(input.scheduledAt && { scheduledAt: input.scheduledAt }),
  };
}

export function usePosts(status?: Post['status']) {
  return useQuery<Post[]>({
    queryKey: ['posts', status],
    queryFn: async () => {
      const response = await apiClient.get<Post[] | { posts?: Post[] }>('/posts', {
        params: status ? { status } : undefined,
      });
      return ((response as any).posts ?? response) as Post[];
    },
  });
}

export function usePost(id: string) {
  return useQuery<Post>({
    queryKey: ['posts', id],
    queryFn: async () => apiClient.get<Post>(`/posts/${id}`),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);

  return useMutation({
    mutationFn: async (data: CreatePostInput) => {
      if (!workspace?.id) throw new Error('No workspace selected');
      return apiClient.post<Post>('/posts', toApiPayload(workspace.id, data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useSchedulePost() {
  const queryClient = useQueryClient();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);

  return useMutation({
    mutationFn: async (data: CreatePostInput & { scheduledAt: string }) => {
      if (!workspace?.id) throw new Error('No workspace selected');
      return apiClient.post<Post>('/posts', {
        ...toApiPayload(workspace.id, data),
        scheduledAt: data.scheduledAt,
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

export function useDuplicatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.post<Post>(`/posts/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
