import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PublishingRepository } from './publishing.repository';

@Injectable()
export class PublishingService {
  private readonly queueMap: Map<string, Queue>;

  constructor(
    private readonly repository: PublishingRepository,
    @InjectQueue('publishing-facebook') private facebookQueue: Queue,
    @InjectQueue('publishing-instagram') private instagramQueue: Queue,
    @InjectQueue('publishing-x') private xQueue: Queue,
    @InjectQueue('publishing-linkedin') private linkedinQueue: Queue,
    @InjectQueue('publishing-tiktok') private tiktokQueue: Queue,
    @InjectQueue('publishing-google-business') private gbpQueue: Queue,
    @InjectQueue('publishing-pinterest') private pinterestQueue: Queue,
    @InjectQueue('publishing-youtube') private youtubeQueue: Queue,
    @InjectQueue('publishing-whatsapp') private whatsappQueue: Queue,
    @InjectQueue('publishing-threads') private threadsQueue: Queue,
  ) {
    this.queueMap = new Map([
      ['facebook', this.facebookQueue],
      ['instagram', this.instagramQueue],
      ['x', this.xQueue],
      ['linkedin', this.linkedinQueue],
      ['tiktok', this.tiktokQueue],
      ['google-business', this.gbpQueue],
      ['pinterest', this.pinterestQueue],
      ['youtube', this.youtubeQueue],
      ['whatsapp', this.whatsappQueue],
      ['threads', this.threadsQueue],
    ]);
  }

  async dispatchPost(postId: string, userId: string) {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    if (post.status === 'PUBLISHED') {
      throw new BadRequestException('Post is already published');
    }

    await this.repository.updatePostStatus(postId, 'queued');

    const dispatched: string[] = [];
    const errors: { platform: string; error: string }[] = [];

    for (const platform of post.platforms) {
      const account = await this.repository.findActiveSocialAccount(post.workspace_id, platform);
      if (!account) {
        errors.push({ platform, error: `No connected ${platform} account` });
        await this.repository.updatePlatformResult(postId, platform, 'failed', null, `No connected ${platform} account`);
        continue;
      }

      const queue = this.queueMap.get(platform);
      if (!queue) {
        errors.push({ platform, error: `Queue not configured for ${platform}` });
        continue;
      }

      const retryConfig = this.getRetryConfig(platform);
      await queue.add('publish', {
        postId,
        platform,
        socialAccountId: account.id,
        userId,
      }, retryConfig);

      dispatched.push(platform);
    }

    return { postId, dispatched, errors };
  }

  async retryPlatform(postId: string, platform: string) {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const account = await this.repository.findActiveSocialAccount(post.workspace_id, platform);
    if (!account) throw new BadRequestException(`No connected ${platform} account`);

    const queue = this.queueMap.get(platform);
    if (!queue) throw new BadRequestException(`Queue not configured for ${platform}`);

    await this.repository.updatePlatformResult(postId, platform, 'queued', null);

    await queue.add('publish', {
      postId,
      platform,
      socialAccountId: account.id,
    }, this.getRetryConfig(platform));

    return { message: `Retry queued for ${platform}` };
  }

  async getQueueStatus(_workspaceId: string) {
    const statuses: Record<string, unknown> = {};
    for (const [platform, queue] of this.queueMap) {
      const [waiting, active, delayed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getDelayedCount(),
        queue.getFailedCount(),
      ]);
      statuses[platform] = { waiting, active, delayed, failed };
    }
    return statuses;
  }

  async getPostPublishStatus(postId: string) {
    return this.repository.findPlatformResults(postId);
  }

  async cancelPost(postId: string) {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');

    if (!['queued', 'scheduled'].includes(post.status)) {
      throw new BadRequestException('Only queued or scheduled posts can be cancelled');
    }

    await this.repository.updatePostStatus(postId, 'draft');
    return { message: 'Post cancelled and returned to draft' };
  }

  async getPublishHistory(workspaceId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [results, total] = await this.repository.findPublishHistory(workspaceId, offset, limit);
    return {
      data: results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private getRetryConfig(_platform: string) {
    return {
      attempts: 5,
      backoff: { type: 'exponential' as const, delay: 60000 },
      removeOnComplete: true,
      removeOnFail: false,
    };
  }
}
