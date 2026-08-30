import { prisma } from '@/lib/db';
import { AppError } from '@/lib/security/errors';

export async function getCurrentResumeVersion(userId: string) {
  return prisma.resume.findFirst({
    where: { userId, isCurrentVersion: true, processingStatus: { not: 'DELETED' } },
    orderBy: { version: 'desc' },
  });
}

export async function rollbackResumeVersion(userId: string, targetResumeId: string) {
  const target = await prisma.resume.findFirst({
    where: { id: targetResumeId, userId, processingStatus: 'READY' },
  });

  if (!target) {
    throw new AppError('NOT_FOUND', 'Resume version not found or not ready for rollback.', { isPublic: true });
  }

  await prisma.$transaction([
    prisma.resume.updateMany({
      where: { userId },
      data: { isCurrentVersion: false },
    }),
    prisma.resume.update({
      where: { id: target.id },
      data: { isCurrentVersion: true },
    }),
    prisma.profile.update({
      where: { userId },
      data: { resumeUrl: `/api/resumes/${target.id}` },
    }),
  ]);

  return target;
}

export async function listResumeVersions(userId: string) {
  return prisma.resume.findMany({
    where: { userId, processingStatus: { not: 'DELETED' } },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      fileName: true,
      isCurrentVersion: true,
      processingStatus: true,
      isParsed: true,
      createdAt: true,
      qualityScore: true,
      confidenceScore: true,
    },
  });
}
