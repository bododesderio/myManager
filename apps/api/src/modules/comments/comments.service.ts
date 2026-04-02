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

  async getById(id: string) {
    const comment = await this.repository.findById(id);
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async reply(commentId: string, userId: string, text: string) {
    const comment = await this.repository.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    const reply = await this.repository.createReply(commentId, userId, text);
    return reply;
  }

  async assign(commentId: string, assigneeId: string, assignerId: string) {
    return this.repository.assign(commentId, assigneeId, assignerId);
  }

  async updateStatus(assignmentId: string, status: string) {
    return this.repository.updateAssignmentStatus(assignmentId, status);
  }

  async hide(commentId: string) {
    const comment = await this.repository.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    await this.repository.hide(commentId);
    return { message: 'Comment hidden' };
  }

  async getStats(workspaceId: string) {
    return this.repository.getInboxStats(workspaceId);
  }
}
