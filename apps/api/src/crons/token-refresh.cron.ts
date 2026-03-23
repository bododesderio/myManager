import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

@Injectable()
export class TokenRefreshCron {
  constructor(@InjectQueue('token-refresh') private tokenQueue: Queue, private readonly prisma: PrismaService) {}

  @Cron('0 */4 * * *') // Every 4 hours
  async refreshExpiringTokens() {
    await withDistributedLock('token-refresh', 3 * 60 * 60 * 1000, async () => {
      const threshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const accounts = await this.prisma.socialAccount.findMany({
        where: { is_active: true, refresh_token_encrypted: { not: null }, token_expires_at: { lte: threshold } },
      });

      for (const account of accounts) {
        await this.tokenQueue.add('refresh', { socialAccountId: account.id }, { attempts: 3, backoff: { type: 'exponential', delay: 300000 } });
      }
    });
  }
}
