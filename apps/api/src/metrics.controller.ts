import { Controller, ForbiddenException, Get, Header, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './prisma.service';
import { getRequestMetrics } from './common/interceptors/metrics.interceptor';

@Controller()
export class MetricsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics(@Req() req: Request): Promise<string> {
    const expected = process.env.METRICS_TOKEN;
    if (!expected) {
      throw new ForbiddenException('Metrics endpoint disabled');
    }
    const provided = req.header('x-metrics-token');
    if (provided !== expected) {
      throw new ForbiddenException('Invalid metrics token');
    }
    const lines: string[] = [];

    // --- mymanager_http_requests_total (counter) ---
    lines.push('# HELP mymanager_http_requests_total Total HTTP requests handled');
    lines.push('# TYPE mymanager_http_requests_total counter');
    const requestMetrics = getRequestMetrics();
    for (const [key, value] of requestMetrics.entries()) {
      const [method, statusCode] = key.split(':');
      lines.push(
        `mymanager_http_requests_total{method="${method}",status="${statusCode}"} ${value}`,
      );
    }

    // --- mymanager_active_users (gauge) ---
    lines.push('# HELP mymanager_active_users Number of active (non-deleted) users');
    lines.push('# TYPE mymanager_active_users gauge');
    const activeUsers = await this.prisma.user.count();
    lines.push(`mymanager_active_users ${activeUsers}`);

    // --- mymanager_posts_total (counter by status) ---
    lines.push('# HELP mymanager_posts_total Total posts grouped by status');
    lines.push('# TYPE mymanager_posts_total counter');
    const postsByStatus = await this.prisma.post.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    for (const row of postsByStatus) {
      lines.push(
        `mymanager_posts_total{status="${row.status}"} ${row._count.id}`,
      );
    }

    // --- mymanager_publishing_queue_depth (gauge) ---
    lines.push('# HELP mymanager_publishing_queue_depth Jobs waiting in publishing queues');
    lines.push('# TYPE mymanager_publishing_queue_depth gauge');
    const queueNames = [
      'publishing-facebook',
      'publishing-instagram',
      'publishing-x',
      'publishing-linkedin',
      'publishing-tiktok',
      'publishing-google-business',
      'publishing-pinterest',
      'publishing-youtube',
      'publishing-whatsapp',
      'publishing-threads',
    ];
    // Count queued/publishing posts as a proxy for queue depth
    // without importing BullMQ directly (no new deps)
    const queuedPosts = await this.prisma.post.count({
      where: { status: { in: ['QUEUED', 'PUBLISHING'] } },
    });
    for (const name of queueNames) {
      // Individual queue depths are not available without injecting each queue.
      // We expose 0 per queue and an aggregate via a separate label.
      lines.push(`mymanager_publishing_queue_depth{queue="${name}"} 0`);
    }
    lines.push(
      `mymanager_publishing_queue_depth{queue="aggregate_from_db"} ${queuedPosts}`,
    );

    // --- mymanager_subscriptions_active (gauge) ---
    lines.push('# HELP mymanager_subscriptions_active Active subscriptions');
    lines.push('# TYPE mymanager_subscriptions_active gauge');
    const activeSubs = await this.prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });
    lines.push(`mymanager_subscriptions_active ${activeSubs}`);

    // --- mymanager_api_uptime_seconds (gauge) ---
    lines.push('# HELP mymanager_api_uptime_seconds API process uptime in seconds');
    lines.push('# TYPE mymanager_api_uptime_seconds gauge');
    lines.push(`mymanager_api_uptime_seconds ${Math.floor(process.uptime())}`);

    // --- mymanager_nodejs_heap_used_bytes (gauge) ---
    lines.push('# HELP mymanager_nodejs_heap_used_bytes Node.js heap used in bytes');
    lines.push('# TYPE mymanager_nodejs_heap_used_bytes gauge');
    lines.push(`mymanager_nodejs_heap_used_bytes ${process.memoryUsage().heapUsed}`);

    return lines.join('\n') + '\n';
  }
}
