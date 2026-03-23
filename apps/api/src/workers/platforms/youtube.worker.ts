import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import axios from 'axios';

export class YouTubeWorker extends BasePublishingWorker {
  private readonly apiUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly uploadUrl = 'https://www.googleapis.com/upload/youtube/v3/videos';

  async buildPayload(post: Record<string, any>, _account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: post.caption as string,
      mediaUrls: ((post.media as any[])?.map((m: any) => m.mediaAsset.url) || []) as string[],
      contentType: post.contentType as string,
      platformOptions: (post.platformOptions as any)?.youtube || {},
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const headers = { Authorization: `Bearer ${token}` };
    const title = payload.platformOptions.title || payload.caption.substring(0, 100);
    const categoryId = payload.platformOptions.category_id || '22';
    const isShort = payload.contentType === 'video_short';

    const videoMetadata = {
      snippet: {
        title: isShort ? `${title} #Shorts` : title,
        description: payload.caption,
        categoryId,
        tags: payload.platformOptions.tags || [],
      },
      status: {
        privacyStatus: payload.platformOptions.privacy || 'public',
        selfDeclaredMadeForKids: false,
      },
    };

    // Step 1: Initiate resumable upload
    const initResp = await axios.post(
      `${this.uploadUrl}?uploadType=resumable&part=snippet,status`,
      videoMetadata,
      { headers: { ...headers, 'Content-Type': 'application/json' } },
    );

    const uploadUri = initResp.headers['location'];

    // Step 2: Upload video data
    const videoData = await axios.get(payload.mediaUrls[0], { responseType: 'arraybuffer' });
    const uploadResp = await axios.put(uploadUri, videoData.data, {
      headers: { 'Content-Type': 'video/*', 'Content-Length': videoData.data.length.toString() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const videoId = uploadResp.data.id;

    if (payload.platformOptions.thumbnail_url) {
      const thumbData = await axios.get(payload.platformOptions.thumbnail_url as string, { responseType: 'arraybuffer' });
      await axios.post(
        `${this.apiUrl}/thumbnails/set?videoId=${videoId}`,
        thumbData.data,
        { headers: { ...headers, 'Content-Type': 'image/jpeg' } },
      );
    }

    return {
      platformPostId: videoId,
      platformPostUrl: isShort ? `https://youtube.com/shorts/${videoId}` : `https://youtube.com/watch?v=${videoId}`,
      rawResponse: uploadResp.data,
    };
  }

  fetchPostId(result: PlatformResult): string { return result.platformPostId; }
}
