export const SECURITY_LIMITS = {
  MAX_RESUME_BYTES: 5 * 1024 * 1024,
  ALLOWED_RESUME_EXTENSIONS: ['.pdf', '.docx'] as const,
  ALLOWED_RESUME_MIMES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ] as const,
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_PAGE_MAX: 100,
  SEARCH_DEFAULT_LIMIT: 20,
  SEARCH_MAX_RESULTS: 50,
  ADMIN_PAGE_MAX: 100,
} as const;

export const RESUME_PROCESSING_STATES = {
  UPLOADING: 'UPLOADING',
  VALIDATING: 'VALIDATING',
  STORED: 'STORED',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  FAILED: 'FAILED',
  DELETED: 'DELETED',
} as const;

export type ResumeProcessingState = (typeof RESUME_PROCESSING_STATES)[keyof typeof RESUME_PROCESSING_STATES];
