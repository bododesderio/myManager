import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

interface AnalyticsSyncJobData {
  postId: string;
  platform: string;
  socialAccountId: string;
  platformPostId: string;
}

export class AnalyticsSyncWorker {
  constructor(private readonly prisma: PrismaService) {}

  async process(job: Job<AnalyticsSyncJobData>): Promise<void> {
    const { postId, platform, socialAccountId, platformPostId } = job.data;

    const account = await this.prisma.socialAccount.findUnique({ where: { id: socialAccountId } });
    if (!account) return;

    const token = this.decryptToken(account.access_token_encrypted);
    const metrics = await this.fetchMetrics(platform, platformPostId, token);

    await this.prisma.postAnalytics.upsert({
      where: { post_id_platform: { post_id: postId, platform } },
      update: { ...metrics, synced_at: new Date() },
      create: { post_id: postId, platform, ...metrics, synced_at: new Date() },
    });

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (post) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await this.prisma.workspaceAnalyticsDaily.upsert({
        where: { workspace_id_platform_date: { workspace_id: post.workspace_id, platform, date: today } },
        update: {
          total_reach: { increment: metrics.reach || 0 },
          total_impressions: { increment: metrics.impressions || 0 },
          total_engagements: { increment: metrics.engagements || 0 },
        },
        create: {
          workspace_id: post.workspace_id,
          platform,
          date: today,
          total_reach: metrics.reach || 0,
          total_impressions: metrics.impressions || 0,
          total_engagements: metrics.engagements || 0,
        },
      });
    }
  }

  private async fetchMetrics(platform: string, postId: string, token: string): Promise<Record<string, number>> {
    const fetchers: Record<string, () => Promise<Record<string, number>>> = {
      facebook: () => this.fetchFacebookMetrics(postId, token),
      instagram: () => this.fetchInstagramMetrics(postId, token),
      x: () => this.fetchXMetrics(postId, token),
      linkedin: () => this.fetchLinkedInMetrics(postId, token),
      tiktok: () => this.fetchTikTokMetrics(postId, token),
      youtube: () => this.fetchYouTubeMetrics(postId, token),
      pinterest: () => this.fetchPinterestMetrics(postId, token),
      threads: () => this.fetchThreadsMetrics(postId, token),
      'google-business': () => this.fetchGoogleBusinessMetrics(postId, token),
      whatsapp: () => this.fetchWhatsAppMetrics(postId, token),
    };
    return (fetchers[platform] || (() => Promise.resolve({})))();
  }

  private async fetchFacebookMetrics(postId: string, token: string) {
    const resp = await axios.get(`https://graph.facebook.com/v21.0/${postId}/insights`, {
      params: { metric: 'post_impressions,post_engaged_users,post_clicks', access_token: token },
    });
    const data = resp.data.data || [];
    return {
      impressions: data.find((d: { name: string; values?: { value: number }[] }) => d.name === 'post_impressions')?.values?.[0]?.value || 0,
      engagements: data.find((d: { name: string; values?: { value: number }[] }) => d.name === 'post_engaged_users')?.values?.[0]?.value || 0,
      clicks: data.find((d: { name: string; values?: { value: number }[] }) => d.name === 'post_clicks')?.values?.[0]?.value || 0,
      reach: 0, likes: 0, comments: 0, shares: 0,
    };
  }

  private async fetchInstagramMetrics(postId: string, token: string) {
    const resp = await axios.get(`https://graph.facebook.com/v21.0/${postId}/insights`, {
      params: { metric: 'impressions,reach,likes,comments,saved', access_token: token },
    });
    const data = resp.data.data || [];
    return {
      impressions: data.find((d: { name: string; values?: { value: number }[] }) => d.name === 'impressions')?.values?.[0]?.value || 0,
      reach: data.find((d: { name: string; values?: { value: number }[] }) => d.name === 'reach')?.values?.[0]?.value || 0,
      likes: data.find((d: { name: string; values?: { value: number }[] }) => d.name === 'likes')?.values?.[0]?.value || 0,
      comments: data.find((d: { name: string; values?: { value: number }[] }) => d.name === 'comments')?.values?.[0]?.value || 0,
      engagements: 0, clicks: 0, shares: 0,
    };
  }

  private async fetchXMetrics(postId: string, token: string) {
    const resp = await axios.get(`https://api.twitter.com/2/tweets/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { 'tweet.fields': 'public_metrics' },
    });
    const m = resp.data.data?.public_metrics || {};
    return { impressions: m.impression_count || 0, likes: m.like_count || 0, comments: m.reply_count || 0, shares: m.retweet_count || 0, reach: 0, clicks: 0, engagements: (m.like_count || 0) + (m.reply_count || 0) + (m.retweet_count || 0) };
  }

  private async fetchLinkedInMetrics(postId: string, token: string) {
    const resp = await axios.get(`https://api.linkedin.com/v2/socialActions/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
    return { likes: resp.data.likesSummary?.totalLikes || 0, comments: resp.data.commentsSummary?.totalFirstLevelComments || 0, impressions: 0, reach: 0, clicks: 0, shares: 0, engagements: 0 };
  }

  private async fetchTikTokMetrics(postId: string, token: string) {
    const resp = await axios.post('https://open.tiktokapis.com/v2/video/query/', { filters: { video_ids: [postId] } }, { headers: { Authorization: `Bearer ${token}` } });
    const video = resp.data.data?.videos?.[0] || {};
    return { likes: video.like_count || 0, comments: video.comment_count || 0, shares: video.share_count || 0, impressions: video.view_count || 0, reach: 0, clicks: 0, engagements: (video.like_count || 0) + (video.comment_count || 0) + (video.share_count || 0) };
  }

  private async fetchYouTubeMetrics(videoId: string, token: string) {
    try {
      const resp = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        headers: { Authorization: `Bearer ${token}` },
        params: { part: 'statistics', id: videoId },
      });
      const s = resp.data.items?.[0]?.statistics || {};
      const likes = parseInt(s.likeCount ?? '0', 10);
      const comments = parseInt(s.commentCount ?? '0', 10);
      return {
        impressions: parseInt(s.viewCount ?? '0', 10),
        likes,
        comments,
        shares: 0,
        reach: 0,
        clicks: 0,
        engagements: likes + comments,
      };
    } catch {
      return {};
    }
  }

  private async fetchPinterestMetrics(pinId: string, token: string) {
    try {
      const resp = await axios.get(`https://api.pinterest.com/v5/pins/${pinId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { metric_types: 'IMPRESSION,SAVE,PIN_CLICK' },
      });
      const all = resp.data?.all || {};
      return {
        impressions: all.IMPRESSION ?? 0,
        engagements: (all.SAVE ?? 0) + (all.PIN_CLICK ?? 0),
        clicks: all.PIN_CLICK ?? 0,
        likes: 0,
        comments: 0,
        shares: all.SAVE ?? 0,
        reach: 0,
      };
    } catch {
      return {};
    }
  }

  private async fetchThreadsMetrics(mediaId: string, token: string) {
    try {
      const resp = await axios.get(`https://graph.threads.net/v1.0/${mediaId}/insights`, {
        params: { metric: 'views,likes,replies,reposts,quotes', access_token: token },
      });
      const data = resp.data.data || [];
      const get = (n: string) =>
        data.find((d: { name: string; values?: { value: number }[] }) => d.name === n)?.values?.[0]?.value || 0;
      const likes = get('likes');
      const comments = get('replies');
      const shares = get('reposts') + get('quotes');
      return {
        impressions: get('views'),
        likes,
        comments,
        shares,
        reach: 0,
        clicks: 0,
        engagements: likes + comments + shares,
      };
    } catch {
      return {};
    }
  }

  private async fetchGoogleBusinessMetrics(postId: string, token: string) {
    // GBP local-post insights API: requires location resource. postId is expected to be the
    // full localPosts/{id} resource path; if not, skip cleanly.
    try {
      const resp = await axios.post(
        `https://businessprofileperformance.googleapis.com/v1/${postId}:fetchMultiDailyMetricsTimeSeries`,
        { dailyMetrics: ['CALL_CLICKS', 'WEBSITE_CLICKS', 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS'] },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const series = resp.data.multiDailyMetricTimeSeries?.[0]?.dailyMetricTimeSeries ?? [];
      const sum = (name: string) =>
        series
          .find((s: any) => s.dailyMetric === name)
          ?.timeSeries?.datedValues?.reduce((a: number, b: any) => a + (b.value ?? 0), 0) ?? 0;
      return {
        impressions: sum('BUSINESS_IMPRESSIONS_DESKTOP_MAPS'),
        clicks: sum('WEBSITE_CLICKS') + sum('CALL_CLICKS'),
        engagements: sum('WEBSITE_CLICKS') + sum('CALL_CLICKS'),
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0,
      };
    } catch {
      return {};
    }
  }

  private async fetchWhatsAppMetrics(messageId: string, token: string) {
    // WhatsApp Cloud API does not expose per-message analytics; use message_status webhooks instead.
    // We return zero metrics so the row is created but is not misleading.
    void messageId;
    void token;
    return { impressions: 0, likes: 0, comments: 0, shares: 0, reach: 0, clicks: 0, engagements: 0 };
  }

  private decryptToken(encrypted: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format — expected GCM format (iv:authTag:ciphertext)');
    }
    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(cipherHex, 'hex', 'utf8') + decipher.final('utf8');
  }
}
