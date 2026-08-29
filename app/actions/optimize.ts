'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { AICoverLetterService } from '@/lib/optimize/ai-cover-letter-service';
import { resumeOptimizationPipeline, runResumeOptimizationPipeline } from '@/trigger/optimize';
import { revalidatePath } from 'next/cache';

export async function optimizeResumeAction(params: {
  opportunityId?: string;
  title: string;
}) {
  try {
    const user = await getAuthenticatedUser();

    // Fetch user's latest parsed resume
    const resume = await prisma.resume.findFirst({
      where: { userId: user.id, isParsed: true },
      orderBy: { version: 'desc' },
    });

    if (!resume) {
      throw new Error('Please upload and parse a resume before running the optimizer.');
    }

    try {
      await resumeOptimizationPipeline.trigger({
        resumeId: resume.id,
        userId: user.id,
        opportunityId: params.opportunityId,
        title: params.title,
      });
    } catch (triggerError) {
      console.warn('Trigger.dev job failed, running inline:', triggerError);
      await runResumeOptimizationPipeline({
        resumeId: resume.id,
        userId: user.id,
        opportunityId: params.opportunityId,
        title: params.title,
      });
    }

    revalidatePath('/resume');
    return { success: true };
  } catch (error) {
    console.error('Failed to tailormade optimize resume:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteOptimizationAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    
    await prisma.resumeOptimization.delete({
      where: { id, userId: user.id },
    });

    revalidatePath('/resume');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function generateCoverLetterAction(params: {
  opportunityId?: string;
  style: 'Professional' | 'Concise' | 'Enthusiastic' | 'Startup' | 'Corporate';
  title: string;
}) {
  try {
    const user = await getAuthenticatedUser();

    // 1. Fetch user's latest parsed resume
    const resume = await prisma.resume.findFirst({
      where: { userId: user.id, isParsed: true },
      orderBy: { version: 'desc' },
    });

    if (!resume) {
      throw new Error('Please upload and parse a resume first.');
    }

    // 2. Fetch target job details
    let job = null;
    if (params.opportunityId) {
      job = await prisma.opportunity.findUnique({
        where: { id: params.opportunityId },
        include: { company: true },
      });
    }

    // 3. Call AI Cover Letter Service
    const aiResult = await AICoverLetterService.generate({
      resume: resume.structuredData,
      job: job ? {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        company: { name: job.company.name },
      } : undefined,
      style: params.style,
    });

    // 4. Save CoverLetter database record
    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: user.id,
        opportunityId: params.opportunityId || null,
        title: params.title,
      },
    });

    // 5. Create CoverLetterVersion database record
    await prisma.coverLetterVersion.create({
      data: {
        coverLetterId: coverLetter.id,
        version: 1,
        content: aiResult.content,
        style: params.style,
        provider: aiResult.provider,
        model: aiResult.model,
        tokensUsed: aiResult.tokensUsed,
        estimatedCost: aiResult.tokensUsed * 0.00000015,
        latencyMs: aiResult.latencyMs,
      },
    });

    revalidatePath('/cover-letter');
    return { success: true, coverLetterId: coverLetter.id };
  } catch (error) {
    console.error('Failed to generate cover letter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateCoverLetterAction(params: {
  coverLetterId: string;
  content: string;
  style: string;
}) {
  try {
    const user = await getAuthenticatedUser();

    const cl = await prisma.coverLetter.findFirst({
      where: { id: params.coverLetterId, userId: user.id },
      include: { versions: { orderBy: { version: 'desc' } } },
    });

    if (!cl) {
      throw new Error('Cover letter not found or unauthorized');
    }

    const nextVerNum = cl.versions.length > 0 ? cl.versions[0].version + 1 : 1;

    await prisma.coverLetterVersion.create({
      data: {
        coverLetterId: params.coverLetterId,
        version: nextVerNum,
        content: params.content,
        style: params.style,
        provider: 'User-Editor',
        model: 'manual-edit',
      },
    });

    revalidatePath('/cover-letter');
    revalidatePath(`/cover-letter/${params.coverLetterId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteCoverLetterAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    await prisma.coverLetter.delete({
      where: { id, userId: user.id },
    });

    revalidatePath('/cover-letter');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
