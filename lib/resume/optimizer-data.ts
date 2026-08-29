import { prisma } from '@/lib/db';

export async function getResumeOptimizerData(userId: string) {
  const latestResume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { version: 'desc' },
  });

  const hasResume = !!latestResume;

  const optimizations = await prisma.resumeOptimization.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      opportunity: { include: { company: true } },
      atsAnalysis: true,
      sections: { orderBy: { sectionType: 'asc' } },
    },
  });

  const [savedJobs, appliedJobs] = await Promise.all([
    prisma.savedOpportunity.findMany({
      where: { userId },
      include: { opportunity: { include: { company: true } } },
    }),
    prisma.application.findMany({
      where: { userId },
      include: { opportunity: { include: { company: true } } },
    }),
  ]);

  const uniqueJobOptionsMap: Record<string, { id: string; title: string; companyName: string }> = {};

  savedJobs.forEach((savedJob) => {
    uniqueJobOptionsMap[savedJob.opportunityId] = {
      id: savedJob.opportunityId,
      title: savedJob.opportunity.title,
      companyName: savedJob.opportunity.company.name,
    };
  });

  appliedJobs.forEach((application) => {
    uniqueJobOptionsMap[application.opportunityId] = {
      id: application.opportunityId,
      title: application.opportunity.title,
      companyName: application.opportunity.company.name,
    };
  });

  const mappedOpts = optimizations.map((opt) => ({
    id: opt.id,
    title: opt.title,
    atsScore: opt.atsScore,
    createdAt: opt.createdAt,
    opportunity: opt.opportunity
      ? {
          title: opt.opportunity.title,
          company: { name: opt.opportunity.company.name },
        }
      : null,
    atsAnalysis: opt.atsAnalysis
      ? {
          atsScore: opt.atsAnalysis.atsScore,
          keywordMatchScore: opt.atsAnalysis.keywordMatchScore,
          missingKeywords: opt.atsAnalysis.missingKeywords,
          weakBullets: opt.atsAnalysis.weakBullets,
          strongBullets: opt.atsAnalysis.strongBullets,
          missingSkills: opt.atsAnalysis.missingSkills,
          suggestedProjects: opt.atsAnalysis.suggestedProjects,
          suggestedCertifications: opt.atsAnalysis.suggestedCertifications,
          formattingIssues: opt.atsAnalysis.formattingIssues,
          improvementChecklist: opt.atsAnalysis.improvementChecklist,
        }
      : null,
    sections: opt.sections.map((section) => ({
      id: section.id,
      sectionType: section.sectionType,
      originalContent: section.originalContent,
      optimizedContent: section.optimizedContent,
      bulletRewrites: section.bulletRewrites,
    })),
  }));

  return {
    hasResume,
    optimizations: mappedOpts,
    jobOptions: Object.values(uniqueJobOptionsMap),
  };
}
