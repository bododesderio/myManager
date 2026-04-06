import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PublishingService } from './publishing.service';

describe('PublishingService', () => {
  function createQueue() {
    return {
      add: jest.fn().mockResolvedValue(undefined),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
    };
  }

  function createService() {
    const repository = {
      findPostById: jest.fn(),
      updatePostStatus: jest.fn().mockResolvedValue(undefined),
      findActiveSocialAccount: jest.fn(),
      findActiveSocialAccounts: jest.fn(),
      updatePlatformResult: jest.fn().mockResolvedValue(undefined),
      findPlatformResults: jest.fn(),
      findPublishHistory: jest.fn(),
    };

    const facebookQueue = createQueue();
    const instagramQueue = createQueue();
    const xQueue = createQueue();
    const linkedinQueue = createQueue();
    const tiktokQueue = createQueue();
    const gbpQueue = createQueue();
    const pinterestQueue = createQueue();
    const youtubeQueue = createQueue();
    const whatsappQueue = createQueue();
    const threadsQueue = createQueue();

    const service = new PublishingService(
      repository as unknown as ConstructorParameters<typeof PublishingService>[0],
      facebookQueue as any,
      instagramQueue as any,
      xQueue as any,
      linkedinQueue as any,
      tiktokQueue as any,
      gbpQueue as any,
      pinterestQueue as any,
      youtubeQueue as any,
      whatsappQueue as any,
      threadsQueue as any,
    );

    return {
      service,
      repository,
      queues: { facebookQueue, linkedinQueue },
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queues publish jobs for connected accounts and records missing-account failures', async () => {
    const { service, repository, queues } = createService();
    repository.findPostById.mockResolvedValue({
      id: 'post_1',
      status: 'DRAFT',
      workspace_id: 'workspace_1',
      platforms: ['facebook', 'linkedin'],
    });
    repository.findActiveSocialAccounts.mockResolvedValue([
      { id: 'acct_1', platform_id: 'facebook' },
    ]);

    const result = await service.dispatchPost('post_1', 'user_1');

    expect(repository.updatePostStatus).toHaveBeenCalledWith('post_1', 'queued');
    expect(queues.facebookQueue.add).toHaveBeenCalledWith(
      'publish',
      expect.objectContaining({
        postId: 'post_1',
        platform: 'facebook',
        socialAccountId: 'acct_1',
        userId: 'user_1',
      }),
      expect.any(Object),
    );
    expect(repository.updatePlatformResult).toHaveBeenCalledWith(
      'post_1',
      'linkedin',
      'failed',
      null,
      'No connected linkedin account',
    );
    expect(result).toEqual({
      postId: 'post_1',
      dispatched: ['facebook'],
      errors: [{ platform: 'linkedin', error: 'No connected linkedin account' }],
    });
  });

  it('rejects publishing a post that is already published', async () => {
    const { service, repository } = createService();
    repository.findPostById.mockResolvedValue({
      id: 'post_1',
      status: 'PUBLISHED',
      workspace_id: 'workspace_1',
      platforms: ['facebook'],
    });

    await expect(service.dispatchPost('post_1', 'user_1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects publishing a missing post', async () => {
    const { service, repository } = createService();
    repository.findPostById.mockResolvedValue(null);

    await expect(service.dispatchPost('missing', 'user_1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
