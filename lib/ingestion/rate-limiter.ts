/**
 * Token Bucket Rate Limiter for Ingestion Providers (HIGH-005)
 * Controls requests per second/hour per provider and respects HTTP rate headers.
 */
interface TokenBucketState {
  tokens: number;
  lastRefill: number;
  burstCapacity: number;
  refillPerSec: number;
}

const providerBuckets = new Map<string, TokenBucketState>();

// Default bucket limits per provider
const DEFAULT_CONFIGS: Record<string, { burst: number; perHour: number }> = {
  greenhouse: { burst: 20, perHour: 450 }, // Greenhouse quota ~500/hr
  lever: { burst: 30, perHour: 900 },      // Lever quota ~1000/hr
  ashby: { burst: 20, perHour: 500 },      // Ashby safe throughput
  default: { burst: 15, perHour: 300 },
};

function getOrCreateBucket(provider: string): TokenBucketState {
  const existing = providerBuckets.get(provider);
  if (existing) return existing;

  const cfg = DEFAULT_CONFIGS[provider] || DEFAULT_CONFIGS.default;
  const bucket: TokenBucketState = {
    tokens: cfg.burst,
    lastRefill: Date.now(),
    burstCapacity: cfg.burst,
    refillPerSec: cfg.perHour / 3600,
  };
  providerBuckets.set(provider, bucket);
  return bucket;
}

export class IngestionRateLimiter {
  /**
   * Waits for a token to become available before allowing an HTTP request.
   */
  static async acquireToken(provider: string, tokensRequired = 1): Promise<void> {
    const bucket = getOrCreateBucket(provider);
    const now = Date.now();
    const elapsedSec = (now - bucket.lastRefill) / 1000;

    // Refill tokens
    bucket.tokens = Math.min(bucket.burstCapacity, bucket.tokens + elapsedSec * bucket.refillPerSec);
    bucket.lastRefill = now;

    if (bucket.tokens >= tokensRequired) {
      bucket.tokens -= tokensRequired;
      return;
    }

    // Calculate required wait time
    const needed = tokensRequired - bucket.tokens;
    const waitMs = Math.ceil((needed / bucket.refillPerSec) * 1000);
    await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 5000)));

    bucket.tokens = Math.max(0, bucket.tokens - tokensRequired);
    bucket.lastRefill = Date.now();
  }

  /**
   * Inspects response headers and dynamically adjusts rate throttling if rate-limited.
   */
  static handleResponseHeaders(provider: string, headers: Headers): void {
    const retryAfter = headers.get('retry-after');
    if (retryAfter) {
      const waitSec = parseInt(retryAfter, 10);
      if (!isNaN(waitSec) && waitSec > 0) {
        const bucket = getOrCreateBucket(provider);
        bucket.tokens = 0; // Empty bucket
        console.warn(`[RateLimiter] Provider ${provider} returned Retry-After: ${waitSec}s`);
      }
    }

    const remaining = headers.get('x-ratelimit-remaining');
    if (remaining) {
      const remCount = parseInt(remaining, 10);
      if (!isNaN(remCount) && remCount < 5) {
        const bucket = getOrCreateBucket(provider);
        bucket.tokens = Math.min(bucket.tokens, remCount);
      }
    }
  }
}
