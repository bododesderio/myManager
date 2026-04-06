import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { getSharedRedis } from '../../common/redis/shared-redis';

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

  async findById(id: string) {
    return this.prisma.socialAccount.findUnique({ where: { id } });
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

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.socialAccount.update({ where: { id }, data });
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

  async findAllPlatforms() {
    return this.prisma.platform.findMany({
      orderBy: { id: 'asc' },
      include: { platform_content_types: { include: { content_type: true } } },
    });
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
