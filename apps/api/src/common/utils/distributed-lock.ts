import { getSharedRedis } from '../redis/shared-redis';

export async function withDistributedLock(
  key: string,
  ttlMs: number,
  fn: () => Promise<void>,
): Promise<void> {
  const lockKey = `cron:lock:${key}`;
  const r = getSharedRedis();
  const acquired = await r.set(lockKey, '1', 'PX', ttlMs, 'NX');
  if (!acquired) return; // another instance has the lock
  try {
    await fn();
  } finally {
    await r.del(lockKey);
  }
}
