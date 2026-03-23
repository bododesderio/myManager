import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

@Injectable()
export class ScheduledPostsCron {
  private readonly queueMap: Map<string, Queue>;

  constructor(
    @InjectQueue('publishing-facebook') fb: Queue,
    @InjectQueue('publishing-instagram') ig: Queue,
    @InjectQueue('publishing-x') x: Queue,
    @InjectQueue('publishing-linkedin') li: Queue,
    @InjectQueue('publishing-tiktok') tt: Queue,
    @InjectQueue('publishing-google-business') gbp: Queue,
    @InjectQueue('publishing-pinterest') pin: Queue,
    @InjectQueue('publishing-youtube') yt: Queue,
    @InjectQueue('publishing-whatsapp') wa: Queue,
    @InjectQueue('publishing-threads') threads: Queue,
    private readonly prisma: PrismaService,
  ) {
    this.queueMap = new Map([['facebook', fb], ['instagram', ig], ['x', x], ['linkedin', li], ['tiktok', tt], ['google-business', gbp], ['pinterest', pin], ['youtube', yt], ['whatsapp', wa], ['threads', threads]]);
  }

  @Cron('* * * * *') // Every minute
  async dispatchScheduledPosts() {
    await withDistributedLock('scheduled-posts', 55 * 1000, async () => {
      const now = new Date();
      const posts = await this.prisma.post.findMany({
        where: { status: 'SCHEDULED', scheduled_at: { lte: now } },
      });

      for (const post of posts) {
        await this.prisma.post.update({ where: { id: post.id }, data: { status: 'QUEUED' } });

        for (const platform of post.platforms) {
          const account = await this.prisma.socialAccount.findFirst({
            where: { workspace_id: post.workspace_id, platform: { slug: platform }, is_active: true },
          });
          if (!account) {
            await this.prisma.postPlatformResult.upsert({
              where: { post_id_platform: { post_id: post.id, platform } },
              update: { status: 'FAILED', error_message: `No connected ${platform} account` },
              create: { post_id: post.id, platform, status: 'FAILED', error_message: `No connected ${platform} account` },
            });
            continue;
          }

          const queue = this.queueMap.get(platform);
          if (queue) {
            await queue.add('publish', { postId: post.id, platform, socialAccountId: account.id, userId: post.user_id }, { attempts: 5, backoff: { type: 'exponential', delay: 60000 } });
          }
        }
      }
    });
  }
}
