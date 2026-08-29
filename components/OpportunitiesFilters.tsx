'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { OpportunityType, RemoteType } from '@/lib/generated/prisma/enums';

interface Company {
  id: string;
  name: string;
}

interface OpportunitiesFiltersProps {
  companies: Company[];
}

export const OpportunitiesFilters: React.FC<OpportunitiesFiltersProps> = ({ companies }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load initial states from URL Search Params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [remoteType, setRemoteType] = useState(searchParams.get('remoteType') || '');
  const [status, setStatus] = useState(
    searchParams.get('isArchived') === 'true'
      ? 'archived'
      : searchParams.get('isActive') === 'true'
      ? 'published'
      : searchParams.get('isActive') === 'false'
      ? 'draft'
      : ''
  );
  const [companyId, setCompanyId] = useState(searchParams.get('companyId') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  const initialRender = useRef(true);

  // Synchronize state changes to URL search params
  const updateFilters = useCallback((updatedFields: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset page to 1 when changing filters
    params.set('page', '1');

    Object.entries(updatedFields).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  // Debounced search trigger
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      updateFilters({ search });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, updateFilters]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatus(val);

    if (val === 'published') {
      updateFilters({ isActive: 'true', isArchived: 'false' });
    } else if (val === 'draft') {
      updateFilters({ isActive: 'false', isArchived: 'false' });
    } else if (val === 'archived') {
      updateFilters({ isActive: null, isArchived: 'true' });
    } else {
      updateFilters({ isActive: null, isArchived: 'false' });
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setType('');
    setRemoteType('');
    setStatus('');
    setCompanyId('');
    setSortBy('newest');

    // Wipe all URL search parameters
    router.push(pathname);
  };

  const hasActiveFilters = search || type || remoteType || status || companyId || sortBy !== 'newest';

  return (
    <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-sm ">
      <div className="flex items-center gap-2 text-white pb-1">
        <Filter className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider">Search & Filters</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Search Bar */}
        <div className="relative col-span-1 sm:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, location, tags, company..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-9 pr-8 text-xs text-white placeholder:text-text-muted/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/60 outline-none transition-all"
          />
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-text-muted hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Opportunity Type */}
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            updateFilters({ type: e.target.value });
          }}
          className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-lg p-2 focus:border-primary/60 outline-none transition-all cursor-pointer"
        >
          <option value="">All Types</option>
          {Object.values(OpportunityType).map((t) => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>

        {/* Remote Type */}
        <select
          value={remoteType}
          onChange={(e) => {
            setRemoteType(e.target.value);
            updateFilters({ remoteType: e.target.value });
          }}
          className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-lg p-2 focus:border-primary/60 outline-none transition-all cursor-pointer"
        >
          <option value="">All Locations</option>
          {Object.values(RemoteType).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={handleStatusChange}
          className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-lg p-2 focus:border-primary/60 outline-none transition-all cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        {/* Company */}
        <select
          value={companyId}
          onChange={(e) => {
            setCompanyId(e.target.value);
            updateFilters({ companyId: e.target.value });
          }}
          className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-lg p-2 focus:border-primary/60 outline-none transition-all cursor-pointer"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-900 pt-3">
        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted uppercase font-bold shrink-0">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              updateFilters({ sortBy: e.target.value });
            }}
            className="bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg p-1.5 focus:border-primary/60 outline-none transition-all cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="deadline">Closest Deadline</option>
            <option value="company">Company Name</option>
            <option value="title">Job Title</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-white transition-colors bg-zinc-900 border border-zinc-850 hover:border-zinc-800 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Search Filters
          </button>
        )}
      </div>
    </div>
  );
};
