import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

@Injectable()
export class CompetitorSyncCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 4 * * *') // 4:00 AM daily
  async syncCompetitorMetrics() {
    await withDistributedLock('competitor-sync', 23 * 60 * 60 * 1000, async () => {
      const profiles = await this.prisma.competitorProfile.findMany();

      for (const profile of profiles) {
        const metrics = await this.fetchPublicMetrics(profile.platform, profile.username);

        await this.prisma.competitorSnapshot.create({
          data: {
            competitor_profile_id: profile.id,
            date: new Date(),
            follower_count: metrics.followers,
            post_count: metrics.postCount,
            avg_engagement_rate: metrics.avgEngagement,
            metadata: metrics,
          },
        });
      }
    });
  }

  private async fetchPublicMetrics(_platform: string, _username: string): Promise<Record<string, number>> {
    return { followers: 0, following: 0, postCount: 0, avgEngagement: 0 };
  }
}
