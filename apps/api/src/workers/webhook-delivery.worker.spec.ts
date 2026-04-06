import { WebhookDeliveryWorker } from './webhook-delivery.worker';

jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import axios from 'axios';

describe('WebhookDeliveryWorker', () => {
  let worker: WebhookDeliveryWorker;
  let prisma: Record<string, any>;

  const mockEndpoint = {
    id: 'ep_1',
    url: 'https://example.com/hook',
    secret: 'test-secret-key',
  };

  const mockDelivery = {
    id: 'del_1',
    event: 'post.published',
    payload: { event: 'post.published', data: { id: 'p1' } },
    endpoint: mockEndpoint,
  };

  beforeEach(() => {
    prisma = {
      webhookDelivery: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    worker = new WebhookDeliveryWorker(prisma as any);
    (axios.post as jest.Mock).mockReset();
  });

  function createJob(deliveryId: string, attemptsMade = 0, maxAttempts = 6) {
    return {
      data: { deliveryId },
      attemptsMade,
      opts: { attempts: maxAttempts },
    };
  }

  it('should deliver webhook and update status on success', async () => {
    prisma.webhookDelivery.findUnique.mockResolvedValue(mockDelivery);
    (axios.post as jest.Mock).mockResolvedValue({ status: 200, data: { ok: true } });

    await worker.process(createJob('del_1') as any);

    expect(axios.post).toHaveBeenCalledWith(
      'https://example.com/hook',
      mockDelivery.payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-mymanager-signature': expect.any(String),
          'x-mymanager-delivery-id': 'del_1',
          'x-mymanager-event': 'post.published',
        }),
        timeout: 30000,
      }),
    );
    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith({
      where: { id: 'del_1' },
      data: expect.objectContaining({
        response_status: 200,
        delivered_at: expect.any(Date),
      }),
    });
  });

  it('should retry on failure with exponential backoff', async () => {
    prisma.webhookDelivery.findUnique.mockResolvedValue(mockDelivery);
    const error = new Error('Connection refused');
    (error as any).response = { status: 502 };
    (axios.post as jest.Mock).mockRejectedValue(error);

    const job = createJob('del_1', 2, 6);

    await expect(worker.process(job as any)).rejects.toThrow('Connection refused');

    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith({
      where: { id: 'del_1' },
      data: expect.objectContaining({
        response_status: 502,
        response_body: 'Connection refused',
        attempts: { increment: 1 },
        next_retry_at: expect.any(Date),
      }),
    });

    // Verify exponential backoff: 2^2 = 4 minutes from now
    const updateCall = prisma.webhookDelivery.update.mock.calls[0][0];
    const retryAt = updateCall.data.next_retry_at as Date;
    const expectedMinDelay = 4 * 60 * 1000 - 5000; // 4 min minus tolerance
    expect(retryAt.getTime() - Date.now()).toBeGreaterThan(expectedMinDelay);
  });

  it('should mark as failed after max retries (no next_retry_at)', async () => {
    prisma.webhookDelivery.findUnique.mockResolvedValue(mockDelivery);
    const error = new Error('Timeout');
    (error as any).response = { status: 504 };
    (axios.post as jest.Mock).mockRejectedValue(error);

    // attemptsMade = 5, maxAttempts = 6 => 5 < 6-1 is false => no retry
    const job = createJob('del_1', 5, 6);

    await expect(worker.process(job as any)).rejects.toThrow('Timeout');

    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith({
      where: { id: 'del_1' },
      data: expect.objectContaining({
        next_retry_at: null,
      }),
    });
  });

  it('should skip processing when delivery not found', async () => {
    prisma.webhookDelivery.findUnique.mockResolvedValue(null);

    await worker.process(createJob('del_missing') as any);

    expect(axios.post).not.toHaveBeenCalled();
    expect(prisma.webhookDelivery.update).not.toHaveBeenCalled();
  });
});
