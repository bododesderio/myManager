import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApprovalsRepository } from './approvals.repository';

type ApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'revision_requested' | 'rejected' | 'published';

const VALID_TRANSITIONS: Record<string, ApprovalStatus[]> = {
  draft: ['pending_approval'],
  pending_approval: ['approved', 'revision_requested', 'rejected'],
  revision_requested: ['pending_approval'],
  rejected: ['draft', 'pending_approval'],
  approved: ['published', 'draft'],
};

@Injectable()
export class ApprovalsService {
  constructor(private readonly repository: ApprovalsRepository) {}

  async listPending(workspaceId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [posts, total] = await this.repository.findPendingPosts(workspaceId, offset, limit);
    return {
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async submitForApproval(postId: string, userId: string) {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');
    this.validateTransition(post.status, 'pending_approval');

    await this.repository.updatePostStatus(postId, 'pending_approval');
    await this.repository.createApprovalEvent(postId, userId, 'submitted', null);

    return { message: 'Post submitted for approval', postId };
  }

  async approve(postId: string, approverId: string, comment?: string) {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');
    this.validateTransition(post.status, 'approved');

    await this.repository.updatePostStatus(postId, 'approved');
    await this.repository.createApprovalEvent(postId, approverId, 'approved', comment || null);

    return { message: 'Post approved', postId };
  }

  async requestRevision(postId: string, reviewerId: string, comment: string) {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');
    this.validateTransition(post.status, 'revision_requested');

    await this.repository.updatePostStatus(postId, 'revision_requested');
    await this.repository.createApprovalEvent(postId, reviewerId, 'revision_requested', comment);

    return { message: 'Revision requested', postId };
  }

  async reject(postId: string, reviewerId: string, comment: string) {
    const post = await this.repository.findPostById(postId);
    if (!post) throw new NotFoundException('Post not found');
    this.validateTransition(post.status, 'rejected');

    await this.repository.updatePostStatus(postId, 'rejected');
    await this.repository.createApprovalEvent(postId, reviewerId, 'rejected', comment);

    return { message: 'Post rejected', postId };
  }

  async addComment(postId: string, userId: string, data: {
    text: string;
    selectionStart?: number;
    selectionEnd?: number;
  }) {
    return this.repository.createPostComment(postId, userId, data);
  }

  async getComments(postId: string) {
    return this.repository.findPostComments(postId);
  }

  async getHistory(postId: string) {
    return this.repository.findApprovalEvents(postId);
  }

  private validateTransition(currentStatus: string, targetStatus: ApprovalStatus) {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${currentStatus}" to "${targetStatus}"`,
      );
    }
  }
}
