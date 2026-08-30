export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

import { validatePagination } from './security/pagination';
import { SECURITY_LIMITS } from './security/constants';

export function getPaginationOptions(params?: PaginationParams) {
  return validatePagination(params, SECURITY_LIMITS.DEFAULT_PAGE_MAX);
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export function buildSearchFilter(
  query?: string,
  fields: string[] = []
) {
  if (!query || fields.length === 0) return {};

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: query,
        mode: 'insensitive',
      },
    })),
  };
}
