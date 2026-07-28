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

export function getPaginationOptions(params?: PaginationParams) {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, Math.min(100, params?.limit || 10)); // Cap limit at 100
  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
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
