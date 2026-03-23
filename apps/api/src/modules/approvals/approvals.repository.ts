import { Injectable } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ApprovalsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findPendingPosts(workspaceId: string, offset: number, limit: number): Promise<[unknown[], number]> {
    const where = { workspace_id: workspaceId, status: 'PENDING_APPROVAL' as PostStatus };
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where, skip: offset, take: limit, orderBy: { updated_at: 'desc' },
        include: { user: { select: { id: true, name: true, avatar_url: true } }, media: { include: { media_asset: true }, take: 1 } },
      }),
      this.prisma.post.count({ where }),
    ]);
    return [posts, total];
  }

  async findPostById(id: string) {
    return this.prisma.post.findUnique({ where: { id } });
  }

  async updatePostStatus(id: string, status: string) {
    return this.prisma.post.update({ where: { id }, data: { status: status as PostStatus } });
  }

  async createApprovalEvent(postId: string, userId: string, action: string, comment: string | null) {
    return this.prisma.approvalEvent.create({
      data: { post_id: postId, user_id: userId, action, comment },
    });
  }

  async findApprovalEvents(postId: string) {
    return this.prisma.approvalEvent.findMany({
      where: { post_id: postId },
      include: { post: { include: { user: { select: { id: true, name: true, avatar_url: true } } } } },
      orderBy: { created_at: 'asc' },
    });
  }

  async createPostComment(postId: string, userId: string, data: {
    text: string;
    charStart?: number;
    charEnd?: number;
  }) {
    return this.prisma.postComment.create({
      data: { post_id: postId, user_id: userId, text: data.text, char_start: data.charStart, char_end: data.charEnd },
    });
  }

  async findPostComments(postId: string) {
    return this.prisma.postComment.findMany({
      where: { post_id: postId },
      include: { post: { include: { user: { select: { id: true, name: true, avatar_url: true } } } } },
      orderBy: { created_at: 'asc' },
    });
  }
}
