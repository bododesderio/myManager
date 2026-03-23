import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import axios from 'axios';

export class ThreadsWorker extends BasePublishingWorker {
  private readonly apiUrl = 'https://graph.threads.net/v1.0';

  async buildPayload(post: Record<string, any>, account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: (post.caption as string).substring(0, 500),
      mediaUrls: post.media?.map((m: any) => m.mediaAsset.url) || [],
      contentType: post.contentType as string,
      platformOptions: { ...post.platformOptions?.threads, threadsUserId: account.platformAccountId },
      linkUrl: post.linkUrl as string,
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const threadsUserId = payload.platformOptions.threadsUserId;

    let containerId: string;

    if (payload.contentType === 'text_only') {
      const resp = await axios.post(`${this.apiUrl}/${threadsUserId}/threads`, {
        media_type: 'TEXT',
        text: payload.linkUrl ? `${payload.caption}\n${payload.linkUrl}` : payload.caption,
        access_token: token,
      });
      containerId = resp.data.id;
    } else if (payload.contentType === 'image_single') {
      const resp = await axios.post(`${this.apiUrl}/${threadsUserId}/threads`, {
        media_type: 'IMAGE',
        image_url: payload.mediaUrls[0],
        text: payload.caption,
        access_token: token,
      });
      containerId = resp.data.id;
    } else if (payload.contentType === 'image_carousel') {
      const childIds = [];
      for (const url of payload.mediaUrls.slice(0, 20)) {
        const child = await axios.post(`${this.apiUrl}/${threadsUserId}/threads`, {
          media_type: 'IMAGE',
          image_url: url,
          is_carousel_item: true,
          access_token: token,
        });
        childIds.push(child.data.id);
      }
      const carouselResp = await axios.post(`${this.apiUrl}/${threadsUserId}/threads`, {
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        text: payload.caption,
        access_token: token,
      });
      containerId = carouselResp.data.id;
    } else if (payload.contentType === 'video_short') {
      const resp = await axios.post(`${this.apiUrl}/${threadsUserId}/threads`, {
        media_type: 'VIDEO',
        video_url: payload.mediaUrls[0],
        text: payload.caption,
        access_token: token,
      });
      containerId = resp.data.id;
      await this.waitForProcessing(threadsUserId as string, containerId, token);
    } else {
      throw new Error(`Unsupported content type for Threads: ${payload.contentType}`);
    }

    const publishResp = await axios.post(`${this.apiUrl}/${threadsUserId}/threads_publish`, {
      creation_id: containerId,
      access_token: token,
    });

    return {
      platformPostId: publishResp.data.id,
      platformPostUrl: `https://threads.net/t/${publishResp.data.id}`,
      rawResponse: publishResp.data,
    };
  }

  fetchPostId(result: PlatformResult): string { return result.platformPostId; }

  private async waitForProcessing(userId: string, containerId: string, token: string): Promise<void> {
    for (let i = 0; i < 30; i++) {
      const resp = await axios.get(`${this.apiUrl}/${containerId}`, {
        params: { fields: 'status', access_token: token },
      });
      if (resp.data.status === 'FINISHED') return;
      if (resp.data.status === 'ERROR') throw new Error('Threads media processing failed');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error('Threads media processing timed out');
  }
}
