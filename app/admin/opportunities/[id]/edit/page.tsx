import React from 'react';
import { prisma } from '@/lib/db';
import { OpportunityRepository } from '@/lib/repositories/opportunity';
import { OpportunityForm } from '@/components/OpportunityForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditOpportunityPage(props: PageProps) {
  const { id } = await props.params;

  // 1. Fetch opportunity by ID
  const opportunity = await OpportunityRepository.findById(id);
  
  if (!opportunity) {
    notFound();
  }

  // 2. Fetch all companies for select list
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Edit Opportunity
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Modify the specifications or details of the job listing.
        </p>
      </div>

      <OpportunityForm
        companies={companies}
        initialData={opportunity}
        opportunityId={id}
      />
    </div>
  );
}
