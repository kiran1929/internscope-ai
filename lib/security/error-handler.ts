/**
 * Centralized Error Sanitization Utility
 * Sanitizes errors returned to clients in production to prevent information disclosure.
 */

import { AppError, isAppError } from './errors';
import { secureLog } from './logger';
import { createRequestId } from './request-id';

export function sanitizeError(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again later.',
  context?: { action?: string; requestId?: string }
): string {
  const requestId = context?.requestId ?? createRequestId('err');
  secureLog.error('Action error', { requestId, action: context?.action }, error);

  if (isAppError(error) && error.isPublic) {
    return error.message;
  }

  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  if (error instanceof Error) {
    const msg = error.message;

    const safePrefixes = [
      'Unauthorized',
      'Forbidden',
      'Invalid',
      'Please',
      'File',
      'No resume',
      'Rate limit',
      'Duplicate',
      'User not found',
      'A company with this name',
      'Opportunity',
      'Resume not found',
      'Cover letter not found',
      'Scraping is disabled',
      'Concurrency Lock',
      'DOCX',
      'PDF',
    ];

    if (safePrefixes.some((prefix) => msg.startsWith(prefix))) {
      if (
        !msg.includes('SELECT') &&
        !msg.includes('prisma') &&
        !msg.includes('Connection') &&
        !msg.includes('ETIMEDOUT') &&
        !msg.includes('/var/') &&
        !msg.includes('storage/')
      ) {
        return msg;
      }
    }
  }

  return fallbackMessage;
}

export function toPublicError(error: unknown, fallbackMessage?: string) {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: sanitizeError(error, fallbackMessage),
      statusCode: error.statusCode,
    };
  }

  return {
    code: 'INTERNAL_ERROR' as const,
    message: sanitizeError(error, fallbackMessage),
    statusCode: 500,
  };
}

export function actionError(error: unknown, fallbackMessage: string, action?: string): string {
  return sanitizeError(error, fallbackMessage, { action });
}
