import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import ResumeOptimizerClient from '@/components/ResumeOptimizerClient';

export const dynamic = 'force-dynamic';

export default async function ResumeOptimizePage() {
  const user = await getAuthenticatedUser();

  // 1. Check if user has uploaded a resume
  const latestResume = await prisma.resume.findFirst({
    where: { userId: user.id },
    orderBy: { version: 'desc' },
  });

  const hasResume = !!latestResume;

  // 2. Fetch all optimizations for this user
  const optimizations = await prisma.resumeOptimization.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      opportunity: { include: { company: true } },
      atsAnalysis: true,
      sections: { orderBy: { sectionType: 'asc' } },
    },
  });

  // 3. Map optimizations to client structure
  const mappedOpts = optimizations.map((opt) => ({
    id: opt.id,
    title: opt.title,
    atsScore: opt.atsScore,
    createdAt: opt.createdAt,
    opportunity: opt.opportunity ? {
      title: opt.opportunity.title,
      company: { name: opt.opportunity.company.name },
    } : null,
    atsAnalysis: opt.atsAnalysis ? {
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
    } : null,
    sections: opt.sections.map((s) => ({
      id: s.id,
      sectionType: s.sectionType,
      originalContent: s.originalContent,
      optimizedContent: s.optimizedContent,
      bulletRewrites: s.bulletRewrites,
    })),
  }));

  // 4. Fetch job options they can choose to practice/optimize for (saved or applied)
  const [savedJobs, appliedJobs] = await Promise.all([
    prisma.savedOpportunity.findMany({
      where: { userId: user.id },
      include: { opportunity: { include: { company: true } } },
    }),
    prisma.application.findMany({
      where: { userId: user.id },
      include: { opportunity: { include: { company: true } } },
    }),
  ]);

  const uniqueJobOptionsMap: Record<string, { id: string; title: string; companyName: string }> = {};
  
  savedJobs.forEach(sj => {
    uniqueJobOptionsMap[sj.opportunityId] = {
      id: sj.opportunityId,
      title: sj.opportunity.title,
      companyName: sj.opportunity.company.name,
    };
  });

  appliedJobs.forEach(aj => {
    uniqueJobOptionsMap[aj.opportunityId] = {
      id: aj.opportunityId,
      title: aj.opportunity.title,
      companyName: aj.opportunity.company.name,
    };
  });

  const jobOptions = Object.values(uniqueJobOptionsMap);

  return (
    <ResumeOptimizerClient
      optimizations={mappedOpts}
      jobOptions={jobOptions}
      hasResume={hasResume}
    />
  );
}
