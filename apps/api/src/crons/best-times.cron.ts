import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

@Injectable()
export class BestTimesCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * 0') // 3:00 AM every Sunday
  async calculateBestPostingTimes() {
    await withDistributedLock('best-times', 6 * 60 * 60 * 1000, async () => {
      const workspaces = await this.prisma.workspace.findMany({ select: { id: true } });

      for (const workspace of workspaces) {
        const posts = await this.prisma.post.findMany({
          where: {
            workspace_id: workspace.id,
            status: 'PUBLISHED',
            published_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          },
          include: { analytics: true },
        });

        // Bucket by platform → day_of_week (0-6) → hour (0-23)
        const buckets: Record<string, Record<number, Record<number, { total: number; count: number }>>> = {};

        for (const post of posts) {
          if (!post.published_at) continue;
          const hour = post.published_at.getUTCHours();
          const dayOfWeek = post.published_at.getUTCDay();

          for (const platform of post.platforms) {
            buckets[platform] ??= {};
            buckets[platform][dayOfWeek] ??= {};
            buckets[platform][dayOfWeek][hour] ??= { total: 0, count: 0 };

            const analytics = post.analytics.find((a) => a.platform === platform);
            if (analytics) {
              const engagement =
                (analytics.likes + analytics.comments + analytics.shares + analytics.saves) /
                Math.max(analytics.impressions || 1, 1);
              buckets[platform][dayOfWeek][hour].total += engagement;
              buckets[platform][dayOfWeek][hour].count += 1;
            }
          }
        }

        for (const [platform, byDay] of Object.entries(buckets)) {
          for (const [dayStr, byHour] of Object.entries(byDay)) {
            const day_of_week = parseInt(dayStr);
            for (const [hourStr, data] of Object.entries(byHour)) {
              const hour = parseInt(hourStr);
              const avgRate = data.count > 0 ? data.total / data.count : 0;
              await this.prisma.bestTime.upsert({
                where: {
                  workspace_id_platform_day_of_week_hour: {
                    workspace_id: workspace.id,
                    platform,
                    day_of_week,
                    hour,
                  },
                },
                update: { score: avgRate, sample_size: data.count },
                create: {
                  workspace_id: workspace.id,
                  platform,
                  hour,
                  day_of_week,
                  score: avgRate,
                  sample_size: data.count,
                },
              });
            }
          }
        }
      }
    });
  }
}
