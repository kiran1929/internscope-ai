import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '../lib/db';
import { AIOptimizeService } from '../lib/optimize/ai-optimize-service';

export interface OptimizePipelinePayload {
  resumeId: string;
  userId: string;
  opportunityId?: string;
  title: string;
}

export async function runResumeOptimizationPipeline(payload: OptimizePipelinePayload) {
  const { resumeId, userId, opportunityId, title } = payload;

  // 1. Fetch resume and optional target opportunity
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    throw new Error(`Resume not found with ID: ${resumeId}`);
  }

  let job = null;
  if (opportunityId) {
    job = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { company: true },
    });
  }

  // 2. Call the AI optimization service
  const optResult = await AIOptimizeService.optimize({
    resumeStructuredData: resume.structuredData,
    job: job ? {
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      company: { name: job.company.name },
    } : undefined,
  });

  const data = optResult.structuredData;

  // 3. Create ResumeOptimization record
  const optimization = await prisma.resumeOptimization.create({
    data: {
      userId,
      resumeId,
      opportunityId: opportunityId || null,
      title,
      atsScore: data.atsScore,
    },
  });

  // 4. Create ResumeOptimizationSection records
  const sectionPromises = data.sections.map((s) =>
    prisma.resumeOptimizationSection.create({
      data: {
        optimizationId: optimization.id,
        sectionType: s.sectionType,
        originalContent: s.originalContent,
        optimizedContent: s.optimizedContent,
        bulletRewrites: s.bulletRewrites as any,
      },
    })
  );

  await Promise.all(sectionPromises);

  // 5. Create ATSAnalysis report record
  await prisma.aTSAnalysis.create({
    data: {
      optimizationId: optimization.id,
      atsScore: data.atsScore,
      keywordMatchScore: data.keywordMatchScore,
      missingKeywords: data.missingKeywords,
      weakBullets: data.weakBullets,
      strongBullets: data.strongBullets,
      missingSkills: data.missingSkills,
      suggestedProjects: data.suggestedProjects,
      suggestedCertifications: data.suggestedCertifications,
      formattingIssues: data.formattingIssues,
      improvementChecklist: data.improvementChecklist,
      provider: optResult.provider,
      model: optResult.model,
      latencyMs: optResult.latencyMs,
      tokensUsed: optResult.tokensUsed,
      estimatedCost: (optResult.tokensUsed * 0.00000015),
    },
  });

  // 6. Record career insight milestone
  await prisma.careerInsight.create({
    data: {
      userId,
      title: 'Resume Tailored to Target Job',
      content: `Tailored and ATS-aligned optimized copy generated for "${title}". ATS Score graded: ${data.atsScore}%.`,
      type: 'recommendation',
    },
  });

  return {
    success: true,
    optimizationId: optimization.id,
    atsScore: data.atsScore,
    latencyMs: optResult.latencyMs,
  };
}

export const resumeOptimizationPipeline = task({
  id: 'resume-optimization-pipeline',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: OptimizePipelinePayload) => {
    return runResumeOptimizationPipeline(payload);
  },
});
