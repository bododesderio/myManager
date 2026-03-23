import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import axios from 'axios';

export class FacebookWorker extends BasePublishingWorker {
  private readonly graphApiUrl = 'https://graph.facebook.com/v21.0';

  async buildPayload(post: Record<string, any>, _account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: post.caption as string,
      mediaUrls: post.media?.map((m: any) => m.mediaAsset.url) || [],
      contentType: post.contentType as string,
      platformOptions: post.platformOptions?.facebook || {},
      linkUrl: post.linkUrl as string,
      firstCommentText: post.firstCommentText as string,
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const pageId = payload.platformOptions.pageId;

    let result: { data: { id: string } } | undefined;

    if (payload.contentType === 'text_only' || payload.mediaUrls.length === 0) {
      result = await axios.post(`${this.graphApiUrl}/${pageId}/feed`, {
        message: payload.caption,
        link: payload.linkUrl,
        access_token: token,
      });
    } else if (payload.contentType === 'image_single' || (payload.contentType === 'image_carousel' && payload.mediaUrls.length === 1)) {
      result = await axios.post(`${this.graphApiUrl}/${pageId}/photos`, {
        url: payload.mediaUrls[0],
        caption: payload.caption,
        access_token: token,
      });
    } else if (payload.contentType === 'image_carousel') {
      const photoIds = [];
      for (const url of payload.mediaUrls) {
        const uploadResult = await axios.post(`${this.graphApiUrl}/${pageId}/photos`, {
          url,
          published: false,
          access_token: token,
        });
        photoIds.push({ media_fbid: uploadResult.data.id });
      }

      result = await axios.post(`${this.graphApiUrl}/${pageId}/feed`, {
        message: payload.caption,
        attached_media: photoIds,
        access_token: token,
      });
    } else if (['video_short', 'video_long'].includes(payload.contentType)) {
      result = await axios.post(`${this.graphApiUrl}/${pageId}/videos`, {
        file_url: payload.mediaUrls[0],
        description: payload.caption,
        access_token: token,
      });
    } else if (['image_story', 'video_story'].includes(payload.contentType)) {
      const isVideo = payload.contentType === 'video_story';
      result = await axios.post(`${this.graphApiUrl}/${pageId}/stories`, {
        [isVideo ? 'video_url' : 'image_url']: payload.mediaUrls[0],
        caption: payload.caption,
        access_token: token,
      });
    }

    if (payload.firstCommentText && result?.data?.id) {
      await axios.post(`${this.graphApiUrl}/${result.data.id}/comments`, {
        message: payload.firstCommentText,
        access_token: token,
      });
    }

    return {
      platformPostId: result!.data.id,
      platformPostUrl: `https://facebook.com/${result!.data.id}`,
      rawResponse: result!.data,
    };
  }

  fetchPostId(result: PlatformResult): string {
    return result.platformPostId;
  }
}
