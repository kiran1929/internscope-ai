import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import CandidateSavedJobsClient from '@/components/CandidateSavedJobsClient';

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const user = await getAuthenticatedUser();

  // 1. Fetch saved opportunities
  const savedJobs = await prisma.savedOpportunity.findMany({
    where: { userId: user.id },
    orderBy: { savedAt: 'desc' },
    include: {
      opportunity: {
        include: {
          company: true,
          enrichment: true,
        },
      },
    },
  });

  // 2. Fetch tracked application IDs
  const trackedApps = await prisma.application.findMany({
    where: { userId: user.id },
    select: { opportunityId: true },
  });

  const trackedOpportunityIds = trackedApps.map((a) => a.opportunityId);

  const mappedSavedJobs = savedJobs.map((item) => ({
    id: item.id,
    savedAt: item.savedAt,
    opportunity: {
      id: item.opportunity.id,
      title: item.opportunity.title,
      location: item.opportunity.location,
      type: item.opportunity.type.toString(),
      applicationUrl: item.opportunity.applicationUrl,
      company: {
        name: item.opportunity.company.name,
        logoUrl: item.opportunity.company.logoUrl,
      },
      enrichment: item.opportunity.enrichment ? {
        skills: item.opportunity.enrichment.skills,
        qualityScore: item.opportunity.enrichment.qualityScore,
      } : null,
    },
  }));

  return (
    <CandidateSavedJobsClient
      savedJobs={mappedSavedJobs}
      trackedOpportunityIds={trackedOpportunityIds}
    />
  );
}
