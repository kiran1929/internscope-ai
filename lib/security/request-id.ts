import { randomUUID } from 'crypto';

export function createRequestId(prefix = 'req'): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export function getRequestIdFromHeaders(headers?: Headers | null): string | undefined {
  if (!headers) return undefined;
  return headers.get('x-request-id') || headers.get('x-correlation-id') || undefined;
}
