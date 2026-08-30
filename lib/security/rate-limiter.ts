/**
 * Rate Limiter Utility
 * Protects AI-intensive endpoints from API exhaustion and Denial of Service (HIGH-002).
 */

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale timestamps every 10 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter(ts => now - ts < 3600 * 1000);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
}

export const RATE_LIMIT_CONFIGS = {
  GITHUB_ANALYSIS: { maxRequests: 5, windowMs: 60 * 60 * 1000 },       // 5 per hour
  PORTFOLIO_ANALYSIS: { maxRequests: 5, windowMs: 60 * 60 * 1000 },    // 5 per hour
  RESUME_OPTIMIZATION: { maxRequests: 10, windowMs: 60 * 60 * 1000 },   // 10 per hour
  COVER_LETTER: { maxRequests: 10, windowMs: 60 * 60 * 1000 },          // 10 per hour
  INTERVIEW_PREP: { maxRequests: 20, windowMs: 60 * 60 * 1000 },        // 20 per hour
  SEARCH_QUERY: { maxRequests: 120, windowMs: 60 * 1000 },              // 120 per minute
} as const;

/**
 * Checks and consumes a rate limit token for a specific action and user/IP key.
 */
export function checkRateLimit(
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

  // Filter timestamps within the current sliding window
  record.timestamps = record.timestamps.filter(ts => ts > windowStart);

  if (record.timestamps.length >= config.maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetInMs = Math.max(0, oldestTimestamp + config.windowMs - now);
    return {
      allowed: false,
      remaining: 0,
      resetInMs,
    };
  }

  // Consume token
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - record.timestamps.length,
    resetInMs: config.windowMs,
  };
}

/**
 * Throws a formatted Error if rate limit is exceeded.
 */
export function enforceRateLimit(
  actionName: string,
  identifier: string,
  config: RateLimitConfig
): void {
  const key = `${actionName}:${identifier}`;
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    const minutes = Math.ceil(result.resetInMs / 60000);
    throw new Error(`Rate limit exceeded for ${actionName}. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`);
  }
}
