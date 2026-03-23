import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AiRepository {
  constructor(private readonly prisma: PrismaService) {}
  async logCreditUsage(userId: string, workspaceId: string, feature: string, credits: number) {
    return this.prisma.aiCreditUsage.create({
      data: { user_id: userId, workspace_id: workspaceId, feature, credits },
    });
  }

  async getMonthlyUsage(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prisma.aiCreditUsage.aggregate({
      where: { user_id: userId, created_at: { gte: startOfMonth } },
      _sum: { credits: true },
    });
    return result._sum.credits || 0;
  }

  async getCreditLimit(userId: string): Promise<number> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { user_id: userId, status: 'ACTIVE' },
      include: { plan: true },
    });
    return (subscription?.plan?.limits as Record<string, unknown> | null)?.aiCredits as number ?? 0;
  }
}
