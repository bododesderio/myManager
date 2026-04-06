import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from '../prisma.service';
import { withDistributedLock } from '../common/utils/distributed-lock';

interface RawMention {
  platform: string;
  author_name: string;
  author_url?: string;
  text: string;
  url?: string;
}

@Injectable()
export class ListeningSyncCron {
  private readonly logger = new Logger(ListeningSyncCron.name);

  constructor(private readonly prisma: PrismaService) {}

  // Every 30 minutes
  @Cron('*/30 * * * *')
  async syncMentions() {
    await withDistributedLock('listening-sync', 25 * 60 * 1000, async () => {
      const terms = await this.prisma.listeningTerm.findMany({ where: { is_active: true } });
      this.logger.log(`Listening sync: ${terms.length} active terms`);

      for (const term of terms) {
        for (const platform of term.platforms) {
          try {
            const mentions = await this.fetchMentions(platform, term.term);
            for (const m of mentions) {
              await this.prisma.mentionEvent.create({
                data: {
                  listening_term_id: term.id,
                  platform: m.platform,
                  author_name: m.author_name,
                  author_url: m.author_url,
                  text: m.text,
                  url: m.url,
                  sentiment: this.classifySentiment(m.text),
                },
              });
            }
            // Update daily analytics counter
            if (mentions.length > 0) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              await this.prisma.mentionAnalyticsDaily.upsert({
                where: {
                  listening_term_id_date: { listening_term_id: term.id, date: today },
                },
                update: { mention_count: { increment: mentions.length } },
                create: { listening_term_id: term.id, date: today, mention_count: mentions.length },
              });
            }
          } catch (err) {
            this.logger.error(
              `Listening fetch failed term=${term.term} platform=${platform}: ${(err as Error).message}`,
            );
          }
        }
      }
    });
  }

  private async fetchMentions(platform: string, query: string): Promise<RawMention[]> {
    switch (platform) {
      case 'x':
      case 'twitter':
        return this.fetchTwitterMentions(query);
      default:
        // Other platforms require approved partner APIs or scraping; skip cleanly.
        return [];
    }
  }

  private async fetchTwitterMentions(query: string): Promise<RawMention[]> {
    const bearer = process.env.TWITTER_BEARER_TOKEN;
    if (!bearer) return [];
    try {
      const res = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        params: {
          query,
          max_results: 50,
          'tweet.fields': 'author_id,created_at',
          expansions: 'author_id',
          'user.fields': 'username,name',
        },
        headers: { Authorization: `Bearer ${bearer}` },
        timeout: 10000,
      });
      const tweets = res.data?.data ?? [];
      const users: Record<string, { username: string; name: string }> = {};
      for (const u of res.data?.includes?.users ?? []) {
        users[u.id] = { username: u.username, name: u.name };
      }
      return tweets.map((t: any): RawMention => {
        const u = users[t.author_id];
        return {
          platform: 'x',
          author_name: u?.name ?? u?.username ?? 'unknown',
          author_url: u?.username ? `https://x.com/${u.username}` : undefined,
          text: t.text,
          url: u?.username ? `https://x.com/${u.username}/status/${t.id}` : undefined,
        };
      });
    } catch (err) {
      this.logger.warn(`Twitter mention fetch failed: ${(err as Error).message}`);
      return [];
    }
  }

  private classifySentiment(text: string): string {
    const lower = text.toLowerCase();
    const positive = /\b(love|great|awesome|excellent|amazing|good|best|fantastic|wonderful|happy|thanks)\b/;
    const negative = /\b(hate|terrible|awful|bad|worst|broken|sucks|angry|disappointed|fail)\b/;
    if (positive.test(lower) && !negative.test(lower)) return 'positive';
    if (negative.test(lower) && !positive.test(lower)) return 'negative';
    return 'neutral';
  }
}
