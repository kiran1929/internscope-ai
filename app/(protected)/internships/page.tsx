import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import { SearchService } from '@/lib/search/search-service';
import CandidateSearchClient from '@/components/CandidateSearchClient';

export const dynamic = 'force-dynamic';

export default async function InternshipsPage() {
  const user = await getAuthenticatedUser();

  // 1. Load initial search results using the backend SearchService
  const initialResults = await SearchService.search({
    limit: 10,
    offset: 0,
  });

  // 2. Load candidate's saved list
  const savedOpportunities = await prisma.savedOpportunity.findMany({
    where: { userId: user.id },
    select: { opportunityId: true },
  });
  const savedOpportunityIds = savedOpportunities.map((o) => o.opportunityId);

  // 3. Load candidate's tracked application IDs
  const trackedApps = await prisma.application.findMany({
    where: { userId: user.id },
    select: { opportunityId: true },
  });
  const trackedOpportunityIds = trackedApps.map((o) => o.opportunityId);

  // Map opportunities to serializable client format
  const mappedOpportunities = initialResults.opportunities.map((opp) => ({
    id: opp.id,
    title: opp.title,
    location: opp.location,
    type: opp.type.toString(),
    applicationUrl: opp.applicationUrl,
    createdAt: opp.createdAt,
    company: {
      id: opp.company.id,
      name: opp.company.name,
      logoUrl: opp.company.logoUrl,
    },
    enrichment: opp.enrichment ? {
      skills: opp.enrichment.skills,
      qualityScore: opp.enrichment.qualityScore,
      experienceLevel: opp.enrichment.experienceLevel,
      salaryMin: opp.enrichment.salaryMin,
    } : null,
  }));

  return (
    <CandidateSearchClient
      initialOpportunities={mappedOpportunities}
      initialTotal={initialResults.total}
      initialTotalPages={initialResults.totalPages}
      savedOpportunityIds={savedOpportunityIds}
      trackedOpportunityIds={trackedOpportunityIds}
    />
  );
}
