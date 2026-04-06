import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export interface AnalyticsMetrics {
  totalReach: number;
  reachChange: number;
  engagement: number;
  engagementChange: number;
  followers: number;
  followersChange: number;
  posts: number;
  postsChange: number;
  topPosts: Array<{
    id: string;
    content: string;
    platform: string;
    reach: number;
    engagement: number;
  }>;
  platformBreakdown: Array<{
    platform: string;
    reach: number;
    engagement: number;
    followers: number;
  }>;
  bestTimes: Array<{
    day: string;
    hour: number;
    score: number;
  }>;
}

export function useAnalytics(workspaceId: string, period: string = '30d') {
  return useQuery<AnalyticsMetrics>({
    queryKey: ['analytics', workspaceId, period],
    queryFn: async () => {
      const response = await apiClient.get<AnalyticsMetrics>(
        `/v1/analytics?workspace_id=${workspaceId}&period=${period}`
      );
      return response;
    },
    enabled: !!workspaceId,
  });
}

export function useAnalyticsByPlatform(workspaceId: string, platform: string) {
  return useQuery({
    queryKey: ['analytics', workspaceId, platform],
    queryFn: async () => {
      const response = await apiClient.get(
        `/v1/analytics/${platform}?workspace_id=${workspaceId}`
      );
      return response;
    },
    enabled: !!workspaceId && !!platform,
  });
}
