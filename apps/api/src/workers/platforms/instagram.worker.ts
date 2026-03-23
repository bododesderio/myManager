import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import axios from 'axios';

export class InstagramWorker extends BasePublishingWorker {
  private readonly graphApiUrl = 'https://graph.facebook.com/v21.0';

  async buildPayload(post: Record<string, any>, _account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: post.caption as string,
      mediaUrls: post.media?.map((m: any) => m.mediaAsset.url) || [],
      contentType: post.contentType as string,
      platformOptions: post.platformOptions?.instagram || {},
      firstCommentText: post.firstCommentText as string,
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const igUserId = payload.platformOptions.igUserId;
    let containerId: string;

    if (payload.contentType === 'image_single') {
      const containerResp = await axios.post(`${this.graphApiUrl}/${igUserId}/media`, {
        image_url: payload.mediaUrls[0],
        caption: payload.caption,
        access_token: token,
      });
      containerId = containerResp.data.id;
    } else if (payload.contentType === 'image_carousel') {
      const childIds = [];
      for (const url of payload.mediaUrls) {
        const child = await axios.post(`${this.graphApiUrl}/${igUserId}/media`, {
          image_url: url,
          is_carousel_item: true,
          access_token: token,
        });
        childIds.push(child.data.id);
      }

      const carouselResp = await axios.post(`${this.graphApiUrl}/${igUserId}/media`, {
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        caption: payload.caption,
        access_token: token,
      });
      containerId = carouselResp.data.id;
    } else if (payload.contentType === 'video_short') {
      const containerResp = await axios.post(`${this.graphApiUrl}/${igUserId}/media`, {
        video_url: payload.mediaUrls[0],
        caption: payload.caption,
        media_type: 'REELS',
        access_token: token,
      });
      containerId = containerResp.data.id;

      await this.waitForProcessing(igUserId as string, containerId, token);
    } else if (['image_story', 'video_story'].includes(payload.contentType)) {
      const isVideo = payload.contentType === 'video_story';
      const containerResp = await axios.post(`${this.graphApiUrl}/${igUserId}/media`, {
        [isVideo ? 'video_url' : 'image_url']: payload.mediaUrls[0],
        media_type: 'STORIES',
        access_token: token,
      });
      containerId = containerResp.data.id;

      if (isVideo) {
        await this.waitForProcessing(igUserId as string, containerId, token);
      }
    } else {
      throw new Error(`Unsupported content type for Instagram: ${payload.contentType}`);
    }

    const publishResp = await axios.post(`${this.graphApiUrl}/${igUserId}/media_publish`, {
      creation_id: containerId,
      access_token: token,
    });

    if (payload.firstCommentText && publishResp.data.id) {
      await axios.post(`${this.graphApiUrl}/${publishResp.data.id}/comments`, {
        message: payload.firstCommentText,
        access_token: token,
      });
    }

    return {
      platformPostId: publishResp.data.id,
      platformPostUrl: `https://instagram.com/p/${publishResp.data.id}`,
      rawResponse: publishResp.data,
    };
  }

  fetchPostId(result: PlatformResult): string {
    return result.platformPostId;
  }

  private async waitForProcessing(igUserId: string, containerId: string, token: string, maxRetries = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      const statusResp = await axios.get(`${this.graphApiUrl}/${containerId}`, {
        params: { fields: 'status_code', access_token: token },
      });

      if (statusResp.data.status_code === 'FINISHED') return;
      if (statusResp.data.status_code === 'ERROR') throw new Error('Instagram media processing failed');

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error('Instagram media processing timed out');
  }
}
