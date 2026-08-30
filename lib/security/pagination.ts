import { SECURITY_LIMITS } from './constants';

export interface ValidatedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export function validatePagination(
  params?: { page?: number; limit?: number },
  maxLimit: number = SECURITY_LIMITS.DEFAULT_PAGE_MAX
): ValidatedPagination {
  const page = Math.max(1, Math.floor(params?.page ?? 1));
  const requested = Math.floor(params?.limit ?? SECURITY_LIMITS.DEFAULT_PAGE_SIZE);
  const limit = Math.max(1, Math.min(maxLimit, Number.isFinite(requested) ? requested : SECURITY_LIMITS.DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

export function validateSearchLimit(limit?: number, max: number = SECURITY_LIMITS.SEARCH_MAX_RESULTS): number {
  const requested = Math.floor(limit ?? SECURITY_LIMITS.SEARCH_DEFAULT_LIMIT);
  if (!Number.isFinite(requested) || requested < 1) {
    return SECURITY_LIMITS.SEARCH_DEFAULT_LIMIT;
  }
  return Math.min(max, requested);
}

export function validateSearchOffset(offset?: number): number {
  const requested = Math.floor(offset ?? 0);
  if (!Number.isFinite(requested) || requested < 0) {
    return 0;
  }
  return requested;
}
