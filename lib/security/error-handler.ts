/**
 * Centralized Error Sanitization Utility
 * Sanitizes errors returned to clients in production to prevent information disclosure (CVE-005).
 */

export function sanitizeError(error: unknown, fallbackMessage = 'An unexpected error occurred. Please try again later.'): string {
  // Always log full error server-side for observability
  console.error('[Internal Action Error]:', error);

  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // Production error sanitization
  if (error instanceof Error) {
    const msg = error.message;

    // Allow known safe user-facing validation and auth messages
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
    ];

    if (safePrefixes.some(prefix => msg.startsWith(prefix))) {
      // Ensure no raw SQL or sensitive tokens leak through
      if (!msg.includes('SELECT') && !msg.includes('prisma') && !msg.includes('Connection') && !msg.includes('ETIMEDOUT')) {
        return msg;
      }
    }
  }

  return fallbackMessage;
}
