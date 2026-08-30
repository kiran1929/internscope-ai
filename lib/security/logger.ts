import { createRequestId } from './request-id';

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const payload = {
    level,
    message,
    requestId: context?.requestId ?? createRequestId('log'),
    timestamp: new Date().toISOString(),
    ...context,
    ...(error instanceof Error
      ? { errorName: error.name, errorMessage: error.message }
      : error !== undefined
        ? { errorDetail: String(error) }
        : {}),
  };

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const secureLog = {
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext, error?: unknown) => write('warn', message, context, error),
  error: (message: string, context?: LogContext, error?: unknown) => write('error', message, context, error),
};
