import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { getSharedRedis } from '../../common/redis/shared-redis';

const redis = getSharedRedis();

@Injectable()
export class BrandRepository {
  constructor(private readonly prisma: PrismaService) {}
  async getPlatformBrandConfig() {
    const cached = await redis.get('brand:platform');
    if (cached) return JSON.parse(cached);

    const config = await this.prisma.brandConfig.findFirst();
    if (config) {
      await redis.setex('brand:platform', 3600, JSON.stringify(config.config));
    }
    return config?.config || {};
  }

  async updatePlatformBrandConfig(data: Record<string, any>) {
    const existing = await this.prisma.brandConfig.findFirst();
    if (existing) {
      return this.prisma.brandConfig.update({
        where: { id: existing.id },
        data: { config: data, updated_at: new Date() },
      });
    }
    return this.prisma.brandConfig.create({
      data: { config: data },
    });
  }

  async getWorkspaceBrandConfig(workspaceId: string) {
    const config = await this.prisma.workspaceBrandConfig.findUnique({ where: { workspace_id: workspaceId } });
    return config?.config || null;
  }

  async upsertWorkspaceBrandConfig(workspaceId: string, data: Record<string, any>) {
    return this.prisma.workspaceBrandConfig.upsert({
      where: { workspace_id: workspaceId },
      update: { config: data, updated_at: new Date() },
      create: { workspace_id: workspaceId, config: data },
    });
  }

  async getProjectBrandConfig(projectId: string) {
    const config = await this.prisma.projectBrandConfig.findUnique({ where: { project_id: projectId } });
    return config?.config || null;
  }

  async upsertProjectBrandConfig(projectId: string, data: Record<string, any>) {
    return this.prisma.projectBrandConfig.upsert({
      where: { project_id: projectId },
      update: { config: data, updated_at: new Date() },
      create: { project_id: projectId, config: data },
    });
  }

  async invalidateBrandCache() {
    await redis.del('brand:platform');
  }
}
