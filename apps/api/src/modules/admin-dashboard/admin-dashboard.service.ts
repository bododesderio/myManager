import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma.service';
import { PLATFORM_QUEUES } from '@mymanager/constants';

const PUBLISHING_QUEUE_NAMES = Object.values(PLATFORM_QUEUES);

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getApiHealth() {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    // Database check
    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'healthy', latencyMs: Date.now() - dbStart };
    } catch (error: unknown) {
      checks.database = { status: 'unhealthy', latencyMs: Date.now() - dbStart, error: error instanceof Error ? error.message : String(error) };
    }

    // Redis check
    const redisStart = Date.now();
    try {
      const Redis = (await import('ioredis')).default;
      const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
      const redis = new Redis(redisUrl);
      await redis.ping();
      checks.redis = { status: 'healthy', latencyMs: Date.now() - redisStart };
      await redis.quit();
    } catch (error: unknown) {
      checks.redis = { status: 'unhealthy', latencyMs: Date.now() - redisStart, error: error instanceof Error ? error.message : String(error) };
    }

    const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  async getQueueStats() {
    const redisOpts = this.getRedisOpts();
    const stats: Record<string, unknown> = {};

    for (const queueName of PUBLISHING_QUEUE_NAMES) {
      try {
        const queue = new Queue(queueName, { connection: redisOpts });
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ]);
        stats[queueName] = { waiting, active, completed, failed, delayed };
        await queue.close();
      } catch (error: unknown) {
        stats[queueName] = { error: error instanceof Error ? error.message : String(error) };
      }
    }

    // Also check email queue
    try {
      const emailQueue = new Queue('email-delivery', { connection: redisOpts });
      const [waiting, active, completed, failed] = await Promise.all([
        emailQueue.getWaitingCount(),
        emailQueue.getActiveCount(),
        emailQueue.getCompletedCount(),
        emailQueue.getFailedCount(),
      ]);
      stats['email-delivery'] = { waiting, active, completed, failed };
      await emailQueue.close();
    } catch (error: unknown) {
      stats['email-delivery'] = { error: error instanceof Error ? error.message : String(error) };
    }

    return { queues: stats, timestamp: new Date().toISOString() };
  }

  async retryJob(jobId: string) {
    const redisOpts = this.getRedisOpts();

    // Try each queue to find the job
    for (const queueName of [...PUBLISHING_QUEUE_NAMES, 'email-delivery']) {
      try {
        const queue = new Queue(queueName, { connection: redisOpts });
        const job = await queue.getJob(jobId);
        if (job) {
          await job.retry();
          await queue.close();
          return { message: 'Job retried successfully', jobId, queue: queueName };
        }
        await queue.close();
      } catch {
        // Continue checking other queues
      }
    }

    // Also check DLQ queues
    for (const queueName of PUBLISHING_QUEUE_NAMES) {
      try {
        const dlqQueue = new Queue(`${queueName}-dlq`, { connection: redisOpts });
        const job = await dlqQueue.getJob(jobId);
        if (job) {
          // Re-enqueue to the original queue
          const originalQueue = new Queue(queueName, { connection: redisOpts });
          await originalQueue.add(job.name, job.data, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
          await originalQueue.close();
          await dlqQueue.close();
          return { message: 'DLQ job re-enqueued', jobId, queue: queueName };
        }
        await dlqQueue.close();
      } catch {
        // Continue
      }
    }

    throw new NotFoundException(`Job ${jobId} not found in any queue`);
  }

  async getPendingActions() {
    const [pendingApprovals, pendingClientApprovals, scheduledPosts, failedPosts] = await Promise.all([
      this.prisma.post.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.post.count({ where: { status: 'PENDING_CLIENT_APPROVAL' } }),
      this.prisma.post.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.post.count({ where: { status: 'FAILED' } }),
    ]);

    const [totalUsers, activeSubscriptions, recentSignups] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({
        where: { created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      posts: {
        pendingApprovals,
        pendingClientApprovals,
        scheduledPosts,
        failedPosts,
      },
      users: {
        totalUsers,
        activeSubscriptions,
        recentSignups,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private getRedisOpts(): { host: string; port: number; password?: string } {
    const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
      };
    } catch {
      return { host: 'localhost', port: 6379 };
    }
  }
}
