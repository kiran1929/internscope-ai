/**
 * Ingestion Dead Letter Queue (HIGH-004)
 * Stores failed ingestion records with stage, payload, and stack traces for admin review.
 */
export interface FailedIngestionItem {
  id: string;
  sourceId: string;
  externalJobId?: string;
  stage: string;
  error: string;
  payload?: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
}

// In-memory ring buffer of the most recent dead-letter failures
const MAX_FAILURES_STORED = 200;
const failureQueue: FailedIngestionItem[] = [];

export class DeadLetterQueue {
  static recordFailure(
    sourceId: string,
    stage: string,
    error: string,
    externalJobId?: string,
    payload?: Record<string, unknown>
  ): FailedIngestionItem {
    const item: FailedIngestionItem = {
      id: `dlq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sourceId,
      externalJobId,
      stage,
      error,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    failureQueue.unshift(item);
    if (failureQueue.length > MAX_FAILURES_STORED) {
      failureQueue.pop();
    }

    console.warn(`[DeadLetterQueue] Recorded ingestion failure [${stage}] ${sourceId}/${externalJobId || 'unknown'}: ${error}`);
    return item;
  }

  static getRecentFailures(limit = 50): FailedIngestionItem[] {
    return failureQueue.slice(0, limit);
  }

  static getFailureCount(): number {
    return failureQueue.length;
  }

  static clear(): void {
    failureQueue.length = 0;
  }
}
