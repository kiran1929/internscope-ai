import React from 'react';
import { UserRepository } from '@/lib/repositories/user';
import { UsersTable, TableUser } from '@/components/UsersTable';
import { UsersFilters } from '@/components/UsersFilters';
import { UsersPagination } from '@/components/UsersPagination';
import { Role } from '@/lib/generated/prisma/enums';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminUsersPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // Parse filters
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const limit = searchParams.limit ? parseInt(searchParams.limit, 10) : 10;
  
  const search = searchParams.search || undefined;
  const role = searchParams.role ? (searchParams.role as Role) : undefined;
  const isActive =
    searchParams.status === 'active'
      ? true
      : searchParams.status === 'suspended'
      ? false
      : undefined;

  const sortBy =
    (searchParams.sortBy as 'newest' | 'oldest' | 'name' | 'recently_updated') || 'newest';

  // Fetch paginated user records from repository
  const paginatedResult = await UserRepository.findMany({
    page,
    limit,
    search,
    role,
    isActive,
    sortBy,
  });

  return (
    <div className="space-y-6 select-none animate-fade-in text-white">
      {/* Header Panel */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Manage Users
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Review user profile completion rates, roles authorization, account states, and application metrics.
        </p>
      </div>

      {/* Filter panel */}
      <UsersFilters />

      {/* TanStack Table Grid */}
      <UsersTable data={paginatedResult.data as unknown as TableUser[]} />

      {/* Pagination Controls */}
      <UsersPagination meta={paginatedResult.meta} />
    </div>
  );
}
