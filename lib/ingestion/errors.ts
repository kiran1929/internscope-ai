export class IngestionError extends Error {
  constructor(message: string, public readonly stage: string, public readonly originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class FetchError extends IngestionError {
  constructor(message: string, originalError?: Error) {
    super(message, 'Fetcher', originalError);
  }
}

export class ParseError extends IngestionError {
  constructor(message: string, originalError?: Error) {
    super(message, 'Parser', originalError);
  }
}

export class ValidationError extends IngestionError {
  constructor(message: string, public readonly validationErrors: string[]) {
    super(`${message}: ${validationErrors.join(', ')}`, 'Validator');
  }
}

export class MatchError extends IngestionError {
  constructor(message: string, originalError?: Error) {
    super(message, 'Matcher', originalError);
  }
}

export class PersistenceError extends IngestionError {
  constructor(message: string, originalError?: Error) {
    super(message, 'Persistence', originalError);
  }
}
