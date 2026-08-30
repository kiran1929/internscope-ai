import { describe, it, expect } from 'vitest';
import { validatePagination, validateSearchLimit } from '@/lib/security/pagination';

describe('pagination validation', () => {
  it('caps limit at server maximum', () => {
    const result = validatePagination({ page: 1, limit: 9999 }, 100);
    expect(result.limit).toBe(100);
  });

  it('uses safe defaults for invalid input', () => {
    const result = validatePagination({ page: -5, limit: NaN });
    expect(result.page).toBe(1);
    expect(result.limit).toBeGreaterThan(0);
  });

  it('caps search limit', () => {
    expect(validateSearchLimit(500, 50)).toBe(50);
    expect(validateSearchLimit(undefined, 50)).toBe(20);
  });
});
