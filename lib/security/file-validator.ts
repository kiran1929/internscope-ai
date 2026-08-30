import path from 'path';
import { AppError } from './errors';
import { SECURITY_LIMITS } from './constants';

export interface ValidatedUploadFile {
  extension: '.pdf' | '.docx';
  mimeType: string;
  buffer: Buffer;
  originalName: string;
}

const PDF_SIGNATURE = Buffer.from('%PDF');
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

function hasPrefix(buffer: Buffer, prefix: Buffer): boolean {
  return buffer.length >= prefix.length && buffer.subarray(0, prefix.length).equals(prefix);
}

function normalizeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return ext;
}

function detectExtensionFromBuffer(buffer: Buffer): '.pdf' | '.docx' | null {
  if (hasPrefix(buffer, PDF_SIGNATURE)) return '.pdf';
  if (hasPrefix(buffer, ZIP_SIGNATURE)) return '.docx';
  return null;
}

function isLikelyDocx(buffer: Buffer): boolean {
  if (!hasPrefix(buffer, ZIP_SIGNATURE)) return false;
  const head = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('latin1');
  return head.includes('[Content_Types].xml') || head.includes('word/');
}

export function validateResumeUpload(file: File, buffer: Buffer): ValidatedUploadFile {
  if (!file || buffer.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'No resume file provided.', { isPublic: true });
  }

  if (buffer.length > SECURITY_LIMITS.MAX_RESUME_BYTES) {
    throw new AppError('VALIDATION_ERROR', 'File exceeds the maximum 5MB size limit.', { isPublic: true });
  }

  const declaredExt = normalizeExtension(file.name);
  if (!SECURITY_LIMITS.ALLOWED_RESUME_EXTENSIONS.includes(declaredExt as '.pdf' | '.docx')) {
    throw new AppError('VALIDATION_ERROR', 'Invalid file type. Only PDF and DOCX files are allowed.', { isPublic: true });
  }

  const detectedExt = detectExtensionFromBuffer(buffer);
  if (!detectedExt) {
    throw new AppError('VALIDATION_ERROR', 'File content does not match an allowed resume format.', { isPublic: true });
  }

  if (detectedExt !== declaredExt) {
    throw new AppError('VALIDATION_ERROR', 'File extension does not match file content.', { isPublic: true });
  }

  if (detectedExt === '.docx' && !isLikelyDocx(buffer)) {
    throw new AppError('VALIDATION_ERROR', 'DOCX file structure is invalid or malformed.', { isPublic: true });
  }

  const mimeType =
    detectedExt === '.pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (file.type && file.type !== mimeType && file.type !== 'application/octet-stream') {
    // Browser MIME is advisory only; content detection is authoritative.
    // Reject only clearly wrong non-resume types.
    const blocked = ['text/html', 'application/javascript', 'application/x-msdownload'];
    if (blocked.includes(file.type)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid file type. Only PDF and DOCX files are allowed.', { isPublic: true });
    }
  }

  const safeName = path.basename(file.name).replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200);
  if (safeName.includes('..') || safeName.includes('/') || safeName.includes('\\')) {
    throw new AppError('VALIDATION_ERROR', 'Invalid file name.', { isPublic: true });
  }

  return {
    extension: detectedExt,
    mimeType,
    buffer,
    originalName: safeName || `resume${detectedExt}`,
  };
}
