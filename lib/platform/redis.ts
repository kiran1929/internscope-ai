// Local memory cache fallback for local sandboxes
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

export class RedisCache {
  private static getRedisUrl(): string | undefined {
    return process.env.REDIS_URL;
  }

  static async get<T>(key: string): Promise<T | null> {
    const redisUrl = this.getRedisUrl();
    if (!redisUrl) {
      // Memory fallback
      const cached = memoryCache.get(key);
      if (!cached) return null;
      if (Date.now() > cached.expiresAt) {
        memoryCache.delete(key);
        return null;
      }
      return cached.value as T;
    }

    try {
      // Stub Redis wrapper client connection simulation
      return null;
    } catch {
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const redisUrl = this.getRedisUrl();
    if (!redisUrl) {
      // Memory fallback
      memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return;
    }

    try {
      // Stub Redis wrapper write
    } catch (e) {
      console.warn('Redis set error:', e);
    }
  }

  static async delete(key: string): Promise<void> {
    const redisUrl = this.getRedisUrl();
    if (!redisUrl) {
      memoryCache.delete(key);
      return;
    }
  }

  // Rate Limiting Throttling logic
  static async rateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
  }> {
    const bucketKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Retrieve active history log
    const history = (await this.get<number[]>(bucketKey)) || [];
    const validHistory = history.filter(ts => now - ts < windowMs);

    if (validHistory.length >= limit) {
      return { allowed: false, remaining: 0 };
    }

    validHistory.push(now);
    await this.set(bucketKey, validHistory, windowSeconds);

    return {
      allowed: true,
      remaining: limit - validHistory.length,
    };
  }
}
