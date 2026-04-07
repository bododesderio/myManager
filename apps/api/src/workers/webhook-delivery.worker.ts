import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

interface WebhookDeliveryJobData { deliveryId: string; }

/**
 * Shape an event payload for the destination integration.
 * - slack: Block Kit message format (https://api.slack.com/block-kit)
 * - zapier / make: pass the raw envelope (they consume any JSON)
 * - generic: signed envelope with event + data + timestamp
 */
function shapePayloadForProvider(
  provider: string,
  event: string,
  payload: Record<string, any>,
): Record<string, any> {
  if (provider === 'slack') {
    const data = (payload?.data ?? payload) as Record<string, any>;
    const text = `*${event}*${data.title ? ` — ${data.title}` : ''}`;
    return {
      text,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: event, emoji: true } },
        ...(data.title
          ? [{ type: 'section', text: { type: 'mrkdwn', text: `*${data.title}*` } }]
          : []),
        ...(data.body || data.message
          ? [{ type: 'section', text: { type: 'mrkdwn', text: String(data.body ?? data.message) } }]
          : []),
        { type: 'context', elements: [{ type: 'mrkdwn', text: `myManager · ${new Date().toISOString()}` }] },
      ],
    };
  }
  // Zapier and Make both accept arbitrary JSON; pass the full envelope flat for easier mapping
  if (provider === 'zapier' || provider === 'make') {
    const data = (payload?.data ?? {}) as Record<string, any>;
    return {
      event,
      timestamp: new Date().toISOString(),
      ...data,
    };
  }
  // Generic: passthrough envelope
  return payload;
}

export class WebhookDeliveryWorker {
  constructor(private readonly prisma: PrismaService) {}

  async process(job: Job<WebhookDeliveryJobData>): Promise<void> {
    const { deliveryId } = job.data;
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true },
    });
    if (!delivery || !delivery.endpoint) return;

    const provider = (delivery.endpoint as any).provider ?? 'generic';
    const shapedPayload = shapePayloadForProvider(
      provider,
      delivery.event,
      delivery.payload as Record<string, any>,
    );
    const payloadString = JSON.stringify(shapedPayload);
    const signature = crypto.createHmac('sha256', delivery.endpoint.secret).update(payloadString).digest('hex');

    try {
      const response = await axios.post(delivery.endpoint.url, shapedPayload, {
        headers: {
          'Content-Type': 'application/json',
          // Slack ignores extra headers; signed headers help generic + Zapier/Make consumers verify.
          ...(provider !== 'slack' && {
            'x-mymanager-signature': signature,
            'x-mymanager-delivery-id': delivery.id,
            'x-mymanager-event': delivery.event,
          }),
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
