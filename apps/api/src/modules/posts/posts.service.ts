import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PostsRepository } from './posts.repository';

@Injectable()
export class PostsService {
  private readonly queueMap: Map<string, Queue>;

  constructor(
    private readonly repository: PostsRepository,
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

  async list(
    workspaceId: string,
    filters: { status?: string; platform?: string; projectId?: string; campaignId?: string },
    page: number,
    limit: number,
  ) {
    const offset = (page - 1) * limit;
    const [posts, total] = await this.repository.findByWorkspace(workspaceId, filters, offset, limit);
    return {
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(userId: string, data: {
    workspaceId: string;
    projectId?: string;
    caption: string;
    platforms: string[];
    contentType: string;
    mediaIds?: string[];
    scheduledAt?: string;
    linkUrl?: string;
    linkPreviewOverride?: Record<string, unknown>;
    firstCommentText?: string;
    platformOptions?: Record<string, unknown>;
    hashtagIds?: string[];
  }) {
    const status = data.scheduledAt ? 'SCHEDULED' : 'DRAFT';
    const post = await this.repository.create({
      workspace_id: data.workspaceId,
      project_id: data.projectId,
      user_id: userId,
      caption: data.caption,
      platforms: data.platforms,
      content_type: data.contentType,
      status,
      scheduled_at: data.scheduledAt ? new Date(data.scheduledAt) : null,
      link_url: data.linkUrl,
      link_preview_override: data.linkPreviewOverride,
      first_comment_text: data.firstCommentText,
      platform_options: data.platformOptions,
    });

    if (data.mediaIds?.length) {
      await this.repository.attachMedia(post.id, data.mediaIds);
    }

    if (data.hashtagIds?.length) {
      await this.repository.attachHashtags(post.id, data.hashtagIds);
    }

    await this.repository.createVersion(post.id, {
      caption: data.caption,
      platforms: data.platforms,
      mediaIds: data.mediaIds,
    });

    return post;
  }

  async getById(id: string) {
    const post = await this.repository.findById(id);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, data: Record<string, any>) {
    const post = await this.repository.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    if (['PUBLISHED', 'PUBLISHING'].includes(post.status)) {
      throw new BadRequestException('Cannot edit a published or publishing post');
    }

    const updated = await this.repository.update(id, data);

    await this.repository.createVersion(id, {
      caption: data.caption || post.caption,
      platforms: data.platforms || post.platforms,
      mediaIds: data.mediaIds,
    });

    return updated;
  }

  async delete(id: string) {
    await this.repository.softDelete(id);
    return { message: 'Post deleted' };
  }

  async publishNow(id: string, userId: string) {
    const post = await this.repository.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    await this.repository.update(id, { status: 'QUEUED' });

    for (const platform of post.platforms) {
      const socialAccount = await this.repository.findSocialAccountForPlatform(
        post.workspace_id,
        platform,
      );
      if (!socialAccount) {
        await this.repository.updatePlatformResult(id, platform, 'FAILED', null, `No connected ${platform} account`);
        continue;
      }

      const queue = this.queueMap.get(platform);
      if (queue) {
        await queue.add('publish', {
          postId: id,
          platform,
          socialAccountId: socialAccount.id,
          userId,
        }, {
          attempts: 5,
          backoff: { type: 'exponential', delay: 60000 },
          removeOnComplete: true,
        });
      }
    }

    return { message: 'Post queued for publishing', postId: id };
  }

  async schedule(id: string, scheduledAt: string) {
    const date = new Date(scheduledAt);
    if (date <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    return this.repository.update(id, {
      status: 'SCHEDULED',
      scheduled_at: date,
    });
  }

  async duplicate(id: string, userId: string) {
    const original = await this.repository.findById(id);
    if (!original) throw new NotFoundException('Post not found');

    return this.repository.create({
      workspace_id: original.workspace_id,
      project_id: original.project_id ?? undefined,
      user_id: userId,
      caption: original.caption,
      platforms: original.platforms,
      content_type: original.content_type,
      status: 'DRAFT',
      scheduled_at: null,
      link_url: original.link_url ?? undefined,
      link_preview_override: original.link_preview_override as Record<string, unknown> | undefined,
      first_comment_text: original.first_comment_text ?? undefined,
      platform_options: original.platform_options as Record<string, unknown> | undefined,
    });
  }

  async getVersionHistory(id: string) {
    return this.repository.findVersions(id);
  }

  async getPostAnalytics(id: string) {
    return this.repository.findAnalytics(id);
  }

  async getCalendarView(workspaceId: string, startDate: string, endDate: string) {
    return this.repository.findForCalendar(
      workspaceId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  async getFeed(workspaceId: string, cursor?: string, limit: number = 20) {
    return this.repository.findFeed(workspaceId, cursor, limit);
  }

  async bulkSchedule(userId: string, workspaceId: string, posts: Array<{ caption: string; platforms: string[]; contentType: string; scheduledAt?: string; mediaIds?: string[] }>) {
    const created = [];
    for (const postData of posts) {
      const post = await this.create(userId, {
        workspaceId,
        caption: postData.caption,
        platforms: postData.platforms,
        contentType: postData.contentType,
        scheduledAt: postData.scheduledAt,
        mediaIds: postData.mediaIds,
      });
      created.push(post);
    }
    return { created: created.length, posts: created };
  }

  async bulkDelete(postIds: string[]) {
    await this.repository.bulkSoftDelete(postIds);
    return { deleted: postIds.length };
  }
}
