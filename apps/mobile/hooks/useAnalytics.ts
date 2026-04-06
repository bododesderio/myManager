import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export interface AnalyticsOverview {
  reach?: number;
  impressions?: number;
  engagements?: number;
  engagementRate?: number;
  followers?: number;
  posts?: number;
  topPosts?: Array<{
    id: string;
    caption?: string;
    platform: string;
    impressions?: number;
    engagements?: number;
  }>;
  platformBreakdown?: Array<{
    platform: string;
    reach?: number;
    impressions?: number;
    engagements?: number;
  }>;
}

function periodToDates(period: '7d' | '30d' | '90d') {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function useAnalytics(workspaceId: string | null | undefined, period: '7d' | '30d' | '90d' = '30d') {
  const { startDate, endDate } = periodToDates(period);
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview', workspaceId, period],
    queryFn: async () => {
      return apiClient.get<AnalyticsOverview>('/analytics/overview', {
        params: { workspaceId: workspaceId!, startDate, endDate },
      });
    },
    enabled: !!workspaceId,
  });
}

export function useTopPosts(workspaceId: string | null | undefined, period: '7d' | '30d' | '90d' = '30d') {
  const { startDate, endDate } = periodToDates(period);
  return useQuery({
    queryKey: ['analytics', 'top-posts', workspaceId, period],
    queryFn: async () => {
      return apiClient.get('/analytics/posts/top', {
        params: { workspaceId: workspaceId!, startDate, endDate },
      });
    },
    enabled: !!workspaceId,
  });
}

export function useBestTimes(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ['analytics', 'best-times', workspaceId],
    queryFn: async () => {
      return apiClient.get('/analytics/best-times', { params: { workspaceId: workspaceId! } });
    },
    enabled: !!workspaceId,
  });
}
