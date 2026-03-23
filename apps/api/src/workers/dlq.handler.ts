import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, QueueEvents } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { RealtimeGateway } from '../modules/realtime/realtime.gateway';
import { PLATFORM_QUEUES } from '@mymanager/constants';

const PUBLISHING_QUEUE_NAMES = Object.values(PLATFORM_QUEUES);

@Injectable()
export class DlqHandler implements OnModuleInit {
  private readonly logger = new Logger(DlqHandler.name);
  private readonly queueEventsMap: QueueEvents[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly configService: ConfigService,
    @InjectQueue('publishing-facebook-dlq') private facebookDlq: Queue,
    @InjectQueue('publishing-instagram-dlq') private instagramDlq: Queue,
    @InjectQueue('publishing-x-dlq') private xDlq: Queue,
    @InjectQueue('publishing-linkedin-dlq') private linkedinDlq: Queue,
    @InjectQueue('publishing-tiktok-dlq') private tiktokDlq: Queue,
    @InjectQueue('publishing-google-business-dlq') private gbpDlq: Queue,
    @InjectQueue('publishing-pinterest-dlq') private pinterestDlq: Queue,
    @InjectQueue('publishing-youtube-dlq') private youtubeDlq: Queue,
    @InjectQueue('publishing-whatsapp-dlq') private whatsappDlq: Queue,
    @InjectQueue('publishing-threads-dlq') private threadsDlq: Queue,
    @InjectQueue('email-delivery') private emailQueue: Queue,
  ) {}

  private getDlqQueue(queueName: string): Queue | undefined {
    const dlqMap: Record<string, Queue> = {
      'publishing-facebook': this.facebookDlq,
      'publishing-instagram': this.instagramDlq,
      'publishing-x': this.xDlq,
      'publishing-linkedin': this.linkedinDlq,
      'publishing-tiktok': this.tiktokDlq,
      'publishing-google-business': this.gbpDlq,
      'publishing-pinterest': this.pinterestDlq,
      'publishing-youtube': this.youtubeDlq,
      'publishing-whatsapp': this.whatsappDlq,
      'publishing-threads': this.threadsDlq,
    };
    return dlqMap[queueName];
  }

  async onModuleInit() {
    const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
    let redisOpts: { host: string; port: number; password?: string };

    try {
      const url = new URL(redisUrl);
      redisOpts = {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
      };
    } catch {
      redisOpts = { host: 'localhost', port: 6379 };
    }

    for (const queueName of PUBLISHING_QUEUE_NAMES) {
      const queueEvents = new QueueEvents(queueName, {
        connection: redisOpts,
      });

      queueEvents.on('failed', async ({ jobId, failedReason, prev: _prev }) => {
        await this.handleFailed(queueName, jobId, failedReason);
      });

      this.queueEventsMap.push(queueEvents);
      this.logger.log(`DLQ listener attached to queue: ${queueName}`);
    }
  }

  private async handleFailed(
    queueName: string,
    jobId: string,
    failedReason: string,
  ): Promise<void> {
    try {
      // Retrieve the original job to check attempts
      const dlqQueue = this.getDlqQueue(queueName);
      if (!dlqQueue) {
        this.logger.warn(`No DLQ queue found for ${queueName}`);
        return;
      }

      // We need to get the original queue to read the job
      const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
      let redisOpts: { host: string; port: number; password?: string };
      try {
        const url = new URL(redisUrl);
        redisOpts = {
          host: url.hostname,
          port: parseInt(url.port) || 6379,
          password: url.password || undefined,
        };
      } catch {
        redisOpts = { host: 'localhost', port: 6379 };
      }

      const sourceQueue = new Queue(queueName, { connection: redisOpts });
      const job = await sourceQueue.getJob(jobId);
      await sourceQueue.close();

      if (!job) {
        this.logger.warn(`Job ${jobId} not found in queue ${queueName}`);
        return;
      }

      const maxAttempts = job.opts?.attempts ?? 3;

      // Only handle final failure (all retries exhausted)
      if (job.attemptsMade < maxAttempts) {
        return;
      }

      this.logger.warn(
        `Job ${jobId} exhausted all ${maxAttempts} attempts on ${queueName}: ${failedReason}`,
      );

      const { postId, platform, userId } = job.data;

      // 1. Add to DLQ queue for record-keeping
      await dlqQueue.add('dead-letter', {
        originalJobId: jobId,
        originalQueue: queueName,
        postId,
        platform,
        userId,
        failedReason,
        attemptsMade: job.attemptsMade,
        failedAt: new Date().toISOString(),
        jobData: job.data,
      });

      // 2. Update post status to FAILED
      await this.prisma.postPlatformResult.updateMany({
        where: { post_id: postId, platform },
        data: {
          status: 'FAILED',
          error_message: `Publishing failed after ${maxAttempts} attempts: ${failedReason}`,
        },
      });

      // Check if all platform results are terminal and update post status
      const allResults = await this.prisma.postPlatformResult.findMany({
        where: { post_id: postId },
      });
      const allTerminal = allResults.every((r) =>
        ['PUBLISHED', 'FAILED'].includes(r.status),
      );
      if (allTerminal) {
        const allFailed = allResults.every((r) => r.status === 'FAILED');
        await this.prisma.post.update({
          where: { id: postId },
          data: {
            status: allFailed ? 'FAILED' : 'PARTIALLY_PUBLISHED',
          },
        });
      }

      // 3. Emit post:failed via WebSocket
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, workspace_id: true, caption: true },
      });

      if (post) {
        this.realtimeGateway.emitToWorkspace(post.workspace_id, 'post:failed', {
          postId,
          platform,
          reason: failedReason,
          attemptsMade: job.attemptsMade,
        });

        // 4. Send failure notification email to workspace Owner
        await this.sendFailureEmail(post.workspace_id, postId, platform, failedReason, post.caption);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error handling DLQ for job ${jobId} on ${queueName}: ${errMsg}`,
        errStack,
      );
    }
  }

  private async sendFailureEmail(
    workspaceId: string,
    postId: string,
    platform: string,
    failedReason: string,
    postCaption: string | null,
  ): Promise<void> {
    try {
      const owner = await this.prisma.workspaceMember.findFirst({
        where: { workspace_id: workspaceId, role: 'OWNER' },
        include: { user: true },
      });

      if (!owner?.user?.email) {
        this.logger.warn(`No owner email found for workspace ${workspaceId}`);
        return;
      }

      await this.emailQueue.add('send-email', {
        userId: owner.user_id,
        template: 'post-failed',
        data: {
          to: owner.user.email,
          name: owner.user.name || 'there',
          postId,
          platform,
          reason: failedReason,
          postCaption: postCaption || '(untitled post)',
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to queue failure email for post ${postId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
