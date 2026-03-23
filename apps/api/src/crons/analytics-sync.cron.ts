import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

@Injectable()
export class AnalyticsSyncCron {
  constructor(@InjectQueue('analytics-sync') private analyticsQueue: Queue, private readonly prisma: PrismaService) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async syncAllPostAnalytics() {
    await withDistributedLock('analytics-sync', 5 * 60 * 60 * 1000, async () => {
      const recentPosts = await this.prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          published_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        include: { platform_results: { where: { status: 'PUBLISHED' } } },
      });

      for (const post of recentPosts) {
        for (const result of post.platform_results) {
          if (!result.platform_post_id) continue;
          const account = await this.prisma.socialAccount.findFirst({
            where: { workspace_id: post.workspace_id, platform: { slug: result.platform }, is_active: true },
          });
          if (!account) continue;

          await this.analyticsQueue.add('sync', {
            postId: post.id,
            platform: result.platform,
            socialAccountId: account.id,
            platformPostId: result.platform_post_id,
          }, { attempts: 3, backoff: { type: 'fixed', delay: 900000 } });
        }
      }
    });
  }
}
