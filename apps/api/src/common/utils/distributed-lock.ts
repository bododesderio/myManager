import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }
  return redis;
}

export async function withDistributedLock(
  key: string,
  ttlMs: number,
  fn: () => Promise<void>,
): Promise<void> {
  const lockKey = `cron:lock:${key}`;
  const r = getRedis();
  const acquired = await r.set(lockKey, '1', 'PX', ttlMs, 'NX');
  if (!acquired) return; // another instance has the lock
  try {
    await fn();
  } finally {
    await r.del(lockKey);
  }
}
