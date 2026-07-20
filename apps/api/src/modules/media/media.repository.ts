import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

/** Upper bound on ids accepted in a single bulk media operation. */
const MAX_BULK_IDS = 500;

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

  // Tenancy is enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // The guard is defence in depth; the database is the authority.
  async findById(id: string, workspaceId: string) {
    return this.prisma.mediaAsset.findFirst({
      where: { id, workspace_id: workspaceId },
    });
  }

  async findByIds(ids: string[], workspaceId: string) {
    return this.prisma.mediaAsset.findMany({
      where: { id: { in: ids }, workspace_id: workspaceId },
      // Bounded: an unbounded `in` list let a caller fetch an arbitrary number
      // of rows in one request.
      take: MAX_BULK_IDS,
    });
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

  /** Returns null when the row does not exist *or* belongs to another workspace. */
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const result = await this.prisma.mediaAsset.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;
    return this.findById(id, workspaceId);
  }

  /** Returns false when the row does not exist *or* belongs to another workspace. */
  async delete(id: string, workspaceId: string) {
    const result = await this.prisma.mediaAsset.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
    return result.count > 0;
  }

  /**
   * Deletes only rows belonging to `workspaceId`. Previously this deleted by id
   * alone, so a caller could pass another workspace's media ids and destroy
   * their assets. Returns the number actually deleted so callers can detect a
   * partial match rather than assuming all ids were theirs.
   */
  async bulkDelete(ids: string[], workspaceId: string) {
    return this.prisma.mediaAsset.deleteMany({
      where: { id: { in: ids }, workspace_id: workspaceId },
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
