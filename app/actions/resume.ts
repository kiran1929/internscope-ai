'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/resume/storage-service';
import { resumeParsePipeline, runResumeParsePipeline } from '@/trigger/resume';
import { revalidatePath } from 'next/cache';
import { sanitizeError } from '@/lib/security/error-handler';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadResumeAction(formData: FormData) {
  let storedPath: string | null = null;
  let resumeRecordId: string | null = null;

  try {
    const user = await getAuthenticatedUser();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No resume file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File exceeds the maximum 5MB size limit');
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic Bytes Verification (CVE-004)
    const isPDF = buffer.subarray(0, 4).toString('ascii') === '%PDF';
    const isDOCX = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    const isDOC = buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;

    if (!isPDF && !isDOCX && !isDOC) {
      throw new Error('Invalid file format. Only verified PDF, DOCX, and DOC documents are accepted.');
    }

    const mimeType = isPDF 
      ? 'application/pdf' 
      : isDOCX 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        : 'application/msword';

    // 1. Determine resume version increment
    const previousVersionsCount = await prisma.resume.count({
      where: { userId: user.id },
    });
    const version = previousVersionsCount + 1;

    // 2. Save file buffer to storage first (eliminates 'PENDING' DB race condition)
    storedPath = await StorageService.saveFile(user.id, file.name, buffer);

    // 3. Create persistent DB record with final stored path
    const resumeRecord = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: file.name,
        filePath: storedPath,
        fileSize: file.size,
        mimeType,
        version,
      },
    });
    resumeRecordId = resumeRecord.id;

    // 4. Update user profile resumeUrl
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

    // 5. Invoke Trigger.dev parsing background job
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
    // Compensating action: If stored file exists but processing crashed, clean up disk
    if (storedPath && !resumeRecordId) {
      try {
        await StorageService.deleteFile(storedPath);
      } catch (cleanupErr) {
        console.error('Failed to cleanup orphan file:', cleanupErr);
      }
    }

    return {
      success: false,
      error: sanitizeError(error, 'Failed to upload and process resume.'),
    };
  }
}

export async function deleteResumeAction(resumeId: string) {
  try {
    const user = await getAuthenticatedUser();

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.userId !== user.id) {
      throw new Error('Resume not found or unauthorized deletion');
    }

    // Delete from secure filesystem
    await StorageService.deleteFile(resume.filePath);

    // Delete database records
    await prisma.resume.delete({
      where: { id: resumeId },
    });

    // Reset profile resumeUrl if it was pointing to this deleted resume
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (profile?.resumeUrl?.includes(resumeId)) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: { resumeUrl: null },
      });
    }

    revalidatePath('/resume');
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error('Resume delete action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
