import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/security/rate-limiter';

describe('rate limiter', () => {
  it('allows requests under the limit', async () => {
    const config = { maxRequests: 3, windowMs: 60_000 };
    const key = `test-${Date.now()}-allow`;
    const r1 = await checkRateLimit(key, config);
    const r2 = await checkRateLimit(key, config);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it('blocks requests over the limit', async () => {
    const config = { maxRequests: 2, windowMs: 60_000 };
    const key = `test-${Date.now()}-block`;
    await checkRateLimit(key, config);
    await checkRateLimit(key, config);
    const r3 = await checkRateLimit(key, config);
    expect(r3.allowed).toBe(false);
  });
});
