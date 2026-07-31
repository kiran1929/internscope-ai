import { prisma } from '../db';

export interface TelemetrySpan {
  name: string;
  durationMs: number;
  metadata?: any;
}

export class Observability {
  static logSpan(span: TelemetrySpan) {
    console.log(`[Telemetry Span] ${span.name} took ${span.durationMs}ms. Details: ${JSON.stringify(span.metadata || {})}`);
  }

  static captureException(error: Error, context?: any) {
    console.error(`[Sentry Error Event] captured exception: ${error.message}`, error.stack);
    
    // Asynchronously log to SystemAuditLog
    prisma.systemAuditLog.create({
      data: {
        action: 'SENTRY_CAPTURE_ERROR',
        status: 'FAILURE',
        details: `Message: ${error.message}. Stack: ${error.stack}. Context: ${JSON.stringify(context || {})}`,
      },
    }).catch(err => console.error('Failed to write failure audit logs:', err));
  }

  // Wrapper tracking AI provider latency, tokens, cost
  static async trackAICall<T>(
    provider: string,
    model: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.logSpan({
        name: `AI_CALL_${provider}_${model}`,
        durationMs: duration,
        metadata: { operation },
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.captureException(error instanceof Error ? error : new Error(String(error)), {
        provider,
        model,
        operation,
        durationMs: duration,
      });
      throw error;
    }
  }

  // Wrapper tracking Database Query Latencies
  static async trackDbQuery<T>(
    operationName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.logSpan({
        name: `DB_QUERY_${operationName}`,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (error) {
      this.captureException(error instanceof Error ? error : new Error(String(error)), {
        dbOperation: operationName,
      });
      throw error;
    }
  }
}
