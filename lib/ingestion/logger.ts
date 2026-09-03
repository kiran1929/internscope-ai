export type LogStage =
  | 'Fetched'
  | 'Parsed'
  | 'Normalized'
  | 'Matched'
  | 'Validated'
  | 'Skipped'
  | 'Accepted'
  | 'Failed';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface IngestionLogEntry {
  timestamp: string;
  level: LogLevel;
  stage: LogStage | 'Pipeline';
  message: string;
  sourceId?: string;
  externalJobId?: string;
  data?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

export class IngestionLogger {
  private static minLevel(): LogLevel {
    const raw = (process.env.INGESTION_LOG_LEVEL || 'INFO').toUpperCase();
    if (raw === 'DEBUG' || raw === 'INFO' || raw === 'WARN' || raw === 'ERROR') {
      return raw;
    }
    return 'INFO';
  }

  private static shouldLog(level: LogLevel): boolean {
    const order: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    return order.indexOf(level) >= order.indexOf(this.minLevel());
  }

  private static log(
    level: LogLevel,
    stage: LogStage | 'Pipeline',
    message: string,
    sourceId?: string,
    externalJobId?: string,
    data?: Record<string, unknown>,
    error?: Error
  ) {
    if (!this.shouldLog(level)) return;

    const logEntry: IngestionLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      stage,
      message,
      sourceId,
      externalJobId,
      data,
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    // Output raw machine-readable JSON log to stdout
    console.log(JSON.stringify(logEntry));
  }

  static debug(
    stage: LogStage | 'Pipeline',
    message: string,
    sourceId?: string,
    externalJobId?: string,
    data?: Record<string, unknown>
  ) {
    this.log('DEBUG', stage, message, sourceId, externalJobId, data);
  }

  static info(
    stage: LogStage | 'Pipeline',
    message: string,
    sourceId?: string,
    externalJobId?: string,
    data?: Record<string, unknown>
  ) {
    this.log('INFO', stage, message, sourceId, externalJobId, data);
  }

  static warn(
    stage: LogStage | 'Pipeline',
    message: string,
    sourceId?: string,
    externalJobId?: string,
    data?: Record<string, unknown>,
    error?: Error
  ) {
    this.log('WARN', stage, message, sourceId, externalJobId, data, error);
  }

  static error(
    stage: LogStage | 'Pipeline',
    message: string,
    sourceId?: string,
    externalJobId?: string,
    data?: Record<string, unknown>,
    error?: Error
  ) {
    this.log('ERROR', stage, message, sourceId, externalJobId, data, error);
  }
}
