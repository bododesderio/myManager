import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';

@Injectable()
export class CommentsService {
  constructor(private readonly repository: CommentsRepository) {}

  async list(workspaceId: string, filters: { platform?: string; status?: string }, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [comments, total] = await this.repository.findByWorkspace(workspaceId, filters, offset, limit);
    return { data: comments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string, workspaceId: string) {
    const comment = await this.repository.findById(id, workspaceId);
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async reply(commentId: string, userId: string, workspaceId: string, text: string) {
    const comment = await this.repository.findById(commentId, workspaceId);
    if (!comment) throw new NotFoundException('Comment not found');
    const reply = await this.repository.createReply(commentId, userId, text);
    return reply;
  }

  async assign(commentId: string, assigneeId: string, assignerId: string) {
    return this.repository.assign(commentId, assigneeId, assignerId);
  }

  async updateStatus(assignmentId: string, workspaceId: string, status: string) {
    const updated = await this.repository.updateAssignmentStatus(assignmentId, workspaceId, status);
    // Indistinguishable from "not found" on purpose.
    if (!updated) throw new NotFoundException('Comment assignment not found');
    return { message: 'Assignment status updated' };
  }

  async hide(commentId: string, workspaceId: string) {
    const comment = await this.repository.findById(commentId, workspaceId);
    if (!comment) throw new NotFoundException('Comment not found');
    await this.repository.hide(commentId);
    return { message: 'Comment hidden' };
  }

  async getStats(workspaceId: string) {
    return this.repository.getInboxStats(workspaceId);
  }
}
