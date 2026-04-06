import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

interface WebhookDeliveryJobData { deliveryId: string; }

export class WebhookDeliveryWorker {
  constructor(private readonly prisma: PrismaService) {}

  async process(job: Job<WebhookDeliveryJobData>): Promise<void> {
    const { deliveryId } = job.data;
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true },
    });
    if (!delivery || !delivery.endpoint) return;

    const payload = JSON.stringify(delivery.payload);
    const signature = crypto.createHmac('sha256', delivery.endpoint.secret).update(payload).digest('hex');

    try {
      const response = await axios.post(delivery.endpoint.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-mymanager-signature': signature,
          'x-mymanager-delivery-id': delivery.id,
          'x-mymanager-event': delivery.event,
        },
        timeout: 30000,
      });

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          response_status: response.status,
          response_body: JSON.stringify(response.data).substring(0, 1000),
          delivered_at: new Date(),
        },
      });
    } catch (error: unknown) {
      const responseStatus = (error as { response?: { status?: number } }).response?.status || 0;
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          response_status: responseStatus,
          response_body: error instanceof Error ? error.message : String(error),
          attempts: { increment: 1 },
          next_retry_at: job.attemptsMade < (job.opts.attempts || 6) - 1
            ? new Date(Date.now() + Math.pow(2, job.attemptsMade) * 60000)
            : null,
        },
      });
      throw error;
    }
  }
}
