import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

@Injectable()
export class DataDeletionCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 2 * * *') // 2:00 AM daily
  async processScheduledDeletions() {
    await withDistributedLock('data-deletion', 23 * 60 * 60 * 1000, async () => {
      await this.processDeletionRequests();
    });
  }

  private async processDeletionRequests() {
    const pendingDeletions = await this.prisma.deletionRequest.findMany({
      where: { status: 'pending', scheduled_at: { lte: new Date() } },
      include: { user: true },
    });

    for (const request of pendingDeletions) {
      await this.prisma.$transaction(async (tx) => {
        await tx.post.deleteMany({ where: { user_id: request.user_id } });
        await tx.notification.deleteMany({ where: { user_id: request.user_id } });
        await tx.session.deleteMany({ where: { user_id: request.user_id } });
        await tx.userPushToken.deleteMany({ where: { user_id: request.user_id } });
        await tx.userPreferences.deleteMany({ where: { user_id: request.user_id } });
        await tx.workspaceMember.deleteMany({ where: { user_id: request.user_id } });
        await tx.aiCreditUsage.deleteMany({ where: { user_id: request.user_id } });
        await tx.subscription.deleteMany({ where: { user_id: request.user_id } });
        await tx.billingHistory.deleteMany({ where: { user_id: request.user_id } });
        await tx.user.delete({ where: { id: request.user_id } });
        await tx.deletionRequest.update({ where: { id: request.id }, data: { status: 'COMPLETED', completed_at: new Date() } });
      });
    }
  }
}
