import { describe, it, expect } from 'vitest';
import { validateResumeUpload } from '@/lib/security/file-validator';
import { AppError } from '@/lib/security/errors';

function makeFile(name: string, type: string, size = 100): File {
  return { name, type, size } as File;
}

describe('validateResumeUpload', () => {
  it('accepts valid PDF with matching signature', () => {
    const buffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj');
    const result = validateResumeUpload(makeFile('resume.pdf', 'application/pdf'), buffer);
    expect(result.extension).toBe('.pdf');
    expect(result.mimeType).toBe('application/pdf');
  });

  it('rejects renamed non-PDF content', () => {
    const buffer = Buffer.from('not a pdf');
    expect(() => validateResumeUpload(makeFile('resume.pdf', 'application/pdf'), buffer)).toThrow(AppError);
  });

  it('rejects oversized files', () => {
    const buffer = Buffer.alloc(6 * 1024 * 1024, 0);
    buffer.write('%PDF', 0);
    expect(() => validateResumeUpload(makeFile('big.pdf', 'application/pdf'), buffer)).toThrow(/5MB/);
  });

  it('rejects path traversal filenames', () => {
    const buffer = Buffer.from('%PDF-1.4');
    expect(() => validateResumeUpload(makeFile('../etc/passwd.pdf', 'application/pdf'), buffer)).toThrow(AppError);
  });

  it('rejects empty files', () => {
    expect(() => validateResumeUpload(makeFile('empty.pdf', 'application/pdf'), Buffer.alloc(0))).toThrow(AppError);
  });
});
