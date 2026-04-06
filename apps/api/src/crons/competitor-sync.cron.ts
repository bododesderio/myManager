import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

interface PublicMetrics {
  followers: number;
  following: number;
  postCount: number;
  avgEngagement: number;
  source: string;
  error?: string;
}

@Injectable()
export class CompetitorSyncCron {
  private readonly logger = new Logger(CompetitorSyncCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 4 * * *') // 4:00 AM daily
  async syncCompetitorMetrics() {
    await withDistributedLock('competitor-sync', 23 * 60 * 60 * 1000, async () => {
      const profiles = await this.prisma.competitorProfile.findMany();
      this.logger.log(`Syncing ${profiles.length} competitor profiles`);

      for (const profile of profiles) {
        try {
          const metrics = await this.fetchPublicMetrics(profile.platform, profile.username);

          // Skip snapshot creation if the fetch failed completely (no real data).
          if (metrics.error && metrics.followers === 0 && metrics.postCount === 0) {
            this.logger.warn(
              `Skipping snapshot for ${profile.platform}/${profile.username}: ${metrics.error}`,
            );
            continue;
          }

          await this.prisma.competitorSnapshot.create({
            data: {
              competitor_profile_id: profile.id,
              date: new Date(),
              follower_count: metrics.followers,
              post_count: metrics.postCount,
              avg_engagement_rate: metrics.avgEngagement,
              metadata: metrics as any,
            },
          });
        } catch (err) {
          this.logger.error(
            `Failed to sync ${profile.platform}/${profile.username}: ${(err as Error).message}`,
          );
        }
      }
    });
  }

  private async fetchPublicMetrics(platform: string, username: string): Promise<PublicMetrics> {
    const empty = (source: string, error: string): PublicMetrics => ({
      followers: 0,
      following: 0,
      postCount: 0,
      avgEngagement: 0,
      source,
      error,
    });

    switch (platform) {
      case 'youtube':
        return this.fetchYouTube(username);
      case 'x':
      case 'twitter':
        return this.fetchTwitter(username);
      case 'instagram':
      case 'facebook':
      case 'tiktok':
      case 'linkedin':
      case 'pinterest':
      case 'threads':
      case 'whatsapp':
      case 'google-business':
        return empty(platform, `${platform} public metrics fetch not implemented`);
      default:
        return empty(platform, `unknown platform: ${platform}`);
    }
  }

  private async fetchYouTube(handleOrId: string): Promise<PublicMetrics> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return { followers: 0, following: 0, postCount: 0, avgEngagement: 0, source: 'youtube', error: 'YOUTUBE_API_KEY not set' };
    }
    try {
      // Support either @handle or channel ID
      const param = handleOrId.startsWith('UC') ? `id=${handleOrId}` : `forHandle=${encodeURIComponent(handleOrId.replace(/^@/, ''))}`;
      const res = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&${param}&key=${apiKey}`,
        { timeout: 10000 },
      );
      const stats = res.data?.items?.[0]?.statistics;
      if (!stats) {
        return { followers: 0, following: 0, postCount: 0, avgEngagement: 0, source: 'youtube', error: 'channel not found' };
      }
      const followers = parseInt(stats.subscriberCount ?? '0', 10);
      const postCount = parseInt(stats.videoCount ?? '0', 10);
      const views = parseInt(stats.viewCount ?? '0', 10);
      const avgEngagement = postCount > 0 ? views / postCount : 0;
      return { followers, following: 0, postCount, avgEngagement, source: 'youtube' };
    } catch (err) {
      return {
        followers: 0,
        following: 0,
        postCount: 0,
        avgEngagement: 0,
        source: 'youtube',
        error: (err as Error).message,
      };
    }
  }

  private async fetchTwitter(username: string): Promise<PublicMetrics> {
    const bearer = process.env.TWITTER_BEARER_TOKEN;
    if (!bearer) {
      return { followers: 0, following: 0, postCount: 0, avgEngagement: 0, source: 'x', error: 'TWITTER_BEARER_TOKEN not set' };
    }
    try {
      const res = await axios.get(
        `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username.replace(/^@/, ''))}?user.fields=public_metrics`,
        {
          headers: { Authorization: `Bearer ${bearer}` },
          timeout: 10000,
        },
      );
      const m = res.data?.data?.public_metrics;
      if (!m) {
        return { followers: 0, following: 0, postCount: 0, avgEngagement: 0, source: 'x', error: 'user not found' };
      }
      return {
        followers: m.followers_count ?? 0,
        following: m.following_count ?? 0,
        postCount: m.tweet_count ?? 0,
        avgEngagement: 0,
        source: 'x',
      };
    } catch (err) {
      return {
        followers: 0,
        following: 0,
        postCount: 0,
        avgEngagement: 0,
        source: 'x',
        error: (err as Error).message,
      };
    }
  }
}
