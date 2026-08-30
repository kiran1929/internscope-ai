'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Search,
  Building,
  Briefcase,
  Plus,
  Check,
  X,
  RotateCcw,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Company } from '@/types';
import { CompanyLogo } from './CompanyLogo';
import { cn } from '@/lib/utils';

type SearchBy = 'all' | 'name' | 'industry' | 'country';
type TrackingFilter = 'all' | 'tracking' | 'not-tracking';
type OpeningsFilter = 'all' | 'has-openings' | 'no-openings';
type ViewMode = 'grid' | 'table';

interface DashboardCompaniesProps {
  companies: Company[];
  onToggleTrack: (id: string) => void;
}

const SEARCH_PLACEHOLDERS: Record<SearchBy, string> = {
  all: 'Search companies...',
  name: 'Search by name...',
  industry: 'Search by industry...',
  country: 'Search by country...',
};

const HIRING_STATUS_LABELS: Record<string, string> = {
  HIRING: 'Hiring',
  FREEZE: 'Hiring freeze',
  NOT_HIRING: 'Not hiring',
};

function uniqueSorted(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort();
}

function matchesSearchQuery(company: Company, query: string, searchBy: SearchBy) {
  if (!query) return true;

  const name = company.name.toLowerCase();
  const industry = company.industry.toLowerCase();
  const country = (company.country || '').toLowerCase();

  if (searchBy === 'name') return name.includes(query);
  if (searchBy === 'industry') return industry.includes(query);
  if (searchBy === 'country') return country.includes(query);
  return name.includes(query) || industry.includes(query) || country.includes(query);
}

