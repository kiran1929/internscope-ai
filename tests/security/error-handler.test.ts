import { describe, it, expect, vi, afterEach } from 'vitest';
import { sanitizeError } from '@/lib/security/error-handler';
import { AppError } from '@/lib/security/errors';

describe('sanitizeError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns public AppError messages', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const msg = sanitizeError(new AppError('VALIDATION_ERROR', 'Invalid file type.', { isPublic: true }));
    expect(msg).toBe('Invalid file type.');
  });

  it('hides prisma errors in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const msg = sanitizeError(new Error('prisma P2002 unique constraint failed'));
    expect(msg).not.toContain('prisma');
  });

  it('hides filesystem paths in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const msg = sanitizeError(new Error('ENOENT: no such file /var/task/storage/resumes/x'));
    expect(msg).not.toContain('/var/');
  });
});
