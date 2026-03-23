import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import axios from 'axios';

export class LinkedInWorker extends BasePublishingWorker {
  private readonly apiUrl = 'https://api.linkedin.com/v2';

  async buildPayload(post: Record<string, any>, account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: post.caption as string,
      mediaUrls: post.media?.map((m: any) => m.mediaAsset.url) || [],
      contentType: post.contentType as string,
      platformOptions: { ...post.platformOptions?.linkedin, authorUrn: account.platformAccountId },
      linkUrl: post.linkUrl as string,
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' };
    const authorUrn = `urn:li:person:${payload.platformOptions.authorUrn}`;

    const postBody: Record<string, unknown> = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    if (payload.contentType === 'text_only' && !payload.linkUrl) {
      postBody.specificContent = {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: payload.caption },
          shareMediaCategory: 'NONE',
        },
      };
    } else if (payload.linkUrl) {
      postBody.specificContent = {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: payload.caption },
          shareMediaCategory: 'ARTICLE',
          media: [{ status: 'READY', originalUrl: payload.linkUrl }],
        },
      };
    } else if (['image_single', 'image_carousel'].includes(payload.contentType)) {
      const mediaAssets = [];
      for (const url of payload.mediaUrls) {
        const assetUrn = await this.uploadImage(url, authorUrn, token);
        mediaAssets.push({ status: 'READY', media: assetUrn });
      }
      postBody.specificContent = {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: payload.caption },
          shareMediaCategory: 'IMAGE',
          media: mediaAssets,
        },
      };
    } else if (payload.contentType === 'video_long') {
      const assetUrn = await this.uploadVideo(payload.mediaUrls[0], authorUrn, token);
      postBody.specificContent = {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: payload.caption },
          shareMediaCategory: 'VIDEO',
          media: [{ status: 'READY', media: assetUrn }],
        },
      };
    } else if (payload.contentType === 'document') {
      const assetUrn = await this.uploadDocument(payload.mediaUrls[0], authorUrn, token);
      postBody.specificContent = {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: payload.caption },
          shareMediaCategory: 'DOCUMENT',
          media: [{ status: 'READY', media: assetUrn }],
        },
      };
    }

    const result = await axios.post(`${this.apiUrl}/ugcPosts`, postBody, { headers });
    const postId = result.headers['x-restli-id'] || result.data.id;

    return {
      platformPostId: postId,
      platformPostUrl: `https://www.linkedin.com/feed/update/${postId}`,
      rawResponse: result.data,
    };
  }

  fetchPostId(result: PlatformResult): string { return result.platformPostId; }

  private async uploadImage(imageUrl: string, authorUrn: string, token: string): Promise<string> {
    const registerResp = await axios.post(`${this.apiUrl}/assets?action=registerUpload`, {
      registerUploadRequest: {
        owner: authorUrn,
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        serviceRelationships: [{ identifier: 'urn:li:userGeneratedContent', relationshipType: 'OWNER' }],
      },
    }, { headers: { Authorization: `Bearer ${token}` } });

    const uploadUrl = registerResp.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerResp.data.value.asset;

    const imageData = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    await axios.put(uploadUrl, imageData.data, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    });

    return asset;
  }

  private async uploadVideo(videoUrl: string, authorUrn: string, token: string): Promise<string> {
    return this.uploadImage(videoUrl, authorUrn, token);
  }

  private async uploadDocument(docUrl: string, authorUrn: string, token: string): Promise<string> {
    return this.uploadImage(docUrl, authorUrn, token);
  }
}
