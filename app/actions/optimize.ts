'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { AICoverLetterService } from '@/lib/optimize/ai-cover-letter-service';
import { runResumeOptimizationPipeline } from '@/trigger/optimize';
import { revalidatePath } from 'next/cache';
import { actionError } from '@/lib/security/error-handler';
import { enforceRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { sanitizeError } from '@/lib/security/error-handler';

const DEDUP_HOURS = 24;

export async function optimizeResumeAction(params: {
  opportunityId?: string;
  title: string;
  force?: boolean;
}) {
  try {
    const user = await getAuthenticatedUser();

    // Enforce rate limiting (HIGH-002)
    enforceRateLimit('optimize-resume', user.id, RATE_LIMIT_CONFIGS.RESUME_OPTIMIZATION);

    const resume = await prisma.resume.findFirst({
      where: { userId: user.id, isParsed: true },
      orderBy: { version: 'desc' },
    });

    if (!resume) {
      throw new Error('Please upload and parse a resume before running the optimizer.');
    }

    // Return recent result for same resume + job unless forced
    if (!params.force) {
      const since = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000);
      const existing = await prisma.resumeOptimization.findFirst({
        where: {
          userId: user.id,
          resumeId: resume.id,
          opportunityId: params.opportunityId || null,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        include: { atsAnalysis: true },
      });

      if (existing?.atsAnalysis) {
        revalidatePath('/resume');
        return {
          success: true,
          optimizationId: existing.id,
          cached: true,
          atsScore: existing.atsScore,
        };
      }
    }

    // Run inline for immediate, reliable results
    const result = await runResumeOptimizationPipeline({
      resumeId: resume.id,
      userId: user.id,
      opportunityId: params.opportunityId,
      title: params.title,
    });

    revalidatePath('/resume');
    return {
      success: true,
      optimizationId: result.optimizationId,
      atsScore: result.atsScore,
      cached: false,
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to optimize resume.'),
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
      error: sanitizeError(error, 'Failed to delete optimization.'),
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

    // Enforce rate limiting (HIGH-002)
    enforceRateLimit('generate-cover-letter', user.id, RATE_LIMIT_CONFIGS.COVER_LETTER);

    const resume = await prisma.resume.findFirst({
      where: { userId: user.id, isParsed: true },
      orderBy: { version: 'desc' },
    });

    if (!resume) {
      throw new Error('Please upload and parse a resume first.');
    }

    let job = null;
    if (params.opportunityId) {
      job = await prisma.opportunity.findUnique({
        where: { id: params.opportunityId },
        include: { company: true },
      });
    }

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

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: user.id,
        opportunityId: params.opportunityId || null,
        title: params.title,
      },
    });

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
      error: actionError(error, 'Failed to optimize resume.', 'optimizeResumeAction'),
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
      error: actionError(error, 'Failed to optimize resume.', 'optimizeResumeAction'),
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
      error: actionError(error, 'Failed to optimize resume.', 'optimizeResumeAction'),
    };
  }
}
