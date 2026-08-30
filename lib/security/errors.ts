export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'PROCESSING_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly isPublic: boolean;
  readonly cause?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { statusCode?: number; isPublic?: boolean; cause?: unknown }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = options?.statusCode ?? AppError.defaultStatus(code);
    this.isPublic = options?.isPublic ?? AppError.defaultPublic(code);
    this.cause = options?.cause;
  }

  private static defaultStatus(code: ErrorCode): number {
    switch (code) {
      case 'UNAUTHORIZED':
        return 401;
      case 'FORBIDDEN':
        return 403;
      case 'NOT_FOUND':
        return 404;
      case 'VALIDATION_ERROR':
        return 400;
      case 'RATE_LIMITED':
        return 429;
      case 'CONFLICT':
        return 409;
      default:
        return 500;
    }
  }

  private static defaultPublic(code: ErrorCode): boolean {
    return ['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'VALIDATION_ERROR', 'RATE_LIMITED', 'CONFLICT'].includes(code);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'P2002';
  }
  return false;
}
