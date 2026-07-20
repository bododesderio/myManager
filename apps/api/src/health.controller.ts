import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './prisma.service';
import { getSharedRedis } from './common/redis/shared-redis';

/**
 * Liveness vs readiness (docs/audit-2026-07-20.md §M11).
 *
 * The previous single endpoint returned 200 without touching any dependency, so
 * an instance with a dead database still advertised itself as healthy and the
 * load balancer kept routing traffic to it.
 *
 *   /health/live   — "is the process up?"   Never touches dependencies.
 *                    Restart the container if this fails.
 *   /health/ready  — "can I serve traffic?" Checks DB + Redis.
 *                    Pull from the load balancer if this fails, but do NOT
 *                    restart — a database blip should not cause a restart storm.
 *
 * /health is retained as an alias of liveness for backwards compatibility with
 * the existing docker-compose healthcheck and CI smoke test.
 */
@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  health() {
    return this.live();
  }

  @Public()
  @Get('api/v1/health')
  healthVersioned() {
    return this.live();
  }

  @Public()
  @Get('health/live')
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }

  @Public()
  @Get('health/ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const checks = { database, redis };
    const ready = database.ok && redis.ok;

    // Status is set directly rather than by throwing: the global exception
    // filter scrubs 5xx bodies to "Internal server error", which would discard
    // exactly the per-dependency detail this endpoint exists to report.
    res.status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return {
      status: ready ? 'ready' : 'unavailable',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Readiness: database check failed — ${message}`);
      return { ok: false, error: message };
    }
  }

  private async checkRedis(): Promise<{ ok: boolean; error?: string }> {
    try {
      const pong = await getSharedRedis().ping();
      return pong === 'PONG'
        ? { ok: true }
        : { ok: false, error: `unexpected reply: ${String(pong)}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Readiness: redis check failed — ${message}`);
      return { ok: false, error: message };
    }
  }
}
