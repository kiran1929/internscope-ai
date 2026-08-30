'use client';

import React, { useMemo, useState } from 'react';
import { Search, Building, Plus, Check, X, RotateCcw } from 'lucide-react';
import { Company } from '@/types';
import { CompanyLogo } from './CompanyLogo';
import { cn } from '@/lib/utils';

type SearchBy = 'all' | 'name' | 'industry' | 'country';
type TrackingFilter = 'all' | 'tracking' | 'not-tracking';
type OpeningsFilter = 'all' | 'has-openings' | 'no-openings';

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

  const industries = useMemo(() => uniqueSorted(companies.map((company) => company.industry)), [companies]);
  const countries = useMemo(() => uniqueSorted(companies.map((company) => company.country)), [companies]);
  const hiringStatuses = useMemo(
    () => uniqueSorted(companies.map((company) => company.hiringStatus)),
    [companies]
  );

  const query = search.trim().toLowerCase();

  const filteredCompanies = companies.filter((company) => {
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

  return (
    <div className="page-shell animate-fade-in text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="page-header-title text-xl sm:text-2xl">Target Companies</h2>
          <p className="page-header-subtitle">Choose which companies you want our scrapers to monitor.</p>
        </div>
        <p className="text-xs text-text-muted font-medium">
          Showing {filteredCompanies.length} of {companies.length}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-stretch rounded-lg border border-border-subtle bg-input-bg overflow-hidden w-full max-w-[20rem]">
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
                className="text-text-muted hover:text-foreground"
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
          <option value="all">All companies</option>
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
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Grid of Companies */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className={cn(
                'dashboard-card p-5 flex flex-col justify-between min-h-[13rem]',
                company.isTracking && 'border-primary/45 shadow-[0_0_15px_rgba(37,99,235,0.04)]'
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
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
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
                    className="mt-2 text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded hover:bg-purple-500/20 font-bold block text-center w-full transition-all"
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
                    className="text-[10px] text-text-muted hover:text-foreground font-medium underline"
                  >
                    Visit Careers
                  </a>
                ) : (
                  <span className="text-[10px] text-text-muted">No careers page</span>
                )}
                <button
                  onClick={() => onToggleTrack(company.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200',
                    company.isTracking
                      ? 'bg-surface-muted hover:bg-border-subtle text-foreground'
                      : 'bg-primary hover:bg-blue-700 text-white shadow-md shadow-primary/10'
                  )}
                >
                  {company.isTracking ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
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
        <div className="border border-dashed border-border-subtle rounded-xl p-12 text-center max-w-lg mx-auto">
          <Building className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">No companies found</h3>
          <p className="text-xs text-text-muted mt-1">Try a different search field or clear the filters.</p>
        </div>
      )}

      {/* Razorpay Showcase Modal */}
      {selectedShowcaseCompany && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-zinc-850 rounded-xl max-w-2xl w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 text-white">
            <button
              onClick={() => setSelectedShowcaseCompany(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
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
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-200"
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
