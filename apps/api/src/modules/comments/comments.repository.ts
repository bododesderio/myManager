import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByWorkspace(workspaceId: string, filters: { platform?: string; sentiment?: string }, offset: number, limit: number): Promise<[unknown[], number]> {
    const where: Record<string, unknown> = { workspace_id: workspaceId, is_hidden: false };
    if (filters.platform) where.platform = filters.platform;
    if (filters.sentiment) where.sentiment = filters.sentiment;
    // Some local environments have stale Prisma client types until `prisma generate` can run.
    const queryArgs = {
      where,
      skip: offset,
      take: limit,
      orderBy: { fetched_at: 'desc' },
      include: { assignments: { include: { assigned_to: { select: { id: true, name: true, avatar_url: true } } } } },
    } as any;
    const [comments, total] = await Promise.all([
      this.prisma.socialComment.findMany(queryArgs),
      this.prisma.socialComment.count({ where } as any),
    ]);
    return [comments, total];
  }

  async findById(id: string) {
    return this.prisma.socialComment.findUnique({ where: { id }, include: { assignments: true } });
  }

  async createReply(commentId: string, userId: string, text: string) {
    return this.prisma.socialComment.update({
      where: { id: commentId },
      data: { replied_at: new Date(), reply_text: text, reply_user_id: userId },
    } as any);
  }

  async hide(commentId: string) {
    return this.prisma.socialComment.update({
      where: { id: commentId },
      data: { is_hidden: true },
    } as any);
  }

  async assign(commentId: string, assigneeId: string, assignerId: string) {
    return this.prisma.commentAssignment.create({
      data: { social_comment_id: commentId, assigned_to_user_id: assigneeId, assigned_by_user_id: assignerId },
    });
  }

  async updateAssignmentStatus(assignmentId: string, status: string) {
    return this.prisma.commentAssignment.update({ where: { id: assignmentId }, data: { status } });
  }

  async getInboxStats(workspaceId: string) {
    const [total, pending, unassigned] = await Promise.all([
      this.prisma.socialComment.count({ where: { workspace_id: workspaceId } }),
      this.prisma.socialComment.count({ where: { workspace_id: workspaceId, replied_at: null } }),
      this.prisma.socialComment.count({ where: { workspace_id: workspaceId, assignments: { none: {} } } }),
    ]);
    return { total, pending, unassigned };
  }
}
