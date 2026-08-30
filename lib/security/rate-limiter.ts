/**
 * Rate Limiter Utility
 * Uses Redis-backed sliding window when REDIS_URL is configured, otherwise in-memory fallback.
 */

import { RedisCache } from '@/lib/platform/redis';
import { AppError } from './errors';

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600 * 1000);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMIT_CONFIGS = {
  GITHUB_ANALYSIS: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  PORTFOLIO_ANALYSIS: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  RESUME_OPTIMIZATION: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  COVER_LETTER: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  RESUME_UPLOAD: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  INTERVIEW_PREP: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  SEARCH_QUERY: { maxRequests: 120, windowMs: 60 * 1000 },
} as const;

function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= config.maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetInMs = Math.max(0, oldestTimestamp + config.windowMs - now);
    return { allowed: false, remaining: 0, resetInMs };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - record.timestamps.length,
    resetInMs: config.windowMs,
  };
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetInMs: number }> {
  if (process.env.REDIS_URL) {
    const windowSeconds = Math.ceil(config.windowMs / 1000);
    const redisResult = await RedisCache.rateLimit(key, config.maxRequests, windowSeconds);
    if (!redisResult.allowed) {
      return { allowed: false, remaining: 0, resetInMs: config.windowMs };
    }
    return { allowed: true, remaining: redisResult.remaining, resetInMs: config.windowMs };
  }

  return checkRateLimitMemory(key, config);
}

export async function enforceRateLimit(
  actionName: string,
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const key = `${actionName}:${identifier}`;
  const result = await checkRateLimit(key, config);

  if (!result.allowed) {
    const minutes = Math.ceil(result.resetInMs / 60000);
    throw new AppError(
      'RATE_LIMITED',
      `Rate limit exceeded for ${actionName}. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`,
      { isPublic: true, statusCode: 429 }
    );
  }
}

/** @deprecated Use async enforceRateLimit */
export function enforceRateLimitSync(
  actionName: string,
  identifier: string,
  config: RateLimitConfig
): void {
  const result = checkRateLimitMemory(`${actionName}:${identifier}`, config);
  if (!result.allowed) {
    const minutes = Math.ceil(result.resetInMs / 60000);
    throw new Error(`Rate limit exceeded for ${actionName}. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`);
  }
}
