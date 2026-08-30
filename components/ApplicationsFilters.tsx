'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { ApplicationStatus } from '@/lib/generated/prisma/enums';

interface Company {
  id: string;
  name: string;
}

interface Opportunity {
  id: string;
  title: string;
}

interface ApplicationsFiltersProps {
  companies: Company[];
  opportunities: Opportunity[];
}

export const ApplicationsFilters: React.FC<ApplicationsFiltersProps> = ({
  companies,
  opportunities,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load state from URL query parameters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [companyId, setCompanyId] = useState(searchParams.get('companyId') || '');
  const [opportunityId, setOpportunityId] = useState(searchParams.get('opportunityId') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  const initialRender = useRef(true);

  const updateFilters = useCallback((updatedFields: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // reset page

    Object.entries(updatedFields).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

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

  const handleSelectChange = (key: string, val: string) => {
    if (key === 'status') setStatus(val);
    if (key === 'companyId') setCompanyId(val);
    if (key === 'opportunityId') setOpportunityId(val);
    if (key === 'sortBy') setSortBy(val);

    updateFilters({ [key]: val });
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setCompanyId('');
    setOpportunityId('');
    setSortBy('newest');
    router.push(pathname);
  };

  const hasActiveFilters =
    search || status || companyId || opportunityId || sortBy !== 'newest';

  return (
    <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-4 space-y-4 shadow-sm text-white">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative w-full max-w-[20rem]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search applications by applicant name/email, opportunity, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                updateFilters({ search: null });
              }}
              className="absolute right-3 top-2.5 text-text-muted hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider shrink-0">
            Sort By
          </span>
          <select
            value={sortBy}
            onChange={(e) => handleSelectChange('sortBy', e.target.value)}
            className="bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2.5 py-2 outline-none focus:border-primary/60 transition-all cursor-pointer min-w-[120px]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="status">Status</option>
            <option value="recently_updated">Recently Updated</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-zinc-900 pt-3">
        {/* Status */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {Object.values(ApplicationStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Company */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            Company
          </label>
          <select
            value={companyId}
            onChange={(e) => handleSelectChange('companyId', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Opportunity */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            Opportunity
          </label>
          <select
            value={opportunityId}
            onChange={(e) => handleSelectChange('opportunityId', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Opportunities</option>
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-primary" /> Active filters configured
          </span>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset filters
          </button>
        </div>
      )}
    </div>
  );
};
