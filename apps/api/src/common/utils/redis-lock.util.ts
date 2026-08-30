import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Acquires a short-lived Redis NX lock for multi-instance cron leadership.
 * Returns true if this process holds the lock.
 */
export async function acquireRedisLock(
  redis: Redis,
  key: string,
  ttlSeconds: number,
  token: string,
): Promise<boolean> {
  const result = await redis.set(key, token, 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}
