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

  // Tenancy enforced in the WHERE clause (docs/audit-2026-07-20.md §C2).
  // Every approval transition reads through this first, so scoping it here
  // closes approve/reject/submit against another tenant's post in one place.
  async findPostById(id: string, workspaceId: string) {
    return this.prisma.post.findFirst({ where: { id, workspace_id: workspaceId } });
  }

  async updatePostStatus(id: string, status: string) {
    return this.prisma.post.update({ where: { id }, data: { status: status as PostStatus } });
  }

  async createApprovalEvent(postId: string, userId: string, action: string, comment: string | null) {
    return this.prisma.approvalEvent.create({
      data: { post_id: postId, user_id: userId, action, comment },
    });
  }

  /** Scoped through the parent post. */
  async findApprovalEvents(postId: string, workspaceId: string) {
    return this.prisma.approvalEvent.findMany({
      // Scoped through the parent post — approval history is review data.
      where: { post_id: postId, post: { workspace_id: workspaceId } },
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

  /** Scoped through the parent post. */
  async findPostComments(postId: string, workspaceId: string) {
    return this.prisma.postComment.findMany({
      // Scoped through the parent post — comments carry reviewer feedback.
      where: { post_id: postId, post: { workspace_id: workspaceId } },
      include: { post: { include: { user: { select: { id: true, name: true, avatar_url: true } } } } },
      orderBy: { created_at: 'asc' },
    });
  }
}
