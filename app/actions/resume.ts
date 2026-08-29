'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/resume/storage-service';
import { resumeParsePipeline, runResumeParsePipeline } from '@/trigger/resume';
import { revalidatePath } from 'next/cache';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadResumeAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No resume file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File exceeds the maximum 5MB size limit');
    }

    const mimeType = file.type;
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedTypes.includes(mimeType) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      throw new Error('Invalid file type. Only PDF and DOCX files are allowed.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Determine resume version increments
    const previousVersionsCount = await prisma.resume.count({
      where: { userId: user.id },
    });
    const version = previousVersionsCount + 1;

    // 2. Write placeholder database record to obtain unique ID
    const resumeRecord = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: file.name,
        filePath: 'PENDING',
        fileSize: file.size,
        mimeType,
        version,
      },
    });

    // 3. Save file buffer securely using storage service
    const storedPath = await StorageService.saveFile(user.id, file.name, buffer);

    // 4. Update file path in database record
    await prisma.resume.update({
      where: { id: resumeRecord.id },
      data: { filePath: storedPath },
    });

    // 5. Update user profile resumeUrl dynamically using upsert (handles cases where profile record was not created yet)
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

    // 6. Invoke Trigger.dev parsing background job
    try {
      await resumeParsePipeline.trigger({
        resumeId: resumeRecord.id,
        userId: user.id,
      });
    } catch (triggerError) {
      console.warn('Trigger.dev job dispatch failed, executing pipeline inline in dev:', triggerError);
      // Run it synchronously as a fallback for sandbox environments where Trigger daemon isn't running
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
    console.error('Resume upload action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
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
