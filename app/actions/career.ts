'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { careerAnalysisPipeline, runCareerAnalysisPipeline } from '@/trigger/career';
import { revalidatePath } from 'next/cache';

export async function recalculateCareerAnalysisAction() {
  try {
    const user = await getAuthenticatedUser();

    // Find the latest successfully parsed resume for this user
    const latestResume = await prisma.resume.findFirst({
      where: { userId: user.id, isParsed: true },
      orderBy: { version: 'desc' },
    });

    if (!latestResume) {
      throw new Error('You must upload and successfully parse a resume before running career analysis.');
    }

    try {
      await careerAnalysisPipeline.trigger({
        resumeId: latestResume.id,
        userId: user.id,
      });
    } catch (triggerError) {
      console.warn('Trigger.dev job dispatch failed, running career pipeline inline:', triggerError);
      await runCareerAnalysisPipeline({
        resumeId: latestResume.id,
        userId: user.id,
      });
    }

    revalidatePath('/career');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to run manual career analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
