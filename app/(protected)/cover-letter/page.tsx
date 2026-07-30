import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import CoverLetterStudioClient from '@/components/CoverLetterStudioClient';

export const dynamic = 'force-dynamic';

export default async function CoverLetterPage() {
  const user = await getAuthenticatedUser();

  // 1. Check if user has uploaded a resume
  const latestResume = await prisma.resume.findFirst({
    where: { userId: user.id },
    orderBy: { version: 'desc' },
  });

  const hasResume = !!latestResume;

  // 2. Fetch all cover letters logs for this user
  const coverLetters = await prisma.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      opportunity: { include: { company: true } },
      versions: { orderBy: { version: 'desc' } },
    },
  });

  // 3. Map cover letters to client structure
  const mappedLetters = coverLetters.map((cl) => ({
    id: cl.id,
    title: cl.title,
    createdAt: cl.createdAt,
    opportunityId: cl.opportunityId,
    opportunity: cl.opportunity ? {
      title: cl.opportunity.title,
      company: { name: cl.opportunity.company.name },
    } : null,
    versions: cl.versions.map((v) => ({
      id: v.id,
      version: v.version,
      content: v.content,
      style: v.style,
      createdAt: v.createdAt,
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
    <CoverLetterStudioClient
      coverLetters={mappedLetters}
      jobOptions={jobOptions}
      hasResume={hasResume}
    />
  );
}
