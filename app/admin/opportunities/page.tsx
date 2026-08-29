import React from 'react';
import { prisma } from '@/lib/db';
import { OpportunityRepository } from '@/lib/repositories/opportunity';
import { OpportunitiesTable } from '@/components/OpportunitiesTable';
import { OpportunitiesFilters } from '@/components/OpportunitiesFilters';
import { OpportunitiesPagination } from '@/components/OpportunitiesPagination';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { OpportunityType, RemoteType } from '@/lib/generated/prisma/enums';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    remoteType?: string;
    isActive?: string;
    isArchived?: string;
    companyId?: string;
    sortBy?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminOpportunitiesPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // 1. Parse Search & Filter variables
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const limit = searchParams.limit ? parseInt(searchParams.limit, 10) : 10;
  
  const search = searchParams.search || undefined;
  const type = searchParams.type ? (searchParams.type as OpportunityType) : undefined;
  const remoteType = searchParams.remoteType ? (searchParams.remoteType as RemoteType) : undefined;
  
  const companyId = searchParams.companyId || undefined;
  const sortBy =
    (searchParams.sortBy as 'newest' | 'oldest' | 'deadline' | 'company' | 'title') ||
    'newest';

  const isActive =
    searchParams.isActive === 'true'
      ? true
      : searchParams.isActive === 'false'
      ? false
      : undefined;

  const isArchived = searchParams.isArchived === 'true' ? true : false; // default false

  // 2. Fetch paginated records using the repository layer
  const paginatedResult = await OpportunityRepository.findMany({
    page,
    limit,
    search,
    type,
    remoteType,
    isActive,
    isArchived,
    companyId,
    sortBy,
  });

  // 3. Fetch tracked companies to populate the filters select dropdown
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
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Manage Opportunities
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Publish, edit, duplicate, or soft delete jobs in the InternScope AI index.
          </p>
        </div>
        <Link
          href="/admin/opportunities/new"
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Opportunity
        </Link>
      </div>

      {/* Filter panel */}
      <OpportunitiesFilters companies={companies} />

      {/* TanStack Opportunities grid table */}
      <OpportunitiesTable data={paginatedResult.data as unknown as Parameters<typeof OpportunitiesTable>[0]['data']} />

      {/* Server side Pagination bar */}
      <OpportunitiesPagination meta={paginatedResult.meta} />
    </div>
  );
}
