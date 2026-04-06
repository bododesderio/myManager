import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  async process(job: Job<PushNotificationJobData>): Promise<{ sent: number; failed: number }> {
    const { userId, title, body, data } = job.data;

    const pushTokens = await this.prisma.userPushToken.findMany({ where: { user_id: userId } });
    if (pushTokens.length === 0) return { sent: 0, failed: 0 };

    const messages = pushTokens.map((pt) => ({
      to: pt.token,
      title,
      body,
      data: data || {},
      sound: 'default',
      badge: 1,
      channelId: 'default',
    }));

    let sent = 0;
    let failed = 0;
    const batchSize = 100;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      let tickets: Array<{ status: string; id?: string; details?: { error?: string }; message?: string }> = [];
      try {
        const response = await axios.post(this.expoPushUrl, batch, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        });
        tickets = response.data.data || [];
      } catch (err) {
        failed += batch.length;
        this.logger.error(
          `Expo batch send failed (user=${userId}, batch=${i}): ${(err as Error).message}`,
        );
        continue;
      }

      for (let j = 0; j < tickets.length; j++) {
        const ticket = tickets[j];
        const tokenRecord = pushTokens[i + j];
        if (!tokenRecord) continue;

        if (ticket.status === 'ok') {
          sent++;
          continue;
        }

        failed++;
        const reason = ticket.details?.error ?? ticket.message ?? 'unknown';
        this.logger.warn(
          `Expo push failed (user=${userId}, token=${tokenRecord.token.slice(0, 12)}…): ${reason}`,
        );

        if (ticket.details?.error === 'DeviceNotRegistered') {
          await this.prisma.userPushToken
            .delete({
              where: { user_id_token: { user_id: userId, token: tokenRecord.token } },
            })
            .catch((delErr) => {
              this.logger.warn(`Failed to remove dead token: ${(delErr as Error).message}`);
            });
        }
      }
    }

    if (failed > 0) {
      this.logger.log(`Push notification job ${job.id}: sent=${sent}, failed=${failed}`);
    }
    return { sent, failed };
  }
}
