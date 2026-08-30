import React from 'react';
import { notFound } from 'next/navigation';
import { getCompanyWithOpportunities } from '@/app/actions/candidate';
import CompanyDetailClient from '@/components/CompanyDetailClient';

export const dynamic = 'force-dynamic';

interface CompanyPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params;
  const result = await getCompanyWithOpportunities(id);

  if (!result) {
    notFound();
  }

  return (
    <CompanyDetailClient
      company={result.company}
      initialOpportunities={result.opportunities}
    />
  );
}
