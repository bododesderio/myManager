import { Job } from 'bullmq';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

export interface PublishJobData {
  postId: string;
  platform: string;
  socialAccountId: string;
  userId: string;
}

export interface PlatformPayload {
  caption: string;
  mediaUrls: string[];
  contentType: string;
  platformOptions: Record<string, any>;
  linkUrl?: string;
  firstCommentText?: string;
}

export interface PlatformResult {
  platformPostId: string;
  platformPostUrl: string;
  rawResponse: Record<string, unknown>;
}

export abstract class BasePublishingWorker {
  constructor(protected readonly prisma: PrismaService) {}

  abstract buildPayload(post: Record<string, any>, account: Record<string, any>): Promise<PlatformPayload>;
  abstract publish(payload: PlatformPayload, token: string): Promise<PlatformResult>;
  abstract fetchPostId(result: PlatformResult): string;

  async process(job: Job<PublishJobData>): Promise<void> {
    const { postId, platform, socialAccountId, userId } = job.data;

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        media: { include: { media_asset: true }, orderBy: { sort_order: 'asc' } },
      },
    });

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    const account = await this.prisma.socialAccount.findUnique({
      where: { id: socialAccountId },
    });

    if (!account) {
      throw new Error(`Social account ${socialAccountId} not found`);
    }

    const token = this.decryptToken(account.access_token_encrypted);

    await this.prisma.postPlatformResult.upsert({
      where: { post_id_platform: { post_id: postId, platform } },
      update: { status: 'PUBLISHING' },
      create: { post_id: postId, platform, status: 'PUBLISHING' },
    });

    try {
      const payload = await this.buildPayload(post, account);
      const result = await this.publish(payload, token);
      const platformPostId = this.fetchPostId(result);

      await this.prisma.postPlatformResult.update({
        where: { post_id_platform: { post_id: postId, platform } },
        data: {
          status: 'PUBLISHED',
          platform_post_id: platformPostId,
          platform_post_url: result.platformPostUrl,
          published_at: new Date(),
        },
      });

      await this.checkAllPlatformsPublished(postId);

      await this.prisma.auditLog.create({
        data: {
          action: 'post.published',
          user_id: userId,
          entity_type: 'post',
          entity_id: postId,
          metadata: { platform, platformPostId },
        },
      });
    } catch (error: unknown) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      const errStatus = (error as { status?: number }).status;
      const isClientError = typeof errStatus === 'number' && errStatus >= 400 && errStatus < 500;

      await this.prisma.postPlatformResult.update({
        where: { post_id_platform: { post_id: postId, platform } },
        data: {
          status: 'FAILED',
          error_message: errObj.message,
        },
      });

      if (isClientError) {
        job.discard();
      }

      throw error;
    }
  }

  protected decryptToken(encryptedToken: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const parts = encryptedToken.split(':');
    // Support legacy CBC format (iv:ciphertext) by falling back
    if (parts.length === 2) {
      const [ivHex, cipherHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
    // GCM format (iv:authTag:ciphertext)
    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async checkAllPlatformsPublished(postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) return;

    const results = await this.prisma.postPlatformResult.findMany({ where: { post_id: postId } });
    const allPublished = results.every((r) => r.status === 'PUBLISHED');
    const anyFailed = results.some((r) => r.status === 'FAILED');
    const allDone = results.every((r) => ['PUBLISHED', 'FAILED'].includes(r.status));

    if (allDone) {
      const status: PostStatus = allPublished ? 'PUBLISHED' : anyFailed ? 'PARTIALLY_PUBLISHED' : 'PUBLISHED';
      await this.prisma.post.update({
        where: { id: postId },
        data: { status, published_at: new Date() },
      });
    }
  }
}
