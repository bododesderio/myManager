import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';

type QuotaType = 'posts' | 'accounts' | 'seats' | 'storage' | 'aiCredits' | 'scheduledQueue' | 'projects';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quotaType = this.reflector.getAllAndOverride<QuotaType>('quotaType', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!quotaType) return true;

    const request = context.switchToHttp().getRequest();
    const plan = request.plan;
    const user = request.user;

    if (!plan || !plan.limits) return true;

    const workspaceId =
      request.workspaceMember?.workspace_id ||
      request.workspaceId ||
      request.body?.workspaceId ||
      request.query?.workspaceId;
    if (!workspaceId) return true;

    const currentCount = await this.getCurrentCount(quotaType, user.id, workspaceId);
    const limit = this.getLimit(quotaType, plan.limits);

    if (limit !== null && currentCount >= limit) {
      throw new ForbiddenException(
        `You have reached your ${quotaType} limit (${currentCount}/${limit}). Please upgrade your plan.`,
      );
    }

    return true;
  }

  private async getCurrentCount(type: QuotaType, userId: string, workspaceId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    switch (type) {
      case 'posts':
        return this.prisma.post.count({
          where: { workspace_id: workspaceId, created_at: { gte: startOfMonth } },
        });
      case 'accounts':
        return this.prisma.socialAccount.count({
          where: { workspace_id: workspaceId, is_active: true },
        });
      case 'seats':
        return this.prisma.workspaceMember.count({ where: { workspace_id: workspaceId } });
      case 'storage': {
        const result = await this.prisma.mediaAsset.aggregate({
          where: { workspace_id: workspaceId },
          _sum: { size_bytes: true },
        });
        return Number(result._sum?.size_bytes ?? 0n);
      }
      case 'aiCredits': {
        const aiResult = await this.prisma.aiCreditUsage.aggregate({
          where: { user_id: userId, created_at: { gte: startOfMonth } },
          _sum: { credits: true },
        });
        return aiResult._sum.credits || 0;
      }
      case 'scheduledQueue':
        return this.prisma.post.count({
          where: { workspace_id: workspaceId, status: 'SCHEDULED' },
        });
      case 'projects':
        return this.prisma.project.count({
          where: { workspace_id: workspaceId },
        });
      default:
        return 0;
    }
  }

  private getLimit(type: QuotaType, limits: Record<string, unknown>): number | null {
    const mapping: Record<QuotaType, string> = {
      posts: 'postsPerMonth',
      accounts: 'connectedAccounts',
      seats: 'teamMembers',
      storage: 'storageBytes',
      aiCredits: 'aiCredits',
      scheduledQueue: 'maxScheduledQueue',
      projects: 'projects',
    };

    const value = limits[mapping[type]];
    return value !== undefined ? (value as number) : null;
  }
}
