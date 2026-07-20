import { NotFoundException } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';

/**
 * Approval workflow tenancy (docs/audit-2026-07-20.md §C2).
 *
 * `findPostById` took a bare post id, and every transition — submit, approve,
 * reject, request-revision — read through it. So the entire approval workflow
 * was operable against another tenant's post: approving content you cannot see,
 * in a workspace you do not belong to.
 *
 * Scoping that single read closes all four transitions, which is why these tests
 * assert the workspace id reaches the repository on each one.
 */
describe('ApprovalsService — workspace scoping', () => {
  const OWN_WS = 'ws_own';

  function createService(overrides: Record<string, jest.Mock> = {}) {
    const repository = {
      findPostById: jest.fn().mockResolvedValue(null),
      updatePostStatus: jest.fn().mockResolvedValue(undefined),
      createApprovalEvent: jest.fn().mockResolvedValue(undefined),
      findPostComments: jest.fn().mockResolvedValue([]),
      findApprovalEvents: jest.fn().mockResolvedValue([]),
      ...overrides,
    };
    return { service: new ApprovalsService(repository as any), repository };
  }

  const transitions: Array<[string, (s: ApprovalsService) => Promise<unknown>]> = [
    ['submitForApproval', (s) => s.submitForApproval('victim_post', 'u1', OWN_WS)],
    ['approve', (s) => s.approve('victim_post', 'u1', OWN_WS)],
    ['reject', (s) => s.reject('victim_post', 'u1', 'no', OWN_WS)],
    ['requestRevision', (s) => s.requestRevision('victim_post', 'u1', 'fix', OWN_WS)],
  ];

  it.each(transitions)(
    '%s refuses a post outside the caller\'s workspace',
    async (_name, call) => {
      // Scoped read returns null because the post belongs elsewhere.
      const { service, repository } = createService();

      await expect(call(service)).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.findPostById).toHaveBeenCalledWith('victim_post', OWN_WS);
      // Critically: no state transition and no audit event for a post we cannot see.
      expect(repository.updatePostStatus).not.toHaveBeenCalled();
      expect(repository.createApprovalEvent).not.toHaveBeenCalled();
    },
  );

  it('still allows a transition on a post the caller owns', async () => {
    const { service, repository } = createService({
      findPostById: jest.fn().mockResolvedValue({
        id: 'own_post',
        workspace_id: OWN_WS,
        status: 'draft',
      }),
    });

    await service.submitForApproval('own_post', 'u1', OWN_WS);

    expect(repository.updatePostStatus).toHaveBeenCalledWith('own_post', 'pending_approval');
  });

  it('scopes comment and history reads through the parent post', async () => {
    const { service, repository } = createService();

    await service.getComments('victim_post', OWN_WS);
    await service.getHistory('victim_post', OWN_WS);

    expect(repository.findPostComments).toHaveBeenCalledWith('victim_post', OWN_WS);
    expect(repository.findApprovalEvents).toHaveBeenCalledWith('victim_post', OWN_WS);
  });
});
