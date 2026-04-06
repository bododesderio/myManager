import Redis from 'ioredis';

type LoggerLike = {
  error?: (message: string, error?: unknown) => void;
};

let sharedRedis: Redis | null = null;
let sharedRedisUrl: string | null = null;
let errorHandlerAttached = false;

export function getSharedRedis(
  redisUrl: string = process.env.REDIS_URL ?? 'redis://localhost:6379',
  logger?: LoggerLike,
): Redis {
  if (!sharedRedis || sharedRedisUrl !== redisUrl) {
    sharedRedis = new Redis(redisUrl);
    sharedRedisUrl = redisUrl;
    errorHandlerAttached = false;
  }

  if (logger && !errorHandlerAttached) {
    sharedRedis.on('error', (error) => {
      logger.error?.('Redis connection error', error);
    });
    errorHandlerAttached = true;
  }

  return sharedRedis;
}

export function getRedisConnectionOptions(
  redisUrl: string = process.env.REDIS_URL ?? 'redis://localhost:6379',
): { host: string; port: number; password?: string } {
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number.parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}
