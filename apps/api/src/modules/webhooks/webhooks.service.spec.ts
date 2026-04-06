import { NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

// We need to mock global fetch for the deliverWebhook private method
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('WebhooksService', () => {
  let service: WebhooksService;
  let repository: Record<string, jest.Mock>;
  let auditService: Record<string, jest.Mock>;

  beforeEach(() => {
    repository = {
      findByWorkspace: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findActiveByWorkspaceAndEvent: jest.fn(),
      findDeliveries: jest.fn(),
      findDeliveryById: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      findSocialAccountsByPlatformUserIds: jest.fn(),
      upsertSocialComment: jest.fn(),
    };
    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    service = new WebhooksService(repository as any, auditService as any);
    mockFetch.mockReset();
  });

  describe('create', () => {
    it('should create endpoint with generated secret and log audit', async () => {
      const endpoint = { id: 'ep_1', workspace_id: 'ws_1', url: 'https://example.com/hook' };
      repository.create.mockResolvedValue(endpoint);

      const result = await service.create('user_1', {
        workspaceId: 'ws_1',
        url: 'https://example.com/hook',
        events: ['post.published'],
      });

      expect(result).toEqual(endpoint);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace_id: 'ws_1',
          url: 'https://example.com/hook',
          events: ['post.published'],
          is_active: true,
          secret: expect.any(String),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        'webhook_endpoint_created',
        expect.objectContaining({
          userId: 'user_1',
          workspaceId: 'ws_1',
          resourceId: 'ep_1',
        }),
      );
    });

    it('should use provided secret when supplied', async () => {
      repository.create.mockResolvedValue({ id: 'ep_2' });

      await service.create('user_1', {
        workspaceId: 'ws_1',
        url: 'https://example.com/hook',
        events: ['post.published'],
        secret: 'my-custom-secret',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ secret: 'my-custom-secret' }),
      );
    });
  });

  describe('dispatchEvent', () => {
    it('should find subscribed endpoints and create deliveries', async () => {
      const endpoint = { id: 'ep_1', url: 'https://example.com/hook', secret: 'sec' };
      repository.findActiveByWorkspaceAndEvent.mockResolvedValue([endpoint]);
      repository.createDelivery.mockResolvedValue({ id: 'del_1' });
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve('OK') });

      await service.dispatchEvent('ws_1', 'post.published', { postId: 'p1' });

      expect(repository.findActiveByWorkspaceAndEvent).toHaveBeenCalledWith('ws_1', 'post.published');
      expect(repository.createDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook_endpoint_id: 'ep_1',
          event: 'post.published',
          attempts: 0,
          max_attempts: 6,
        }),
      );
    });

    it('should skip when no active endpoints found', async () => {
      repository.findActiveByWorkspaceAndEvent.mockResolvedValue([]);

      await service.dispatchEvent('ws_1', 'post.published', { postId: 'p1' });

      expect(repository.createDelivery).not.toHaveBeenCalled();
    });
  });

  describe('retryDelivery', () => {
    it('should retry delivery for existing record', async () => {
      const delivery = {
        id: 'del_1',
        attempts: 2,
        max_attempts: 6,
        payload: { event: 'test', data: {} },
        endpoint: { id: 'ep_1', url: 'https://example.com/hook', secret: 'sec' },
      };
      repository.findDeliveryById.mockResolvedValue(delivery);
      repository.updateDelivery.mockResolvedValue({});
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve('OK') });

      const result = await service.retryDelivery('del_1');

      expect(result).toEqual(expect.objectContaining({ deliveryId: 'del_1' }));
      expect(repository.updateDelivery).toHaveBeenCalledWith('del_1', {
        next_retry_at: null,
        delivered_at: null,
      });
    });

    it('should throw NotFoundException for missing delivery', async () => {
      repository.findDeliveryById.mockResolvedValue(null);

      await expect(service.retryDelivery('del_missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendTest', () => {
    it('should create a test delivery and deliver it', async () => {
      const endpoint = { id: 'ep_1', url: 'https://example.com/hook', secret: 'sec' };
      repository.findById.mockResolvedValue(endpoint);
      repository.createDelivery.mockResolvedValue({ id: 'del_t1' });
      repository.updateDelivery.mockResolvedValue({});
      mockFetch.mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve('OK') });

      const result = await service.sendTest('ep_1');

      expect(result.deliveryId).toBe('del_t1');
      expect(repository.createDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook_endpoint_id: 'ep_1',
          event: 'test',
        }),
      );
    });

    it('should throw when endpoint not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.sendTest('ep_missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleIncomingSocialWebhook', () => {
    it('should store normalized comments for known accounts', async () => {
      repository.findSocialAccountsByPlatformUserIds.mockResolvedValue([
        { id: 'sa_1', platform_user_id: 'pu_1', workspace_id: 'ws_1' },
      ]);
      repository.upsertSocialComment.mockResolvedValue({});

      const result = await service.handleIncomingSocialWebhook('instagram', {
        platformUserId: 'pu_1',
        platformCommentId: 'pc_1',
        platformPostId: 'pp_1',
        authorName: 'User1',
        text: 'Nice post!',
        isReply: false,
      });

      expect(result.status).toBe('accepted');
      expect(result.stored).toBe(1);
      expect(repository.upsertSocialComment).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace_id: 'ws_1',
          platform: 'instagram',
          text: 'Nice post!',
        }),
      );
    });

    it('should skip comments from unknown accounts', async () => {
      repository.findSocialAccountsByPlatformUserIds.mockResolvedValue([]);

      const result = await service.handleIncomingSocialWebhook('instagram', {
        platformUserId: 'unknown',
        platformCommentId: 'pc_1',
        text: 'Hello',
      });

      expect(result.stored).toBe(0);
      expect(repository.upsertSocialComment).not.toHaveBeenCalled();
    });
  });
});
