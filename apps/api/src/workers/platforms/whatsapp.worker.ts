import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import { PrismaService } from '../../prisma.service';
import axios from 'axios';

export class WhatsAppWorker extends BasePublishingWorker {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  private readonly apiUrl = 'https://graph.facebook.com/v21.0';

  async buildPayload(post: Record<string, any>, _account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: post.caption as string,
      mediaUrls: (post.media?.map((m: any) => m.media_asset.url) || []) as string[],
      contentType: post.content_type as string,
      platformOptions: { ...post.platform_options?.whatsapp, phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID },
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const phoneNumberId = payload.platformOptions.phoneNumberId;
    const systemToken = process.env.WHATSAPP_SYSTEM_USER_TOKEN || token;
    const headers = { Authorization: `Bearer ${systemToken}`, 'Content-Type': 'application/json' };

    if (payload.contentType === 'whatsapp_channel') {
      const result = await this.publishToChannel(payload, headers);
      return result;
    }

    const recipientListId = payload.platformOptions.recipient_list_id;
    const recipients = await this.getRecipientList(recipientListId as string);
    const results = [];

    for (const recipient of recipients) {
      let messageBody: Record<string, unknown>;

      if (payload.mediaUrls.length > 0 && payload.contentType === 'image_single') {
        messageBody = {
          messaging_product: 'whatsapp',
          to: recipient.phone,
          type: 'image',
          image: { link: payload.mediaUrls[0], caption: payload.caption },
        };
      } else if (payload.mediaUrls.length > 0 && payload.contentType === 'video_short') {
        messageBody = {
          messaging_product: 'whatsapp',
          to: recipient.phone,
          type: 'video',
          video: { link: payload.mediaUrls[0], caption: payload.caption },
        };
      } else if (payload.contentType === 'document') {
        messageBody = {
          messaging_product: 'whatsapp',
          to: recipient.phone,
          type: 'document',
          document: { link: payload.mediaUrls[0], caption: payload.caption },
        };
      } else {
        messageBody = {
          messaging_product: 'whatsapp',
          to: recipient.phone,
          type: 'text',
          text: { body: payload.caption },
        };
      }

      const resp = await axios.post(`${this.apiUrl}/${phoneNumberId}/messages`, messageBody, { headers });
      results.push({ phone: recipient.phone, messageId: resp.data.messages?.[0]?.id });
    }

    return {
      platformPostId: results[0]?.messageId || 'broadcast',
      platformPostUrl: '',
      rawResponse: { sentCount: results.length, results },
    };
  }

  fetchPostId(result: PlatformResult): string { return result.platformPostId; }

  private async publishToChannel(payload: PlatformPayload, headers: Record<string, string>): Promise<PlatformResult> {
    const wabaId = process.env.WHATSAPP_WABA_ID;
    const result = await axios.post(`${this.apiUrl}/${wabaId}/messages`, {
      messaging_product: 'whatsapp',
      type: 'text',
      text: { body: payload.caption },
    }, { headers });

    return {
      platformPostId: result.data.messages?.[0]?.id || 'channel_post',
      platformPostUrl: '',
      rawResponse: result.data,
    };
  }

  private async getRecipientList(listId: string): Promise<{ phone: string }[]> {
    const list = await this.prisma.whatsAppContactList.findUnique({ where: { id: listId } });
    if (!list) return [];
    // TODO: WhatsAppContactList only stores contact_count; individual contacts need a separate model or external source.
    return [];
  }
}