export const DashboardCompanies: React.FC<DashboardCompaniesProps> = ({
  companies,
  onToggleTrack
}) => {
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState<SearchBy>('all');
  const [industryFilter, setIndustryFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [hiringStatusFilter, setHiringStatusFilter] = useState('');
  const [filterType, setFilterType] = useState<TrackingFilter>('all');
  const [openingsFilter, setOpeningsFilter] = useState<OpeningsFilter>('all');
  const [selectedShowcaseCompany, setSelectedShowcaseCompany] = useState<Company | null>(null);

  // View Mode & Pagination states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const totalCompanies = companies.length;
  const totalOpportunities = companies.reduce((acc, curr) => acc + (curr.activeOpeningsCount || 0), 0);

  const industries = useMemo(() => uniqueSorted(companies.map((company) => company.industry)), [companies]);
  const countries = useMemo(() => uniqueSorted(companies.map((company) => company.country)), [companies]);
  const hiringStatuses = useMemo(
    () => uniqueSorted(companies.map((company) => company.hiringStatus)),
    [companies]
  );

  const query = search.trim().toLowerCase();

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch = matchesSearchQuery(company, query, searchBy);
      const matchesIndustry = !industryFilter || company.industry === industryFilter;
      const matchesCountry = !countryFilter || company.country === countryFilter;
      const matchesHiringStatus = !hiringStatusFilter || company.hiringStatus === hiringStatusFilter;
      const matchesTracking =
        filterType === 'all' ||
        (filterType === 'tracking' ? company.isTracking : !company.isTracking);
      const matchesOpenings =
        openingsFilter === 'all' ||
        (openingsFilter === 'has-openings'
          ? company.activeOpeningsCount > 0
          : company.activeOpeningsCount === 0);

      return (
        matchesSearch &&
        matchesIndustry &&
        matchesCountry &&
        matchesHiringStatus &&
        matchesTracking &&
        matchesOpenings
      );
    });
  }, [companies, query, searchBy, industryFilter, countryFilter, hiringStatusFilter, filterType, openingsFilter]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, searchBy, industryFilter, countryFilter, hiringStatusFilter, filterType, openingsFilter]);

  const totalFiltered = filteredCompanies.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    searchBy !== 'all' ||
    Boolean(industryFilter) ||
    Boolean(countryFilter) ||
    Boolean(hiringStatusFilter) ||
    filterType !== 'all' ||
    openingsFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setSearchBy('all');
    setIndustryFilter('');
    setCountryFilter('');
    setHiringStatusFilter('');
    setFilterType('all');
    setOpeningsFilter('all');
  };

  const selectClassName =
    'bg-input-bg border border-border-subtle text-xs text-foreground rounded-lg px-2.5 py-2 outline-none focus:border-primary/60 transition-all cursor-pointer';

  // Helper for generating pagination buttons
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="page-shell animate-fade-in text-foreground space-y-6">
      {/* Top Header & Stat Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h2 className="page-header-title text-xl sm:text-2xl">Target Companies</h2>
          <p className="page-header-subtitle mt-0.5">
            Choose which companies you want our scrapers to monitor.
          </p>
        </div>

        {/* Total stats counters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-muted/70 border border-border-subtle shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider leading-none">Total Companies</p>
              <p className="text-base font-bold text-foreground mt-1 leading-none">{totalCompanies}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-muted/70 border border-border-subtle shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider leading-none">Total Opportunities</p>
              <p className="text-base font-bold text-foreground mt-1 leading-none">{totalOpportunities}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-stretch rounded-lg border border-border-subtle bg-input-bg overflow-hidden w-full max-w-[18rem]">
            <div className="relative flex items-center gap-2 px-2.5 flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                placeholder={SEARCH_PLACEHOLDERS[searchBy]}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search companies"
                className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-text-muted/70 py-2"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="text-text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <label htmlFor="company-search-by" className="sr-only">
              Search by
            </label>
            <select
              id="company-search-by"
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value as SearchBy)}
              className="shrink-0 border-l border-border-subtle bg-transparent text-xs text-text-muted px-2 outline-none cursor-pointer"
            >
              <option value="all">All fields</option>
              <option value="name">Name</option>
              <option value="industry">Industry</option>
              <option value="country">Country</option>
            </select>
          </div>

          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            aria-label="Filter by industry"
            className={selectClassName}
          >
            <option value="">All industries</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>

          {countries.length > 0 && (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              aria-label="Filter by country"
              className={selectClassName}
            >
              <option value="">All countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          )}

          {hiringStatuses.length > 0 && (
            <select
              value={hiringStatusFilter}
              onChange={(e) => setHiringStatusFilter(e.target.value)}
              aria-label="Filter by hiring status"
              className={selectClassName}
            >
              <option value="">All hiring statuses</option>
              {hiringStatuses.map((status) => (
                <option key={status} value={status}>
                  {HIRING_STATUS_LABELS[status] || status}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TrackingFilter)}
            aria-label="Filter by tracking status"
            className={selectClassName}
          >
            <option value="all">All tracking</option>
            <option value="tracking">Tracking</option>
            <option value="not-tracking">Not tracking</option>
          </select>

          <select
            value={openingsFilter}
            onChange={(e) => setOpeningsFilter(e.target.value as OpeningsFilter)}
            aria-label="Filter by openings"
            className={selectClassName}
          >
            <option value="all">All openings</option>
            <option value="has-openings">Has openings</option>
            <option value="no-openings">No openings</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-foreground transition-colors cursor-pointer px-1.5 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* View Mode Toggle & Counter */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-text-muted font-medium hidden sm:inline">
            Showing {totalFiltered === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered}
          </span>

          <div className="flex items-center border border-border-subtle rounded-lg bg-surface-muted/60 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid View"
              title="Grid View"
              className={cn(
                'p-1.5 rounded-md transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-card-bg text-primary shadow-xs'
                  : 'text-text-muted hover:text-foreground'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table View"
              title="Table View"
              className={cn(
                'p-1.5 rounded-md transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-card-bg text-primary shadow-xs'
                  : 'text-text-muted hover:text-foreground'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Companies Display */}
      {paginatedCompanies.length > 0 ? (
        viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedCompanies.map((company) => (
              <div
                key={company.id}
                className={cn(
                  'dashboard-card p-5 flex flex-col justify-between min-h-[13rem] hover:border-primary/40 transition-all duration-250',
                  company.isTracking && 'border-primary/50 shadow-sm shadow-primary/5'
                )}
              >
                <div className="flex items-start justify-between">
                  <CompanyLogo logo={company.logo} logoUrl={company.logoUrl} websiteUrl={company.website} name={company.name} size="md" />
                  <span className="text-[10px] font-semibold text-text-muted bg-surface-muted border border-border-subtle px-2 py-0.5 rounded-full">
                    {company.industry}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-bold text-foreground">{company.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-text-muted font-medium">
                      {company.activeOpeningsCount} active roles monitored
                    </span>
                  </div>
                  {company.name.toLowerCase() === 'razorpay' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedShowcaseCompany(company);
                      }}
                      className="mt-2 text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded hover:bg-purple-500/20 font-bold block text-center w-full transition-all cursor-pointer"
                    >
                      ✨ Razorpay Showcase Mode
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                  {company.careerPage || company.website ? (
                    <a
                      href={company.careerPage || company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-text-muted hover:text-foreground font-medium underline inline-flex items-center gap-1"
                    >
                      Visit Careers
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-text-muted">No careers page</span>
                  )}
                  <button
                    onClick={() => onToggleTrack(company.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer',
                      company.isTracking
                        ? 'bg-surface-muted hover:bg-surface-elevated text-foreground border border-border-subtle'
                        : 'bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20'
                    )}
                  >
                    {company.isTracking ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Tracking</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* DENSE TABLE VIEW */
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-card-bg shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted/50 text-text-muted font-semibold">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Active Openings</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {paginatedCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-surface-muted/40 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <CompanyLogo
                          logo={company.logo}
                          logoUrl={company.logoUrl}
                          websiteUrl={company.website}
                          name={company.name}
                          size="sm"
                        />
                        <div>
                          <p className="font-bold text-foreground">{company.name}</p>
                          {company.careerPage || company.website ? (
                            <a
                              href={company.careerPage || company.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-text-muted hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                              Careers <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-medium text-text-muted bg-surface-muted border border-border-subtle px-2 py-0.5 rounded-md">
                        {company.industry}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {company.country || 'Global'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1',
                          company.hiringStatus === 'FREEZE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            company.hiringStatus === 'FREEZE' ? 'bg-amber-400' : 'bg-emerald-500'
                          )}
                        />
                        {HIRING_STATUS_LABELS[company.hiringStatus || 'HIRING'] || 'Hiring'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground font-mono">
                        {company.activeOpeningsCount}
                      </span>
                      <span className="text-[10px] text-text-muted ml-1">roles</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {company.name.toLowerCase() === 'razorpay' && (
                          <button
                            type="button"
                            onClick={() => setSelectedShowcaseCompany(company)}
                            className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded hover:bg-purple-500/20 font-semibold cursor-pointer"
                          >
                            Roadmap
                          </button>
                        )}
                        <button
                          onClick={() => onToggleTrack(company.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer',
                            company.isTracking
                              ? 'bg-surface-muted hover:bg-surface-elevated text-foreground border border-border-subtle'
                              : 'bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20'
                          )}
                        >
                          {company.isTracking ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Tracking</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Track</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="border border-dashed border-border-subtle rounded-xl p-12 text-center max-w-lg mx-auto">
          <Building className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">No companies found</h3>
          <p className="text-xs text-text-muted mt-1">Try a different search field or clear the filters.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalFiltered > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">
              Page <span className="font-bold text-foreground">{currentPage}</span> of{' '}
              <span className="font-bold text-foreground">{totalPages}</span>
            </span>

            {/* Page size picker */}
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-input-bg border border-border-subtle text-foreground rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
              >
                <option value={8}>8 / page</option>
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-border-subtle bg-card-bg text-text-muted hover:text-foreground hover:bg-surface-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-text-muted text-xs">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                    currentPage === p
                      ? 'bg-primary text-white border-primary shadow-xs shadow-primary/20'
                      : 'border-border-subtle bg-card-bg text-text-muted hover:text-foreground hover:bg-surface-muted'
                  )}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-border-subtle bg-card-bg text-text-muted hover:text-foreground hover:bg-surface-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Razorpay Showcase Modal */}
      {selectedShowcaseCompany && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-zinc-850 rounded-xl max-w-2xl w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 text-white">
            <button
              onClick={() => setSelectedShowcaseCompany(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-zinc-900 pb-4">
              <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-lg text-purple-400">
                R
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Razorpay Target Roadmap</h3>
                <p className="text-xs text-purple-400 mt-0.5">Showcase Mode: How to reach 90% compatibility</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[9px] block">Company hiring stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['React', 'Node.js', 'Redis', 'PHP', 'Go', 'System Design'].map(s => (
                      <span key={s} className="bg-zinc-950 border border-zinc-900 text-zinc-300 px-2.5 py-0.5 rounded text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[9px] block">Identified Gaps</span>
                  <div className="space-y-1.5 text-zinc-400">
                    <div className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                      <span>Missing backend caching expertise (Redis).</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                      <span>No production-grade Go or PHP backend exposure.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950/45 border border-zinc-900 rounded-xl p-4 space-y-4">
                <span className="font-bold text-primary uppercase tracking-wider text-[9px] block">Actionable Prep Roadmap</span>
                
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">1</div>
                    <div>
                      <span className="font-bold text-zinc-200 block">Learn Redis Caching</span>
                      <span className="text-[10px] text-zinc-500 block">Complete the AI Redis roadmap inside the Career tab (estimated 6 hours).</span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">2</div>
                    <div>
                      <span className="font-bold text-zinc-200 block">Tailor Resume for Razorpay</span>
                      <span className="text-[10px] text-zinc-500 block">Use the ATS optimizer inside the job detail page to highlight API scale.</span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">3</div>
                    <div>
                      <span className="font-bold text-zinc-200 block">Run Backend Mock Interview</span>
                      <span className="text-[10px] text-zinc-500 block">Start a Medium difficulty session in Interview page focusing on Redis & Go.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setSelectedShowcaseCompany(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-200 cursor-pointer"
              >
                Close Target Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCompanies;
