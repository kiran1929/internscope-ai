'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Building,
  Briefcase,
  Plus,
  Check,
  CheckCircle2,
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
type SortOption = 'openings_desc' | 'name_asc' | 'name_desc' | 'tracking_first';
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
  const [sortBy, setSortBy] = useState<SortOption>('openings_desc');
  const [selectedShowcaseCompany, setSelectedShowcaseCompany] = useState<Company | null>(null);
  const [selectedCompanyJobsModal, setSelectedCompanyJobsModal] = useState<Company | null>(null);
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());

  const toggleExpandCompany = (id: string) => {
    setExpandedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // View Mode & Pagination states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const totalCompanies = companies.length;
  const totalOpportunities = companies.reduce((acc, curr) => acc + (curr.activeOpeningsCount || 0), 0);

  const industries = useMemo(() => uniqueSorted(companies.map((company) => company.industry)), [companies]);
  const countries = useMemo(() => uniqueSorted(companies.map((company) => company.country)), [companies]);

  const query = search.trim().toLowerCase();

  const filteredAndSortedCompanies = useMemo(() => {
    const filtered = companies.filter((company) => {
      const matchesSearch = matchesSearchQuery(company, query, searchBy);
      const matchesIndustry = !industryFilter || company.industry === industryFilter;
      const matchesCountry = !countryFilter || company.country === countryFilter;
      const matchesHiringStatus =
        !hiringStatusFilter ||
        (hiringStatusFilter === 'HIRING'
          ? company.activeOpeningsCount > 0 && company.hiringStatus !== 'FREEZE'
          : hiringStatusFilter === 'FREEZE'
          ? company.hiringStatus === 'FREEZE'
          : company.activeOpeningsCount === 0 || company.hiringStatus === 'NOT_HIRING');
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

    return filtered.sort((a, b) => {
      if (sortBy === 'openings_desc') {
        const diff = (b.activeOpeningsCount || 0) - (a.activeOpeningsCount || 0);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'tracking_first') {
        if (a.isTracking && !b.isTracking) return -1;
        if (!a.isTracking && b.isTracking) return 1;
        return (b.activeOpeningsCount || 0) - (a.activeOpeningsCount || 0);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [companies, query, searchBy, industryFilter, countryFilter, hiringStatusFilter, filterType, openingsFilter, sortBy]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, searchBy, industryFilter, countryFilter, hiringStatusFilter, filterType, openingsFilter, sortBy]);

  const totalFiltered = filteredAndSortedCompanies.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCompanies = filteredAndSortedCompanies.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    searchBy !== 'all' ||
    Boolean(industryFilter) ||
    Boolean(countryFilter) ||
    Boolean(hiringStatusFilter) ||
    filterType !== 'all' ||
    openingsFilter !== 'all' ||
    sortBy !== 'openings_desc';

  const resetFilters = () => {
    setSearch('');
    setSearchBy('all');
    setIndustryFilter('');
    setCountryFilter('');
    setHiringStatusFilter('');
    setFilterType('all');
    setOpeningsFilter('all');
    setSortBy('openings_desc');
  };

  const selectClassName =
    'bg-input-bg border border-border-subtle text-xs text-foreground rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/60 transition-all cursor-pointer h-8';

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
    <div className="animate-fade-in text-foreground space-y-3.5 max-w-7xl mx-auto">
      {/* Top Header & Stat Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Target Companies</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Monitor engineering fleets and track active internship opportunities in real-time
          </p>
        </div>

        {/* Total stats counters */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-card-bg border border-border-subtle shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Building className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] text-text-muted uppercase font-bold tracking-wider leading-none">Total Companies</p>
              <p className="text-sm font-bold text-foreground mt-0.5 leading-none">{totalCompanies}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-card-bg border border-border-subtle shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] text-text-muted uppercase font-bold tracking-wider leading-none">Total Opportunities</p>
              <p className="text-sm font-bold text-foreground mt-0.5 leading-none">{totalOpportunities}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 bg-surface-muted/40 p-2.5 rounded-xl border border-border-subtle">
        {/* Filter items row */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="flex items-stretch rounded-lg border border-border-subtle bg-input-bg overflow-hidden w-full sm:w-64 h-8 focus-within:border-primary/50 transition-colors">
            <div className="relative flex items-center gap-1.5 px-2.5 flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                placeholder={SEARCH_PLACEHOLDERS[searchBy]}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search companies"
                className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder:text-text-muted/70 py-1"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="text-text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <select
              id="company-search-by"
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value as SearchBy)}
              className="shrink-0 border-l border-border-subtle bg-transparent text-[11px] text-text-muted px-2 outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="name">Name</option>
              <option value="industry">Industry</option>
              <option value="country">Country</option>
            </select>
          </div>

          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className={selectClassName}
          >
            <option value="">All industries</option>
            {industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
          </select>

          {countries.length > 0 && (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="">All countries</option>
              {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          )}

          <select
            value={hiringStatusFilter}
            onChange={(e) => setHiringStatusFilter(e.target.value)}
            className={selectClassName}
          >
            <option value="">All statuses</option>
            <option value="HIRING">Hiring</option>
            <option value="NOT_HIRING">Not hiring</option>
            <option value="FREEZE">Hiring freeze</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TrackingFilter)}
            className={selectClassName}
          >
            <option value="all">All tracking</option>
            <option value="tracking">Tracking</option>
            <option value="not-tracking">Not tracking</option>
          </select>

          <select
            value={openingsFilter}
            onChange={(e) => setOpeningsFilter(e.target.value as OpeningsFilter)}
            className={selectClassName}
          >
            <option value="all">All openings</option>
            <option value="has-openings">Has openings</option>
            <option value="no-openings">No openings</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort companies by"
            className={cn(selectClassName, 'border-primary/40 text-primary font-semibold')}
          >
            <option value="openings_desc">Sort: Most Openings</option>
            <option value="name_asc">Sort: Name (A–Z)</option>
            <option value="name_desc">Sort: Name (Z–A)</option>
            <option value="tracking_first">Sort: Tracked First</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-card-bg"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-border-subtle">
          <span className="text-xs text-text-muted font-medium">
            Showing <span className="text-foreground font-semibold">{totalFiltered === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, totalFiltered)}</span> of <span className="text-foreground font-semibold">{totalFiltered}</span>
          </span>

          <div className="flex items-center border border-border-subtle rounded-lg bg-input-bg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5 rounded-md transition-all cursor-pointer', viewMode === 'grid' ? 'bg-card-bg text-primary shadow-2xs font-semibold' : 'text-text-muted hover:text-foreground')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn('p-1.5 rounded-md transition-all cursor-pointer', viewMode === 'table' ? 'bg-card-bg text-primary shadow-2xs font-semibold' : 'text-text-muted hover:text-foreground')}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Companies Display */}
      {paginatedCompanies.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {paginatedCompanies.map((company) => {
              const hasOpenings = company.activeOpeningsCount > 0;
              return (
                <div
                  key={company.id}
                  className={cn(
                    'group relative bg-card-bg border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 gap-5 hover:border-sky-400/80 hover:shadow-[0_8px_30px_rgba(56,189,248,0.25)]',
                    company.isTracking ? 'border-primary/50 ring-1 ring-primary/20 shadow-xs shadow-primary/5' : 'border-border-subtle'
                  )}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/companies/${company.id}`} className="flex items-center gap-3 min-w-0 group/head">
                        <CompanyLogo logo={company.logo} logoUrl={company.logoUrl} websiteUrl={company.website} name={company.name} size="md" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-foreground group-hover/head:text-primary transition-colors truncate">{company.name}</h3>
                          <div className="text-[10px] text-text-muted mt-0.5">{company.country || 'Global'}</div>
                        </div>
                      </Link>
                      <span className="text-[10px] font-semibold text-text-muted bg-surface-muted border border-border-subtle px-2.5 py-1 rounded-full shrink-0 max-w-[110px] truncate">{company.industry}</span>
                    </div>

                    <div className="pt-0.5 flex items-center justify-between gap-2">
                      {company.hiringStatus === 'FREEZE' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          <span>Hiring freeze</span>
                        </div>
                      ) : hasOpenings ? (
                        <Link
                          href={`/companies/${company.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-xs font-semibold transition-all cursor-pointer text-left"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{company.activeOpeningsCount} active {company.activeOpeningsCount === 1 ? 'opening' : 'openings'}</span>
                          <span className="text-[10px] text-emerald-400/80 font-normal ml-0.5">→</span>
                        </Link>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-muted text-text-muted border border-border-subtle text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-muted/50"></span>
                          <span>No active openings</span>
                        </div>
                      )}
                    </div>

                    {company.opportunities && company.opportunities.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border-subtle/60">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted">
                          <span>Listed Roles</span>
                          <Link
                            href={`/companies/${company.id}`}
                            className="text-primary hover:underline cursor-pointer"
                          >
                            View all ({company.opportunities.length}) →
                          </Link>
                        </div>
                        <div className="space-y-1.5">
                          {company.opportunities.slice(0, 2).map((opp) => (
                            <Link
                              key={opp.id}
                              href={`/jobs/${opp.id}`}
                              className="block p-2 rounded-xl bg-surface-muted/60 hover:bg-surface-muted border border-border-subtle/50 transition-colors group/opp"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <p className="text-[11px] font-semibold text-foreground group-hover/opp:text-primary transition-colors truncate">{opp.title}</p>
                                <span className="text-[9px] uppercase px-1.5 py-0.2 bg-card-bg border border-border-subtle text-text-muted rounded shrink-0 font-mono">{opp.type.toLowerCase()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[9px] text-text-muted mt-0.5 font-mono">
                                <span>{opp.location || opp.remoteType || 'Multiple locations'}</span>
                                {opp.deadline && (
                                  <>
                                    <span>•</span>
                                    <span>Due {new Date(opp.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                  </>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {company.careerPage || company.website ? (
                    <div className="pt-3 border-t border-border-subtle flex items-center justify-end">
                      <a href={company.careerPage || company.website} target="_blank" rel="noreferrer" className="text-xs text-text-muted hover:text-foreground font-medium inline-flex items-center gap-1 transition-colors hover:underline">
                        Careers <ExternalLink className="w-3.5 h-3.5 text-text-muted/70" />
                      </a>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-card-bg shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted/50 text-text-muted font-semibold">
                  <th className="py-2.5 px-4">Company</th>
                  <th className="py-2.5 px-4">Industry</th>
                  <th className="py-2.5 px-4">Country</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Active Openings</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {paginatedCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-foreground">
                      <Link href={`/companies/${company.id}`} className="hover:text-primary hover:underline transition-colors">
                        {company.name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-text-muted">{company.industry}</td>
                    <td className="py-2.5 px-4 text-text-muted">{company.country || 'Global'}</td>
                    <td className="py-2.5 px-4">{company.hiringStatus}</td>
                    <td className="py-2.5 px-4">
                      {company.activeOpeningsCount > 0 ? (
                        <Link href={`/companies/${company.id}`} className="inline-flex items-center gap-1 font-bold text-foreground font-mono hover:text-primary transition-colors cursor-pointer group/tblrole">
                          <span>{company.activeOpeningsCount}</span>
                          <span className="text-[10px] text-text-muted group-hover/tblrole:text-primary">roles →</span>
                        </Link>
                      ) : <span className="font-mono text-text-muted">0 roles</span>}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/companies/${company.id}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-muted hover:bg-surface-elevated text-foreground border border-border-subtle"
                        >
                          View Openings
                        </Link>
                        <button
                          onClick={() => onToggleTrack(company.id)}
                          className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer', company.isTracking ? 'bg-surface-muted border' : 'bg-primary text-white')}
                        >
                          {company.isTracking ? 'Tracking' : 'Track'}
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
        <div className="border border-dashed border-border-subtle rounded-xl p-10 text-center">
          <Building className="w-7 h-7 text-text-muted mx-auto mb-2.5" />
          <h3 className="text-sm font-bold">No companies found</h3>
        </div>
      )}

      {/* Pagination Controls */}
      {totalFiltered > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border-subtle">
          <div className="text-xs text-text-muted">
            Page <span className="font-bold text-foreground">{currentPage}</span> of <span className="font-bold text-foreground">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-border-subtle bg-input-bg text-foreground disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {getPageNumbers().map((pageNum, idx) =>
              pageNum === 'ellipsis' ? (
                <span key={`e-${idx}`} className="px-2 text-xs text-text-muted">...</span>
              ) : (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={cn('w-7 h-7 rounded-lg text-xs font-semibold', currentPage === pageNum ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-muted')}
                >
                  {pageNum}
                </button>
              )
            )}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-border-subtle bg-input-bg text-foreground disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ALL JOBS MODAL FOR SELECTED COMPANY */}
      {selectedCompanyJobsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-surface-muted/30">
              <div className="flex items-center gap-3">
                <CompanyLogo
                  logo={selectedCompanyJobsModal.logo}
                  logoUrl={selectedCompanyJobsModal.logoUrl}
                  websiteUrl={selectedCompanyJobsModal.website}
                  name={selectedCompanyJobsModal.name}
                  size="md"
                />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedCompanyJobsModal.name} Opportunities
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {selectedCompanyJobsModal.opportunities?.length || 0} active listed roles • {selectedCompanyJobsModal.industry}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCompanyJobsModal(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-border-subtle/50">
              {selectedCompanyJobsModal.opportunities && selectedCompanyJobsModal.opportunities.length > 0 ? (
                selectedCompanyJobsModal.opportunities.map((opp, idx) => (
                  <div key={opp.id} className={cn('space-y-2', idx > 0 && 'pt-3')}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <a
                          href={`/jobs/${opp.id}`}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors leading-snug block"
                        >
                          {opp.title}
                        </a>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-text-muted">
                          <span className="px-2 py-0.5 rounded bg-surface-muted border border-border-subtle font-mono text-[10px] uppercase">
                            {opp.type.toLowerCase()}
                          </span>
                          <span>•</span>
                          <span>{opp.location || opp.remoteType || 'Multiple locations'}</span>
                          {opp.deadline && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-medium">
                                Deadline: {new Date(opp.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {opp.applicationUrl && (
                          <a
                            href={opp.applicationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-elevated text-text-muted hover:text-foreground text-xs font-semibold border border-border-subtle inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Direct Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <a
                          href={`/jobs/${opp.id}`}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs shadow-primary/20 inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Apply on Platform</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-text-muted space-y-2">
                  <Briefcase className="w-8 h-8 mx-auto text-text-muted/60" />
                  <p className="text-xs">No currently listed individual roles for this company.</p>
                  {selectedCompanyJobsModal.careerPage && (
                    <a
                      href={selectedCompanyJobsModal.careerPage}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold mt-2"
                    >
                      <span>Visit {selectedCompanyJobsModal.name} Official Career Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border-subtle bg-surface-muted/20 flex items-center justify-between">
              {selectedCompanyJobsModal.careerPage || selectedCompanyJobsModal.website ? (
                <a
                  href={selectedCompanyJobsModal.careerPage || selectedCompanyJobsModal.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-text-muted hover:text-foreground inline-flex items-center gap-1 transition-colors hover:underline"
                >
                  <span>Official Careers Portal</span>
                  <ExternalLink className="w-3 h-3 text-text-muted" />
                </a>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setSelectedCompanyJobsModal(null)}
                className="px-4 py-1.5 bg-surface-muted hover:bg-surface-elevated text-foreground border border-border-subtle rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCompanies;
