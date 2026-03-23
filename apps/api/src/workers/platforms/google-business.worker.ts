import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';
import axios from 'axios';

export class GoogleBusinessWorker extends BasePublishingWorker {
  private readonly apiUrl = 'https://mybusiness.googleapis.com/v4';

  async buildPayload(post: Record<string, any>, account: Record<string, any>): Promise<PlatformPayload> {
    return {
      caption: post.caption as string,
      mediaUrls: post.media?.map((m: any) => m.mediaAsset.url) || [],
      contentType: post.contentType as string,
      platformOptions: { ...post.platformOptions?.gbp, locationName: account.platformAccountId },
    };
  }

  async publish(payload: PlatformPayload, token: string): Promise<PlatformResult> {
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const locationName = payload.platformOptions.locationName;
    const postType = payload.platformOptions.post_type || 'STANDARD';

    const localPost: Record<string, any> = { languageCode: 'en', summary: payload.caption, topicType: postType };

    if (payload.mediaUrls.length > 0) {
      localPost.media = [{ mediaFormat: 'PHOTO', sourceUrl: payload.mediaUrls[0] }];
    }

    if (postType === 'EVENT' && payload.platformOptions.event_start) {
      const startDate = new Date(payload.platformOptions.event_start);
      const endDate = payload.platformOptions.event_end ? new Date(payload.platformOptions.event_end) : new Date(startDate.getTime() + 3600000);
      localPost.event = {
        title: payload.platformOptions.event_title || payload.caption.substring(0, 58),
        schedule: {
          startDate: { year: startDate.getFullYear(), month: startDate.getMonth() + 1, day: startDate.getDate() },
          startTime: { hours: startDate.getHours(), minutes: startDate.getMinutes() },
          endDate: { year: endDate.getFullYear(), month: endDate.getMonth() + 1, day: endDate.getDate() },
          endTime: { hours: endDate.getHours(), minutes: endDate.getMinutes() },
        },
      };
    }

    if (postType === 'OFFER') {
      localPost.offer = {
        couponCode: payload.platformOptions.coupon_code,
        redeemOnlineUrl: payload.platformOptions.redeem_url,
        termsConditions: payload.platformOptions.terms,
      };
    }

    const result = await axios.post(`${this.apiUrl}/${locationName}/localPosts`, localPost, { headers });

    return {
      platformPostId: result.data.name,
      platformPostUrl: result.data.searchUrl || '',
      rawResponse: result.data,
    };
  }

  fetchPostId(result: PlatformResult): string { return result.platformPostId; }
}
