import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer mm_')) {
      throw new UnauthorizedException('Valid API key required');
    }

    const rawKey = authHeader.replace('Bearer ', '');
    const prefix = rawKey.substring(0, 10);

    const rateLimitKey = `api_rate:${prefix}`;
    const current = await redis.incr(rateLimitKey);
    if (current === 1) {
      await redis.expire(rateLimitKey, 3600);
    }

    const candidates = await this.prisma.apiKey.findMany({
      where: { key_prefix: prefix, is_active: true },
      include: { workspace: true },
    });

    const rateLimitPerHour = 1000;

    for (const candidate of candidates) {
      const isValid = await bcrypt.compare(rawKey, candidate.key_hash);
      if (isValid) {
        if (current > rateLimitPerHour) {
          throw new UnauthorizedException('API rate limit exceeded');
        }

        await this.prisma.apiKey.update({
          where: { id: candidate.id },
          data: { last_used_at: new Date() },
        });

        request.apiKey = candidate;
        request.workspaceId = candidate.workspace_id;

        const remaining = Math.max(0, rateLimitPerHour - current);
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-RateLimit-Limit', rateLimitPerHour);
        response.setHeader('X-RateLimit-Remaining', remaining);
        response.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);

        return true;
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
