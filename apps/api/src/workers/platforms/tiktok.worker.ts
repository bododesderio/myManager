import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import axios from 'axios';

export class TikTokWorker extends BasePublishingWorker {
  private readonly apiUrl = 'https://open.tiktokapis.com/v2';

  async buildPayload(post: Record<string, any>, _account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: post.caption as string,
      mediaUrls: post.media?.map((m: any) => m.mediaAsset.url) || [],
      contentType: post.contentType as string,
      platformOptions: post.platformOptions?.tiktok || {},
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Step 1: Initialize upload
    const initBody: Record<string, any> = {
      post_info: {
        title: payload.caption.substring(0, 150),
        privacy_level: payload.platformOptions.privacy || 'PUBLIC_TO_EVERYONE',
        disable_duet: payload.platformOptions.allow_duet === false,
        disable_comment: payload.platformOptions.allow_comment === false,
        disable_stitch: payload.platformOptions.allow_stitch === false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: 0,
      },
    };

    if (payload.contentType === 'image_carousel') {
      initBody.media_type = 'PHOTO';
      initBody.post_info.photo_images = payload.mediaUrls;
    } else {
      initBody.media_type = 'VIDEO';
    }

    const initResp = await axios.post(`${this.apiUrl}/post/publish/inbox/video/init/`, initBody, { headers });
    const publishId = initResp.data.data.publish_id;
    const uploadUrl = initResp.data.data.upload_url;

    // Step 2: Upload media
    if (payload.contentType !== 'image_carousel') {
      const videoData = await axios.get(payload.mediaUrls[0], { responseType: 'arraybuffer' });
      await axios.put(uploadUrl, videoData.data, {
        headers: { 'Content-Type': 'video/mp4', 'Content-Range': `bytes 0-${videoData.data.length - 1}/${videoData.data.length}` },
      });
    }

    // Step 3: Poll for completion
    const result = await this.pollPublishStatus(publishId, token);

    return {
      platformPostId: result.publicPostId,
      platformPostUrl: `https://www.tiktok.com/@user/video/${result.publicPostId}`,
      rawResponse: result,
    };
  }

  fetchPostId(result: PlatformResult): string { return result.platformPostId; }

  private async pollPublishStatus(publishId: string, token: string, maxRetries = 60): Promise<{ publicPostId: string }> {
    for (let i = 0; i < maxRetries; i++) {
      const statusResp = await axios.post(`${this.apiUrl}/post/publish/status/fetch/`, {
        publish_id: publishId,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const status = statusResp.data.data.status;
      if (status === 'PUBLISH_COMPLETE') {
        return { publicPostId: statusResp.data.data.publicaly_available_post_id?.[0] || publishId };
      }
      if (status === 'FAILED') {
        throw new Error(`TikTok publish failed: ${statusResp.data.data.fail_reason}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    throw new Error('TikTok publish timed out');
  }
}
