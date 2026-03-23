import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string, type: string | undefined, offset: number, limit: number): Promise<[unknown[], number]> {
    const where: Record<string, unknown> = { workspace_id: workspaceId };
    if (type) {
      where.mime_type = { startsWith: type };
    }

    const [assets, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    return [assets, total];
  }

  async findById(id: string) {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }

  async findByIds(ids: string[]) {
    return this.prisma.mediaAsset.findMany({ where: { id: { in: ids } } });
  }

  async create(data: {
    workspace_id: string;
    user_id: string;
    filename: string;
    mime_type: string;
    size_bytes: bigint;
    r2_key: string;
    url: string;
  }) {
    return this.prisma.mediaAsset.create({ data });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.mediaAsset.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.mediaAsset.delete({
      where: { id },
    });
  }

  async bulkDelete(ids: string[]) {
    return this.prisma.mediaAsset.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async getStorageUsedBytes(workspaceId: string): Promise<bigint> {
    const result = await this.prisma.mediaAsset.aggregate({
      where: { workspace_id: workspaceId },
      _sum: { size_bytes: true },
    });
    return result._sum.size_bytes || BigInt(0);
  }

  async getStorageLimitBytes(workspaceId: string): Promise<bigint> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
      },
    });

    const plan = workspace?.subscriptions?.[0]?.plan;
    const limits = plan?.limits as Record<string, any> | null;
    const storageGb = (limits?.storageGb ?? 0.5) as number;
    return BigInt(Math.floor(storageGb * 1024 * 1024 * 1024));
  }
}
