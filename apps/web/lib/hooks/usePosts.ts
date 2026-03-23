'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

interface PostFilters {
  status?: string;
  platform?: string;
  projectId?: string;
  campaignId?: string;
  page?: number;
  per_page?: number;
}

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: PostFilters & { workspaceId: string | null }) =>
    [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  feed: (workspaceId: string) => [...postKeys.all, 'feed', workspaceId] as const,
  calendar: (workspaceId: string, start: string, end: string) =>
    [...postKeys.all, 'calendar', workspaceId, start, end] as const,
  versions: (id: string) => [...postKeys.all, 'versions', id] as const,
  analytics: (id: string) => [...postKeys.all, 'analytics', id] as const,
};

export function usePosts(filters: PostFilters = {}) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: postKeys.list({ ...filters, workspaceId }),
    queryFn: () =>
      apiClient.get('/posts', { params: { workspaceId, ...filters } }),
    enabled: !!workspaceId,
  });
}

export function usePostFeed() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: postKeys.feed(workspaceId!),
    queryFn: () =>
      apiClient.get('/posts/feed', { params: { workspaceId } }),
    enabled: !!workspaceId,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => apiClient.get(`/posts/${id}`),
    enabled: !!id,
  });
}

export function usePostCalendar(startDate: string, endDate: string) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: postKeys.calendar(workspaceId!, startDate, endDate),
    queryFn: () =>
      apiClient.get('/posts/calendar', {
        params: { workspaceId, startDate, endDate },
      }),
    enabled: !!workspaceId && !!startDate && !!endDate,
  });
}

export function usePostVersions(id: string) {
  return useQuery({
    queryKey: postKeys.versions(id),
    queryFn: () => apiClient.get(`/posts/${id}/versions`),
    enabled: !!id,
  });
}

export function usePostAnalytics(id: string) {
  return useQuery({
    queryKey: postKeys.analytics(id),
    queryFn: () => apiClient.get(`/posts/${id}/analytics`),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post('/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'calendar'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiClient.put(`/posts/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'calendar'] });
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/posts/${id}/publish`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useSchedulePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      apiClient.post(`/posts/${id}/schedule`, { scheduledAt }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['posts', 'calendar'] });
    },
  });
}

export function useDuplicatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/posts/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useBulkSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      apiClient.post('/posts/bulk/schedule', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['posts', 'calendar'] });
    },
  });
}

export function useBulkDeletePosts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiClient.post('/posts/bulk/delete', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
    },
  });
}
