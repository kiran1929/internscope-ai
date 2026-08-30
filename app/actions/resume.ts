'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/resume/storage-service';
import { validateResumeUpload } from '@/lib/security/file-validator';
import { sanitizeError } from '@/lib/security/error-handler';
import { enforceRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { rollbackResumeVersion, listResumeVersions } from '@/lib/resume/versioning';
import { resumeParsePipeline, runResumeParsePipeline } from '@/trigger/resume';
import { revalidatePath } from 'next/cache';

export async function uploadResumeAction(formData: FormData) {
  let stagedPath: string | null = null;
  let resumeId: string | null = null;

  try {
    const user = await getAuthenticatedUser();
    await enforceRateLimit('upload-resume', user.id, RATE_LIMIT_CONFIGS.RESUME_UPLOAD);
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No resume file provided');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validated = validateResumeUpload(file, buffer);

    const previousVersionsCount = await prisma.resume.count({
      where: { userId: user.id },
    });
    const version = previousVersionsCount + 1;

    // Stage file before DB record creation
    stagedPath = await StorageService.saveToStaging(user.id, validated.extension, validated.buffer);

    const resumeRecord = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: validated.originalName,
        filePath: stagedPath,
        fileSize: validated.buffer.length,
        mimeType: validated.mimeType,
        version,
        processingStatus: 'VALIDATING',
        isCurrentVersion: true,
      },
    });
    resumeId = resumeRecord.id;

    // Mark prior versions as non-current
    await prisma.resume.updateMany({
      where: { userId: user.id, id: { not: resumeRecord.id } },
      data: { isCurrentVersion: false },
    });

    const finalPath = await StorageService.promoteFromStaging(stagedPath, validated.extension);
    stagedPath = null;

    await prisma.resume.update({
      where: { id: resumeRecord.id },
      data: {
        filePath: finalPath,
        processingStatus: 'STORED',
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { resumeUrl: `/api/resumes/${resumeRecord.id}` },
      create: {
        userId: user.id,
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        resumeUrl: `/api/resumes/${resumeRecord.id}`,
      },
    });

    await prisma.resume.update({
      where: { id: resumeRecord.id },
      data: { processingStatus: 'PROCESSING' },
    });

    try {
      await resumeParsePipeline.trigger({
        resumeId: resumeRecord.id,
        userId: user.id,
      });
    } catch (triggerError) {
      console.warn('Trigger.dev job dispatch failed, executing pipeline inline in dev:', triggerError);
      await runResumeParsePipeline({
        resumeId: resumeRecord.id,
        userId: user.id,
      });
    }

    revalidatePath('/resume');
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true, resumeId: resumeRecord.id };
  } catch (error) {
    if (stagedPath) {
      await StorageService.deleteFile(stagedPath).catch(() => undefined);
    }
    if (resumeId) {
      await prisma.resume
        .update({
          where: { id: resumeId },
          data: {
            processingStatus: 'FAILED',
            parsingError: error instanceof Error ? error.message : String(error),
          },
        })
        .catch(() => undefined);
    }

    return {
      success: false,
      error: sanitizeError(error, 'Resume upload failed. Please try again.', { action: 'uploadResumeAction' }),
    };
  }
}

export async function deleteResumeAction(resumeId: string) {
  try {
    const user = await getAuthenticatedUser();

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    });

    if (!resume) {
      throw new Error('Resume not found or unauthorized deletion');
    }

    await StorageService.deleteFile(resume.filePath);

    await prisma.resume.update({
      where: { id: resumeId },
      data: { processingStatus: 'DELETED' },
    });

    await prisma.resume.delete({
      where: { id: resumeId },
    });

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (profile?.resumeUrl?.includes(resumeId)) {
      const nextResume = await prisma.resume.findFirst({
        where: { userId: user.id, isCurrentVersion: true },
        orderBy: { version: 'desc' },
      });

      await prisma.profile.update({
        where: { userId: user.id },
        data: { resumeUrl: nextResume ? `/api/resumes/${nextResume.id}` : null },
      });
    }

    revalidatePath('/resume');
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to delete resume.', { action: 'deleteResumeAction' }),
    };
  }
}

export async function listResumeVersionsAction() {
  try {
    const user = await getAuthenticatedUser();
    const versions = await listResumeVersions(user.id);
    return { success: true, versions };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to list resume versions.', { action: 'listResumeVersionsAction' }),
    };
  }
}

export async function rollbackResumeVersionAction(resumeId: string) {
  try {
    const user = await getAuthenticatedUser();
    const rolledBack = await rollbackResumeVersion(user.id, resumeId);
    revalidatePath('/resume');
    revalidatePath('/profile');
    return { success: true, resumeId: rolledBack.id, version: rolledBack.version };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to rollback resume version.', { action: 'rollbackResumeVersionAction' }),
    };
  }
}
