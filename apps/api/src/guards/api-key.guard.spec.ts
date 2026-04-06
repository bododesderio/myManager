import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('../common/redis/shared-redis', () => ({
  getSharedRedis: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { getSharedRedis } from '../common/redis/shared-redis';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let prisma: Record<string, any>;
  let configService: Record<string, any>;
  let redisMock: Record<string, jest.Mock>;

  beforeEach(() => {
    redisMock = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    };
    (getSharedRedis as jest.Mock).mockReturnValue(redisMock);

    prisma = {
      apiKey: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    configService = {
      get: jest.fn().mockReturnValue('redis://localhost:6379'),
    };

    guard = new ApiKeyGuard(
      prisma as any,
      configService as any,
    );
  });

  function createContext(authHeader?: string) {
    const request: Record<string, any> = { headers: {} };
    if (authHeader !== undefined) {
      request.headers['authorization'] = authHeader;
    }
    const response = { setHeader: jest.fn() };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
      request,
      response,
    };
  }

  describe('canActivate', () => {
    it('should reject requests without Authorization header', async () => {
      const ctx = createContext();
      await expect(guard.canActivate(ctx as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject tokens without mm_ prefix', async () => {
      const ctx = createContext('Bearer sk_invalidprefix');
      await expect(guard.canActivate(ctx as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject invalid API keys (no matching candidates)', async () => {
      prisma.apiKey.findMany.mockResolvedValue([]);
      const ctx = createContext('Bearer mm_testapikey123');
      await expect(guard.canActivate(ctx as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject when bcrypt compare returns false', async () => {
      prisma.apiKey.findMany.mockResolvedValue([
        { id: 'key_1', key_prefix: 'mm_testapikey123'.substring(0, 10), key_hash: 'hashed', workspace_id: 'ws_1', is_active: true },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const ctx = createContext('Bearer mm_testapikey123');
      await expect(guard.canActivate(ctx as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should accept valid API keys and set request properties', async () => {
      const candidate = {
        id: 'key_1',
        key_prefix: 'mm_testapi',
        key_hash: 'hashed',
        workspace_id: 'ws_1',
        is_active: true,
        workspace: { id: 'ws_1' },
      };
      prisma.apiKey.findMany.mockResolvedValue([candidate]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const ctx = createContext('Bearer mm_testapikey123');
      const result = await guard.canActivate(ctx as any);

      expect(result).toBe(true);
      expect(ctx.request.apiKey).toEqual(candidate);
      expect(ctx.request.workspaceId).toBe('ws_1');
      expect(prisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'key_1' } }),
      );
    });

    it('should enforce rate limits (reject when over 1000)', async () => {
      redisMock.incr.mockResolvedValue(1001);
      const candidate = {
        id: 'key_1',
        key_prefix: 'mm_testapi',
        key_hash: 'hashed',
        workspace_id: 'ws_1',
        is_active: true,
        workspace: { id: 'ws_1' },
      };
      prisma.apiKey.findMany.mockResolvedValue([candidate]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const ctx = createContext('Bearer mm_testapikey123');
      await expect(guard.canActivate(ctx as any)).rejects.toThrow(
        'API rate limit exceeded',
      );
    });

    it('should set rate limit headers on successful response', async () => {
      redisMock.incr.mockResolvedValue(50);
      const candidate = {
        id: 'key_1',
        key_prefix: 'mm_testapi',
        key_hash: 'hashed',
        workspace_id: 'ws_1',
        is_active: true,
        workspace: { id: 'ws_1' },
      };
      prisma.apiKey.findMany.mockResolvedValue([candidate]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const ctx = createContext('Bearer mm_testapikey123');
      await guard.canActivate(ctx as any);

      expect(ctx.response.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 1000);
      expect(ctx.response.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 950);
      expect(ctx.response.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number),
      );
    });

    it('should set expire on redis key when incr returns 1 (first request)', async () => {
      redisMock.incr.mockResolvedValue(1);
      prisma.apiKey.findMany.mockResolvedValue([]);

      const ctx = createContext('Bearer mm_testapikey123');
      await expect(guard.canActivate(ctx as any)).rejects.toThrow();

      expect(redisMock.expire).toHaveBeenCalledWith(expect.any(String), 3600);
    });
  });
});
