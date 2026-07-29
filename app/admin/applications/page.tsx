import React from 'react';
import { prisma } from '@/lib/db';
import { ApplicationRepository } from '@/lib/repositories/application';
import { ApplicationsTable, TableApplication } from '@/components/ApplicationsTable';
import { ApplicationsFilters } from '@/components/ApplicationsFilters';
import { ApplicationsPagination } from '@/components/ApplicationsPagination';
import { ApplicationStatus } from '@/lib/generated/prisma/enums';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    companyId?: string;
    opportunityId?: string;
    sortBy?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminApplicationsPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // Parse filters
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const limit = searchParams.limit ? parseInt(searchParams.limit, 10) : 10;
  
  const search = searchParams.search || undefined;
  const status = searchParams.status ? (searchParams.status as ApplicationStatus) : undefined;
  const companyId = searchParams.companyId || undefined;
  const opportunityId = searchParams.opportunityId || undefined;

  const sortBy =
    (searchParams.sortBy as 'newest' | 'oldest' | 'status' | 'recently_updated') || 'newest';

  // Fetch paginated applications from repository
  const paginatedResult = await ApplicationRepository.findMany({
    page,
    limit,
    search,
    status,
    companyId,
    opportunityId,
    sortBy,
  });

  // Fetch all companies and opportunities to populate filters selectors
  const [companies, opportunities] = await Promise.all([
    prisma.company.findMany({
      select: { id: true, name: true },
      where: { isArchived: false },
      orderBy: { name: 'asc' },
    }),
    prisma.opportunity.findMany({
      select: { id: true, title: true },
      where: { isArchived: false },
      orderBy: { title: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6 select-none animate-fade-in text-white">
      {/* Header Panel */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Manage Applications
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Monitor applicant statuses, timelines, resumes, and opportunity matching data.
        </p>
      </div>

      {/* Filters Search panel */}
      <ApplicationsFilters companies={companies} opportunities={opportunities} />

      {/* TanStack Table grid */}
      <ApplicationsTable data={paginatedResult.data as unknown as TableApplication[]} />

      {/* Pagination Controls */}
      <ApplicationsPagination meta={paginatedResult.meta} />
    </div>
  );
}
