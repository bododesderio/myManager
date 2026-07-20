import { BasePublishingWorker, PlatformPayload, PlatformResult } from './base.worker';

/**
 * Orchestration tests for the publishing pipeline.
 *
 * All ten platform workers inherit process(), so this is the shared blast
 * radius: a bug here posts to (or fails to post to) every connected account on
 * every platform. It had no tests at all
 * (docs/audit-2026-07-20.md — 8 of 10 platform workers uncovered).
 *
 * The idempotency case is the one that matters most. Jobs run with attempts: 5,
 * so a worker that crashes between a successful platform call and the PUBLISHED
 * write will retry — and without the guard, post to a real customer account
 * again. Up to five times.
 */

const KEY = 'a'.repeat(64);

/** Minimal concrete worker; the platform-specific parts are stubbed. */
class TestWorker extends BasePublishingWorker {
  publishCalls = 0;
  publishImpl: () => Promise<PlatformResult> = async () => ({
    platformPostId: 'ext_1',
    platformPostUrl: 'https://example.test/p/ext_1',
    rawResponse: {},
  });

  async buildPayload(): Promise<PlatformPayload> {
    return { caption: 'hi', mediaUrls: [], contentType: 'text', platformOptions: {} };
  }
  async publish(): Promise<PlatformResult> {
    this.publishCalls += 1;
    return this.publishImpl();
  }
  fetchPostId(result: PlatformResult): string {
    return result.platformPostId;
  }
}

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    postPlatformResult: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    post: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'post_1',
        workspace_id: 'ws_1',
        platforms: ['x'],
        caption: 'hello',
        media: [],
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    socialAccount: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'sa_1',
        platform_id: 'x',
        access_token_encrypted: 'iv:tag:cipher',
      }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    ...overrides,
  };
}

const job = (over: Record<string, any> = {}) => ({
  data: { postId: 'post_1', platform: 'x', socialAccountId: 'sa_1', userId: 'user_1' },
  discard: jest.fn(),
  ...over,
});

describe('BasePublishingWorker.process', () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = KEY;
  });
  afterEach(() => {
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
  });

  describe('idempotency — the duplicate-post guard', () => {
    it('does NOT call the platform when this platform is already PUBLISHED', async () => {
      const prisma = makePrisma();
      prisma.postPlatformResult.findUnique.mockResolvedValue({
        status: 'PUBLISHED',
        platform_post_id: 'ext_existing',
      });
      const worker = new TestWorker(prisma as any);

      await worker.process(job() as any);

      // The whole point: a BullMQ retry after a successful publish must not
      // post to the customer's account a second time.
      expect(worker.publishCalls).toBe(0);
      expect(prisma.postPlatformResult.upsert).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('checks the guard BEFORE loading the post or decrypting the token', async () => {
      const prisma = makePrisma();
      prisma.postPlatformResult.findUnique.mockResolvedValue({ status: 'PUBLISHED' });
      const worker = new TestWorker(prisma as any);

      await worker.process(job() as any);

      // Decryption would throw on the fake token; reaching it at all means the
      // guard ran too late.
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
      expect(prisma.socialAccount.findUnique).not.toHaveBeenCalled();
    });

    it.each(['PENDING', 'PUBLISHING', 'FAILED'])(
      'DOES publish when the existing status is %s',
      async (status) => {
        const prisma = makePrisma();
        prisma.postPlatformResult.findUnique.mockResolvedValue({ status });
        const worker = new TestWorker(prisma as any);
        jest.spyOn(worker as any, 'decryptToken').mockReturnValue('plain-token');

        await worker.process(job() as any);

        // A failed or in-flight attempt must remain retryable.
        expect(worker.publishCalls).toBe(1);
      },
    );
  });

  describe('happy path', () => {
    it('marks PUBLISHING, then PUBLISHED with the platform id and url', async () => {
      const prisma = makePrisma();
      const worker = new TestWorker(prisma as any);
      jest.spyOn(worker as any, 'decryptToken').mockReturnValue('plain-token');

      await worker.process(job() as any);

      expect(prisma.postPlatformResult.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { status: 'PUBLISHING' } }),
      );
      expect(prisma.postPlatformResult.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PUBLISHED',
            platform_post_id: 'ext_1',
            platform_post_url: 'https://example.test/p/ext_1',
          }),
        }),
      );
    });

    it('writes an audit entry naming the platform and external id', async () => {
      const prisma = makePrisma();
      const worker = new TestWorker(prisma as any);
      jest.spyOn(worker as any, 'decryptToken').mockReturnValue('plain-token');

      await worker.process(job() as any);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'post.published',
            entity_id: 'post_1',
            metadata: { platform: 'x', platformPostId: 'ext_1' },
          }),
        }),
      );
    });
  });

  describe('failure handling', () => {
    it('records FAILED with the error message and rethrows so BullMQ retries', async () => {
      const prisma = makePrisma();
      const worker = new TestWorker(prisma as any);
      jest.spyOn(worker as any, 'decryptToken').mockReturnValue('plain-token');
      worker.publishImpl = async () => {
        throw new Error('platform exploded');
      };

      const j = job();
      await expect(worker.process(j as any)).rejects.toThrow('platform exploded');

      expect(prisma.postPlatformResult.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED', error_message: 'platform exploded' }),
        }),
      );
    });

    it('discards the job on a 4xx — retrying a rejected payload just burns quota', async () => {
      const prisma = makePrisma();
      const worker = new TestWorker(prisma as any);
      jest.spyOn(worker as any, 'decryptToken').mockReturnValue('plain-token');
      worker.publishImpl = async () => {
        const err: any = new Error('caption too long');
        err.status = 400;
        throw err;
      };

      const j = job();
      await expect(worker.process(j as any)).rejects.toThrow('caption too long');
      expect(j.discard).toHaveBeenCalled();
    });

    it('does NOT discard on a 5xx — the platform may recover', async () => {
      const prisma = makePrisma();
      const worker = new TestWorker(prisma as any);
      jest.spyOn(worker as any, 'decryptToken').mockReturnValue('plain-token');
      worker.publishImpl = async () => {
        const err: any = new Error('bad gateway');
        err.status = 502;
        throw err;
      };

      const j = job();
      await expect(worker.process(j as any)).rejects.toThrow('bad gateway');
      expect(j.discard).not.toHaveBeenCalled();
    });

    it('does not discard when the error carries no status (network failure)', async () => {
      const prisma = makePrisma();
      const worker = new TestWorker(prisma as any);
      jest.spyOn(worker as any, 'decryptToken').mockReturnValue('plain-token');
      worker.publishImpl = async () => {
        throw new Error('ECONNRESET');
      };

      const j = job();
      await expect(worker.process(j as any)).rejects.toThrow('ECONNRESET');
      expect(j.discard).not.toHaveBeenCalled();
    });
  });

  describe('preconditions', () => {
    it('throws when the post no longer exists', async () => {
      const prisma = makePrisma();
      prisma.post.findUnique.mockResolvedValue(null);
      const worker = new TestWorker(prisma as any);

      await expect(worker.process(job() as any)).rejects.toThrow(/Post .* not found/);
      expect(worker.publishCalls).toBe(0);
    });

    it('throws when the social account was disconnected mid-flight', async () => {
      const prisma = makePrisma();
      prisma.socialAccount.findUnique.mockResolvedValue(null);
      const worker = new TestWorker(prisma as any);

      await expect(worker.process(job() as any)).rejects.toThrow(/Social account .* not found/);
      expect(worker.publishCalls).toBe(0);
    });
  });
});
