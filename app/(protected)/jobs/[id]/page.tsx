import React from 'react';
import { notFound } from 'next/navigation';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import JobDetailClient from '@/components/JobDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const user = await getAuthenticatedUser();
  const { id } = await params;

  // 1. Fetch the opportunity details
  const job = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      company: true,
      enrichment: true,
    },
  });

  if (!job || job.isArchived) {
    notFound();
  }

  // 2. Fetch bookmarks state
  const savedRecord = await prisma.savedOpportunity.findUnique({
    where: {
      userId_opportunityId: {
        userId: user.id,
        opportunityId: id,
      },
    },
  });

  // 3. Fetch application state
  const appRecord = await prisma.application.findUnique({
    where: {
      userId_opportunityId: {
        userId: user.id,
        opportunityId: id,
      },
    },
  });

  // 4. Fetch related jobs (other openings in the same company)
  const relatedJobs = await prisma.opportunity.findMany({
    where: {
      companyId: job.companyId,
      isActive: true,
      isArchived: false,
      NOT: { id },
    },
    take: 3,
    select: {
      id: true,
      title: true,
      location: true,
      company: { select: { name: true } },
    },
  });

  // 5. Fetch job matching analytics if user has a parsed resume
  const latestResume = await prisma.resume.findFirst({
    where: { userId: user.id, isParsed: true },
    orderBy: { version: 'desc' },
  });

  let jobMatch = null;
  if (latestResume) {
    jobMatch = await prisma.jobMatch.findUnique({
      where: {
        resumeId_opportunityId: {
          resumeId: latestResume.id,
          opportunityId: id,
        },
      },
    });
  }

  // Map to client formats
  const mappedJob = {
    id: job.id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    location: job.location,
    remoteType: job.remoteType.toString(),
    salaryRange: job.salaryRange,
    applicationUrl: job.applicationUrl,
    createdAt: job.createdAt,
    company: {
      id: job.company.id,
      name: job.company.name,
      logoUrl: job.company.logoUrl,
      websiteUrl: job.company.websiteUrl,
      industry: job.company.industry,
      description: job.company.description,
    },
    enrichment: job.enrichment ? {
      skills: job.enrichment.skills,
      techStack: job.enrichment.techStack,
      experienceLevel: job.enrichment.experienceLevel,
      employmentType: job.enrichment.employmentType,
      salaryMin: job.enrichment.salaryMin,
      salaryMax: job.enrichment.salaryMax,
      salaryCurrency: job.enrichment.salaryCurrency,
      salaryPeriod: job.enrichment.salaryPeriod,
      qualityScore: job.enrichment.qualityScore,
      reasoning: job.enrichment.reasoning,
    } : null,
  };

  return (
    <JobDetailClient
      job={mappedJob}
      isSaved={!!savedRecord}
      hasApplied={!!appRecord}
      currentStatus={appRecord?.status.toString()}
      relatedJobs={relatedJobs}
      jobMatch={jobMatch}
    />
  );
}
