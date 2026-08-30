import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/resume/storage-service';
import { secureLog } from '@/lib/security/logger';

const STALE_MS = 24 * 60 * 60 * 1000;

/**
 * Reconciles abandoned upload records and stale staging files.
 */
export async function reconcileResumeUploads() {
  const cutoff = new Date(Date.now() - STALE_MS);

  const staleRecords = await prisma.resume.findMany({
    where: {
      processingStatus: { in: ['UPLOADING', 'VALIDATING', 'STORED', 'PROCESSING'] },
      updatedAt: { lt: cutoff },
    },
    select: { id: true, filePath: true },
  });

  for (const record of staleRecords) {
    await StorageService.deleteFile(record.filePath).catch(() => undefined);
    await prisma.resume.update({
      where: { id: record.id },
      data: {
        processingStatus: 'FAILED',
        parsingError: 'Upload processing timed out and was cleaned up.',
      },
    });
  }

  const removedStagingFiles = await StorageService.cleanupStaleStaging(STALE_MS);

  secureLog.info('Resume upload reconciliation completed', {
    action: 'reconcileResumeUploads',
    staleRecords: staleRecords.length,
    removedStagingFiles,
  });

  return { staleRecords: staleRecords.length, removedStagingFiles };
}
