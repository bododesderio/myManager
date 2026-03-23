import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class NotificationWorker {
  constructor(private readonly prisma: PrismaService) {}

  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  async process(job: Job<PushNotificationJobData>): Promise<void> {
    const { userId, title, body, data } = job.data;

    const pushTokens = await this.prisma.userPushToken.findMany({ where: { user_id: userId } });

    if (pushTokens.length === 0) return;

    const messages = pushTokens.map((pt) => ({
      to: pt.token,
      title,
      body,
      data: data || {},
      sound: 'default',
      badge: 1,
      channelId: 'default',
    }));

    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const response = await axios.post(this.expoPushUrl, batch, {
        headers: { 'Content-Type': 'application/json' },
      });

      const tickets = response.data.data || [];
      for (let j = 0; j < tickets.length; j++) {
        if (tickets[j].status === 'error') {
          const tokenRecord = pushTokens[i + j];
          if (tickets[j].details?.error === 'DeviceNotRegistered') {
            await this.prisma.userPushToken.delete({
              where: { user_id_token: { user_id: userId, token: tokenRecord.token } },
            });
          }
        }
      }
    }
  }
}
