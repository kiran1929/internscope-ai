import React from 'react';
import { prisma } from '@/lib/db';
import { CompanyRepository } from '@/lib/repositories/company';
import { CompaniesTable, TableCompany } from '@/components/CompaniesTable';
import { CompaniesFilters } from '@/components/CompaniesFilters';
import { CompaniesPagination } from '@/components/CompaniesPagination';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    industry?: string;
    hiringStatus?: string;
    verified?: string;
    country?: string;
    companySize?: string;
    sortBy?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminCompaniesPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // 1. Parse Search & Filter variables
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const limit = searchParams.limit ? parseInt(searchParams.limit, 10) : 10;
  
  const search = searchParams.search || undefined;
  const industry = searchParams.industry || undefined;
  const hiringStatus = searchParams.hiringStatus || undefined;
  const isVerified =
    searchParams.verified === 'true'
      ? true
      : searchParams.verified === 'false'
      ? false
      : undefined;
  const country = searchParams.country || undefined;
  const companySize = searchParams.companySize || undefined;

  const sortBy =
    (searchParams.sortBy as
      | 'newest'
      | 'oldest'
      | 'alphabetical'
      | 'opportunities'
      | 'recently_updated') || 'newest';

  // 2. Fetch paginated records using the repository layer (excluding archived)
  const paginatedResult = await CompanyRepository.findMany({
    page,
    limit,
    search,
    industry,
    hiringStatus,
    isVerified,
    country,
    companySize,
    sortBy,
    isArchived: false,
  });

  // 3. Fetch unique distinct parameters to populate search filters
  const uniqueIndustries = await prisma.company.findMany({
    select: { industry: true },
    where: {
      industry: { not: null },
      isArchived: false,
    },
    distinct: ['industry'],
  });

  const uniqueCountries = await prisma.company.findMany({
    select: { country: true },
    where: {
      country: { not: null },
      isArchived: false,
    },
    distinct: ['country'],
  });

  const industries = uniqueIndustries
    .map((x) => x.industry as string)
    .filter(Boolean)
    .sort();
    
  const countries = uniqueCountries
    .map((x) => x.country as string)
    .filter(Boolean)
    .sort();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Manage Companies
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Build and optimize company specifications for the automated scraper engine.
          </p>
        </div>
        <Link
          href="/admin/companies/new"
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Company
        </Link>
      </div>

      {/* Filters Search panel */}
      <CompaniesFilters industries={industries} countries={countries} />

      {/* TanStack Companies listing grid */}
      <CompaniesTable data={paginatedResult.data as unknown as TableCompany[]} />

      {/* Pagination Controls */}
      <CompaniesPagination meta={paginatedResult.meta} />
    </div>
  );
}
