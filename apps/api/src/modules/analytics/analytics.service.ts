import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  async getOverview(workspaceId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [current, dailyData, platformBreakdown] = await Promise.all([
      this.repository.getAggregatedMetrics(workspaceId, start, end),
      this.repository.getDailyMetrics(workspaceId, start, end),
      this.repository.getPlatformBreakdown(workspaceId, start, end),
    ]);

    const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
    const previous = await this.repository.getAggregatedMetrics(workspaceId, previousStart, start);

    return {
      current,
      previous,
      changes: {
        reach: this.calcChange(current.totalReach, previous.totalReach),
        impressions: this.calcChange(current.totalImpressions, previous.totalImpressions),
        engagements: this.calcChange(current.totalEngagements, previous.totalEngagements),
      },
      dailyData,
      platformBreakdown,
    };
  }

  async getPlatformAnalytics(workspaceId: string, platform: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.repository.getPlatformMetrics(workspaceId, platform, start, end);
  }

  async getTopPosts(workspaceId: string, startDate: string, endDate: string, limit: number, sortBy: string) {
    return this.repository.getTopPerformingPosts(
      workspaceId,
      new Date(startDate),
      new Date(endDate),
      limit,
      sortBy,
    );
  }

  async getBestTimes(workspaceId: string, platform?: string) {
    return this.repository.getBestPostingTimes(workspaceId, platform);
  }

  async getHashtagAnalytics(workspaceId: string, startDate: string, endDate: string) {
    return this.repository.getHashtagPerformance(
      workspaceId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  async getDailyAnalytics(workspaceId: string, startDate: string, endDate: string, platform?: string) {
    return this.repository.getDailyMetrics(
      workspaceId,
      new Date(startDate),
      new Date(endDate),
      platform,
    );
  }

  async getEngagementRateTrends(workspaceId: string, startDate: string, endDate: string) {
    const daily = await this.repository.getDailyMetrics(
      workspaceId,
      new Date(startDate),
      new Date(endDate),
    );

    return daily.map((day: any) => ({
      date: day.date,
      engagementRate: day.impressions > 0
        ? ((day.engagements / day.impressions) * 100).toFixed(2)
        : 0,
    }));
  }

  private calcChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }
}
