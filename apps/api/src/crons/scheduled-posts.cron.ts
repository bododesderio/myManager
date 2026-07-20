import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

/**
 * How long a post may sit in QUEUED before this cron treats it as stranded and
 * re-dispatches it. Must comfortably exceed the worst-case publish time across
 * all platforms so healthy in-flight posts are never re-queued.
 */
const STUCK_QUEUE_THRESHOLD_MS = 15 * 60 * 1000;

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

      // Posts stranded in QUEUED are re-dispatched. Previously a crash between
      // the status flip and the enqueue loop left a post QUEUED forever: the
      // query only matched SCHEDULED, so it was never retried and never surfaced
      // an error — the post silently never published.
      //
      // Re-dispatch is safe because BasePublishingWorker now short-circuits on
      // any platform already marked PUBLISHED.
      const stuckBefore = new Date(now.getTime() - STUCK_QUEUE_THRESHOLD_MS);

      const posts = await this.prisma.post.findMany({
        where: {
          scheduled_at: { lte: now },
          OR: [
            { status: 'SCHEDULED' },
            { status: 'QUEUED', updated_at: { lte: stuckBefore } },
          ],
        },
      });

      for (const post of posts) {
        // Claim atomically. updateMany's count tells us whether this run won the
        // row, so a concurrent or overlapping run cannot dispatch it twice.
        const claimed = await this.prisma.post.updateMany({
          where: {
            id: post.id,
            status: post.status, // still in the state we selected it in
          },
          data: { status: 'QUEUED' },
        });

        if (claimed.count === 0) {
          continue; // another run claimed it first
        }

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
