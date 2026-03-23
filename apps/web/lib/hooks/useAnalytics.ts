'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (workspaceId: string, start: string, end: string) =>
    [...analyticsKeys.all, 'overview', workspaceId, start, end] as const,
  platform: (workspaceId: string, platform: string, start: string, end: string) =>
    [...analyticsKeys.all, 'platform', workspaceId, platform, start, end] as const,
  topPosts: (workspaceId: string, start: string, end: string) =>
    [...analyticsKeys.all, 'top-posts', workspaceId, start, end] as const,
  bestTimes: (workspaceId: string) =>
    [...analyticsKeys.all, 'best-times', workspaceId] as const,
  hashtags: (workspaceId: string, start: string, end: string) =>
    [...analyticsKeys.all, 'hashtags', workspaceId, start, end] as const,
  daily: (workspaceId: string, start: string, end: string) =>
    [...analyticsKeys.all, 'daily', workspaceId, start, end] as const,
  engagementRate: (workspaceId: string, start: string, end: string) =>
    [...analyticsKeys.all, 'engagement-rate', workspaceId, start, end] as const,
};

export function useAnalyticsOverview(startDate: string, endDate: string) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: analyticsKeys.overview(workspaceId!, startDate, endDate),
    queryFn: () =>
      apiClient.get('/analytics/overview', {
        params: { workspaceId, startDate, endDate },
      }),
    enabled: !!workspaceId,
  });
}

export function usePlatformAnalytics(platform: string, startDate: string, endDate: string) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: analyticsKeys.platform(workspaceId!, platform, startDate, endDate),
    queryFn: () =>
      apiClient.get(`/analytics/platform/${platform}`, {
        params: { workspaceId, startDate, endDate },
      }),
    enabled: !!workspaceId && !!platform,
  });
}

export function useTopPosts(startDate: string, endDate: string, limit = 10) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: analyticsKeys.topPosts(workspaceId!, startDate, endDate),
    queryFn: () =>
      apiClient.get('/analytics/posts/top', {
        params: { workspaceId, startDate, endDate, limit },
      }),
    enabled: !!workspaceId,
  });
}

export function useBestTimes() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: analyticsKeys.bestTimes(workspaceId!),
    queryFn: () =>
      apiClient.get('/analytics/best-times', { params: { workspaceId } }),
    enabled: !!workspaceId,
  });
}

export function useHashtagAnalytics(startDate: string, endDate: string) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: analyticsKeys.hashtags(workspaceId!, startDate, endDate),
    queryFn: () =>
      apiClient.get('/analytics/hashtags', {
        params: { workspaceId, startDate, endDate },
      }),
    enabled: !!workspaceId,
  });
}

export function useDailyAnalytics(startDate: string, endDate: string) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: analyticsKeys.daily(workspaceId!, startDate, endDate),
    queryFn: () =>
      apiClient.get('/analytics/daily', {
        params: { workspaceId, startDate, endDate },
      }),
    enabled: !!workspaceId,
  });
}

export function useEngagementRate(startDate: string, endDate: string) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: analyticsKeys.engagementRate(workspaceId!, startDate, endDate),
    queryFn: () =>
      apiClient.get('/analytics/engagement-rate', {
        params: { workspaceId, startDate, endDate },
      }),
    enabled: !!workspaceId,
  });
}
