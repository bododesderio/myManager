import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { getSharedRedis } from '../../common/redis/shared-redis';

const PLATFORMS_CACHE_KEY = 'platforms:all';
/** 1 hour. Platform rows are seed data — nothing in the app mutates them. */
const PLATFORMS_CACHE_TTL = 3600;

@Injectable()
export class SocialAccountsRepository implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocialAccountsRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    getSharedRedis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
      this.logger,
    );
  }

  async onModuleDestroy() {}
  async findByWorkspace(workspaceId: string) {
    return this.prisma.socialAccount.findMany({
      where: { workspace_id: workspaceId, is_active: true },
      select: {
        id: true,
        platform: true,
        platform_username: true,
        display_name: true,
        avatar_url: true,
        is_active: true,
        token_expires_at: true,
        metadata: true,
        connected_at: true,
      },
      orderBy: { connected_at: 'asc' },
    });
  }

  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority.
  async findById(id: string, workspaceId: string) {
    return this.prisma.socialAccount.findFirst({
      where: { id, workspace_id: workspaceId },
    });
  }

  async upsert(data: {
    workspace_id: string;
    platform_id: string;
    platform_user_id: string;
    platform_username: string;
    display_name: string;
    avatar_url: string;
    access_token_encrypted: string;
    refresh_token_encrypted: string | null;
    token_expires_at: Date | null;
    is_active: boolean;
  }) {
    return this.prisma.socialAccount.upsert({
      where: {
        workspace_id_platform_id_platform_user_id: {
          workspace_id: data.workspace_id,
          platform_id: data.platform_id,
          platform_user_id: data.platform_user_id,
        },
      },
      update: {
        platform_username: data.platform_username,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        access_token_encrypted: data.access_token_encrypted,
        refresh_token_encrypted: data.refresh_token_encrypted,
        token_expires_at: data.token_expires_at,
        is_active: data.is_active,
        last_used_at: new Date(),
      },
      create: data,
    });
  }

  /** Returns null when the row does not exist *or* belongs to another workspace. */
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const result = await this.prisma.socialAccount.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(id, workspaceId);
  }

  async storeOAuthState(state: string, data: Record<string, unknown>) {
    await getSharedRedis().setex(`oauth:state:${state}`, 600, JSON.stringify(data));
  }

  async getOAuthState(state: string) {
    const data = await getSharedRedis().get(`oauth:state:${state}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteOAuthState(state: string) {
    await getSharedRedis().del(`oauth:state:${state}`);
  }

  /**
   * Platform catalogue with content types (docs/audit-2026-07-20.md §M7).
   *
   * A three-table nested read that is hit on every "which platforms can I post
   * to?" request, but whose rows are seed data — nothing in the codebase
   * creates, updates or upserts a Platform. A long TTL is safe; the only way
   * this changes is a deploy or a manual seed, both of which restart the process
   * or can be flushed by hand.
   */
  async findAllPlatforms() {
    const cached = await getSharedRedis().get(PLATFORMS_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const platforms = await this.prisma.platform.findMany({
      orderBy: { id: 'asc' },
      include: { platform_content_types: { include: { content_type: true } } },
    });

    await getSharedRedis().setex(
      PLATFORMS_CACHE_KEY,
      PLATFORMS_CACHE_TTL,
      JSON.stringify(platforms),
    );
    return platforms;
  }

  async findExpiringTokens(withinHours: number) {
    const threshold = new Date(Date.now() + withinHours * 60 * 60 * 1000);
    return this.prisma.socialAccount.findMany({
      where: {
        is_active: true,
        token_expires_at: { lte: threshold },
        refresh_token_encrypted: { not: null },
      },
    });
  }
}
