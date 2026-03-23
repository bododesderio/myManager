import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import axios from 'axios';

export class XWorker extends BasePublishingWorker {
  private readonly apiUrl = 'https://api.twitter.com/2';
  private readonly uploadUrl = 'https://upload.twitter.com/1.1';

  async buildPayload(post: Record<string, any>, _account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: (post.caption as string).substring(0, 280),
      mediaUrls: (post.media?.map((m: any) => m.mediaAsset.url) || []) as string[],
      contentType: post.contentType as string,
      platformOptions: post.platformOptions?.x || {},
      linkUrl: post.linkUrl as string | undefined,
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const tweetData: Record<string, unknown> = { text: payload.caption };

    if (payload.mediaUrls.length > 0) {
      const mediaIds = [];
      for (const url of payload.mediaUrls.slice(0, 4)) {
        const mediaId = await this.uploadMedia(url, token);
        mediaIds.push(mediaId);
      }
      tweetData.media = { media_ids: mediaIds };
    }

    if (payload.linkUrl && !payload.caption.includes(payload.linkUrl)) {
      tweetData.text = `${payload.caption}\n${payload.linkUrl}`.substring(0, 280);
    }

    const result = await axios.post(`${this.apiUrl}/tweets`, tweetData, { headers });

    return {
      platformPostId: result.data.data.id,
      platformPostUrl: `https://x.com/i/status/${result.data.data.id}`,
      rawResponse: result.data,
    };
  }

  fetchPostId(result: PlatformResult): string {
    return result.platformPostId;
  }

  private async uploadMedia(url: string, token: string): Promise<string> {
    const mediaResponse = await axios.get(url, { responseType: 'arraybuffer' });
    const mediaData = Buffer.from(mediaResponse.data);
    const contentType = mediaResponse.headers['content-type'];
    const isVideo = contentType?.startsWith('video/');

    if (isVideo) {
      return this.chunkedUpload(mediaData, contentType, token);
    }

    const initResponse = await axios.post(`${this.uploadUrl}/media/upload.json`, null, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        command: 'INIT',
        total_bytes: mediaData.length,
        media_type: contentType,
      },
    });

    const mediaId = initResponse.data.media_id_string;

    await axios.post(`${this.uploadUrl}/media/upload.json`, mediaData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      params: { command: 'APPEND', media_id: mediaId, segment_index: 0 },
    });

    await axios.post(`${this.uploadUrl}/media/upload.json`, null, {
      headers: { Authorization: `Bearer ${token}` },
      params: { command: 'FINALIZE', media_id: mediaId },
    });

    return mediaId;
  }

  private async chunkedUpload(data: Buffer, contentType: string, token: string): Promise<string> {
    const headers = { Authorization: `Bearer ${token}` };

    const initResp = await axios.post(`${this.uploadUrl}/media/upload.json`, null, {
      headers,
      params: {
        command: 'INIT',
        total_bytes: data.length,
        media_type: contentType,
        media_category: 'tweet_video',
      },
    });

    const mediaId = initResp.data.media_id_string;
    const chunkSize = 5 * 1024 * 1024;

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.subarray(i, Math.min(i + chunkSize, data.length));
      await axios.post(`${this.uploadUrl}/media/upload.json`, chunk, {
        headers: { ...headers, 'Content-Type': 'application/octet-stream' },
        params: { command: 'APPEND', media_id: mediaId, segment_index: Math.floor(i / chunkSize) },
      });
    }

    const finalizeResp = await axios.post(`${this.uploadUrl}/media/upload.json`, null, {
      headers,
      params: { command: 'FINALIZE', media_id: mediaId },
    });

    if (finalizeResp.data.processing_info) {
      await this.waitForProcessing(mediaId, token);
    }

    return mediaId;
  }

  private async waitForProcessing(mediaId: string, token: string): Promise<void> {
    for (let i = 0; i < 60; i++) {
      const statusResp = await axios.get(`${this.uploadUrl}/media/upload.json`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { command: 'STATUS', media_id: mediaId },
      });
      const info = statusResp.data.processing_info;
      if (!info || info.state === 'succeeded') return;
      if (info.state === 'failed') throw new Error(`X media processing failed: ${info.error?.message}`);
      await new Promise((resolve) => setTimeout(resolve, (info.check_after_secs || 5) * 1000));
    }
  }
}
