import React from 'react';
import { getCompaniesDirectoryForUser } from '@/app/actions/candidate';
import { CompaniesPageClient } from '@/components/CompaniesPageClient';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const companies = await getCompaniesDirectoryForUser();

  return <CompaniesPageClient initialCompanies={companies} />;
}
