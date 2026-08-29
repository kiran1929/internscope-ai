'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

interface CompaniesFiltersProps {
  industries: string[];
  countries: string[];
}

export const CompaniesFilters: React.FC<CompaniesFiltersProps> = ({
  industries,
  countries,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load state parameters from URL search queries
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [industry, setIndustry] = useState(searchParams.get('industry') || '');
  const [hiringStatus, setHiringStatus] = useState(searchParams.get('hiringStatus') || '');
  const [verified, setVerified] = useState(searchParams.get('verified') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [companySize, setCompanySize] = useState(searchParams.get('companySize') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  const initialRender = useRef(true);

  // Sync state changes to searchParams
  const updateFilters = useCallback((updatedFields: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset page index on filter edits
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

  // Debounced search query trigger
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
    if (key === 'industry') setIndustry(val);
    if (key === 'hiringStatus') setHiringStatus(val);
    if (key === 'verified') setVerified(val);
    if (key === 'country') setCountry(val);
    if (key === 'companySize') setCompanySize(val);
    if (key === 'sortBy') setSortBy(val);

    updateFilters({ [key]: val });
  };

  const handleReset = () => {
    setSearch('');
    setIndustry('');
    setHiringStatus('');
    setVerified('');
    setCountry('');
    setCompanySize('');
    setSortBy('newest');

    router.push(pathname);
  };

  const hasActiveFilters =
    search ||
    industry ||
    hiringStatus ||
    verified ||
    country ||
    companySize ||
    sortBy !== 'newest';

  return (
    <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-4 space-y-4 shadow-sm ">
      {/* Search Input Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search companies by name, industry, website, location..."
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

        {/* Sorting Dropdown */}
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
            <option value="alphabetical">Alphabetical</option>
            <option value="opportunities">Opp Count</option>
            <option value="recently_updated">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Advanced Select Dropdowns Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 border-t border-zinc-900 pt-3">
        {/* Industry */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            Industry
          </label>
          <select
            value={industry}
            onChange={(e) => handleSelectChange('industry', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Hiring Status */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            Hiring Status
          </label>
          <select
            value={hiringStatus}
            onChange={(e) => handleSelectChange('hiringStatus', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="HIRING">Hiring</option>
            <option value="FREEZE">Freeze</option>
            <option value="NOT_HIRING">Closed</option>
          </select>
        </div>

        {/* Verified */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            Verification
          </label>
          <select
            value={verified}
            onChange={(e) => handleSelectChange('verified', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>

        {/* Country */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => handleSelectChange('country', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Company Size */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            Company Size
          </label>
          <select
            value={companySize}
            onChange={(e) => handleSelectChange('companySize', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Sizes</option>
            <option value="1-10">1 - 10</option>
            <option value="11-50">11 - 50</option>
            <option value="51-200">51 - 200</option>
            <option value="201-500">201 - 500</option>
            <option value="501-1000">501 - 1000</option>
            <option value="1000+">1000+</option>
          </select>
        </div>
      </div>

      {/* Active filters reset action button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-primary" /> Active filters configured
          </span>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};
