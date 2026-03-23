import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import axios from 'axios';

export class PinterestWorker extends BasePublishingWorker {
  private readonly apiUrl = 'https://api.pinterest.com/v5';

  async buildPayload(post: Record<string, any>, _account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: post.caption as string,
      mediaUrls: post.media?.map((m: any) => m.mediaAsset.url) || [],
      contentType: post.contentType as string,
      platformOptions: post.platformOptions?.pinterest || {},
      linkUrl: post.linkUrl as string,
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const boardId = payload.platformOptions.board_id;

    const pinData: Record<string, unknown> = {
      board_id: boardId,
      title: payload.caption.substring(0, 100),
      description: payload.caption,
      link: payload.linkUrl,
      alt_text: payload.caption.substring(0, 500),
    };

    if (payload.contentType === 'pin_image') {
      pinData.media_source = { source_type: 'image_url', url: payload.mediaUrls[0] };
    } else if (payload.contentType === 'pin_video') {
      pinData.media_source = { source_type: 'video_id', cover_image_url: payload.mediaUrls[1] || payload.mediaUrls[0] };
    } else if (payload.contentType === 'pin_product') {
      pinData.media_source = { source_type: 'image_url', url: payload.mediaUrls[0] };
    }

    const result = await axios.post(`${this.apiUrl}/pins`, pinData, { headers });

    return {
      platformPostId: result.data.id,
      platformPostUrl: `https://pinterest.com/pin/${result.data.id}`,
      rawResponse: result.data,
    };
  }

  fetchPostId(result: PlatformResult): string { return result.platformPostId; }
}
