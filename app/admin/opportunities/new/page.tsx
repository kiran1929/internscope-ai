import React from 'react';
import { prisma } from '@/lib/db';
import { OpportunityForm } from '@/components/OpportunityForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    duplicate?: string;
  }>;
}

export default async function NewOpportunityPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const duplicateId = searchParams.duplicate;

  let initialData: Parameters<typeof OpportunityForm>[0]['initialData'] = undefined;

  // 1. If duplicate query parameter is set, fetch that opportunity to duplicate
  if (duplicateId) {
    const sourceOpp = await prisma.opportunity.findUnique({
      where: { id: duplicateId },
    });

    if (sourceOpp) {
      initialData = {
        title: `${sourceOpp.title} (Copy)`,
        companyId: sourceOpp.companyId,
        description: sourceOpp.description,
        requirements: sourceOpp.requirements,
        location: sourceOpp.location,
        remoteType: sourceOpp.remoteType,
        type: sourceOpp.type,
        salaryRange: sourceOpp.salaryRange,
        benefits: sourceOpp.benefits,
        applicationUrl: sourceOpp.applicationUrl,
        deadline: sourceOpp.deadline,
        isActive: sourceOpp.isActive,
        isArchived: sourceOpp.isArchived,
        tags: sourceOpp.tags,
      };
    }
  }

  // 2. Fetch all companies for the dropdown selector
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="space-y-6 select-none animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Create Opportunity
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Publish a new internship opening, hackathon, or new grad job in the index.
        </p>
      </div>

      <OpportunityForm companies={companies} initialData={initialData} />
    </div>
  );
}
