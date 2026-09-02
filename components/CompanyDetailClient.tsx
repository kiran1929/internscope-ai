'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building,
  Briefcase,
  ExternalLink,
  Globe,
  MapPin,
  Clock,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Send,
  Search,
  Filter,
  Layers,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { toggleSaveJobAction, trackCompanyAction, untrackCompanyAction } from '@/app/actions/candidate';
import { isIndiaLocation, getLocationCategory } from '@/lib/location-utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface CompanyDetailPageOpportunity {
  id: string;
  title: string;
  type: string;
  location?: string | null;
  remoteType?: string | null;
  salaryRange?: string | null;
  applicationUrl?: string | null;
  deadline?: string | null;
  createdAt: string;
  isSaved: boolean;
  appliedStatus: string | null;
  enrichment?: {
    skills?: string[] | null;
    techStack?: string[] | null;
    experienceLevel?: string | null;
    qualityScore?: number | null;
  } | null;
}

export interface CompanyDetailCompany {
  id: string;
  name: string;
  logo: string;
  logoUrl?: string | null;
  website: string;
  careerPage?: string;
  industry: string;
  description: string;
  country?: string;
  hiringStatus?: string;
  companySize?: string;
  isTracking: boolean;
  activeOpeningsCount: number;
}

interface CompanyDetailClientProps {
  company: CompanyDetailCompany;
  initialOpportunities: CompanyDetailPageOpportunity[];
}

export default function CompanyDetailClient({
  company: initialCompany,
  initialOpportunities,
}: CompanyDetailClientProps) {
  const [company, setCompany] = useState<CompanyDetailCompany>(initialCompany);
  const [opportunities, setOpportunities] = useState<CompanyDetailPageOpportunity[]>(initialOpportunities);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRemote, setSelectedRemote] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'india' | 'outside_india'>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline_asc' | 'recent' | 'title'>('deadline_asc');

  // Tracking Toggle
  const handleToggleTrack = async () => {
    const nextState = !company.isTracking;
    setCompany((prev) => ({ ...prev, isTracking: nextState }));

    try {
      const res = nextState
        ? await trackCompanyAction(company.id)
        : await untrackCompanyAction(company.id);

      if (res.success) {
        toast.success(nextState ? `Tracking ${company.name}` : `Untracked ${company.name}`);
      } else {
        setCompany((prev) => ({ ...prev, isTracking: !nextState }));
        toast.error('Failed to update company tracking status');
      }
    } catch {
      setCompany((prev) => ({ ...prev, isTracking: !nextState }));
      toast.error('Failed to update company tracking status');
    }
  };

  // Bookmark / Save Toggle
  const handleToggleSave = async (oppId: string) => {
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp) return;

    const nextSaved = !opp.isSaved;
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, isSaved: nextSaved } : o))
    );

    try {
      const res = await toggleSaveJobAction(oppId);
      if (res.success) {
        toast.success(res.saved ? 'Role saved to your wishlist' : 'Role removed from saved');
      } else {
        setOpportunities((prev) =>
          prev.map((o) => (o.id === oppId ? { ...o, isSaved: !nextSaved } : o))
        );
        toast.error('Failed to update saved status');
      }
    } catch {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, isSaved: !nextSaved } : o))
      );
      toast.error('Failed to update saved status');
    }
  };

  // Unique types list
  const availableTypes = useMemo(() => {
    return Array.from(new Set(opportunities.map((o) => o.type))).filter(Boolean);
  }, [opportunities]);

  // Unique locations list scoped to selected region (so selecting Inside India only displays Indian cities)
  const availableLocations = useMemo(() => {
    let filteredOpps = opportunities;
    if (selectedRegion === 'india') {
      filteredOpps = opportunities.filter((o) => isIndiaLocation(o.location));
    } else if (selectedRegion === 'outside_india') {
      filteredOpps = opportunities.filter((o) => !isIndiaLocation(o.location));
    }

    const locs = filteredOpps
      .map((o) => o.location?.trim())
      .filter((loc): loc is string => Boolean(loc));
    return Array.from(new Set(locs)).sort();
  }, [opportunities, selectedRegion]);

  // Regional breakdown counts
  const { indiaCount, outsideIndiaCount } = useMemo(() => {
    let india = 0;
    let outside = 0;
    for (const opp of opportunities) {
      if (isIndiaLocation(opp.location)) {
        india += 1;
      } else {
        outside += 1;
      }
    }
    return { indiaCount: india, outsideIndiaCount: outside };
  }, [opportunities]);

  // Filtered & Sorted Opportunities
  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = opportunities.filter((opp) => {
      const matchesSearch =
        !query ||
        opp.title.toLowerCase().includes(query) ||
        (opp.location && opp.location.toLowerCase().includes(query)) ||
        (opp.enrichment?.skills && opp.enrichment.skills.some((s) => s.toLowerCase().includes(query)));

      const matchesType = selectedType === 'all' || opp.type === selectedType;

      const matchesRemote =
        selectedRemote === 'all' ||
        (selectedRemote === 'REMOTE'
          ? opp.remoteType === 'REMOTE' || opp.remoteType === 'HYBRID'
          : opp.remoteType === selectedRemote);

      const isIndia = isIndiaLocation(opp.location);
      const matchesRegion =
        selectedRegion === 'all' ||
        (selectedRegion === 'india' && isIndia) ||
        (selectedRegion === 'outside_india' && !isIndia);

      const matchesSpecificLocation =
        selectedLocation === 'all' || (opp.location && opp.location.trim() === selectedLocation);

      return matchesSearch && matchesType && matchesRemote && matchesRegion && matchesSpecificLocation;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'deadline_asc') {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });
  }, [opportunities, search, selectedType, selectedRemote, selectedRegion, selectedLocation, sortBy]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    selectedType !== 'all' ||
    selectedRemote !== 'all' ||
    selectedRegion !== 'all' ||
    selectedLocation !== 'all' ||
    sortBy !== 'deadline_asc';

  const resetFilters = () => {
    setSearch('');
    setSelectedType('all');
    setSelectedRemote('all');
    setSelectedRegion('all');
    setSelectedLocation('all');
    setSortBy('deadline_asc');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-foreground pb-12">
      {/* Back Button */}
      <div>
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to All Companies</span>
        </Link>
      </div>

      {/* Company Hero Header */}
      <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <CompanyLogo
              logo={company.logo}
              logoUrl={company.logoUrl}
              websiteUrl={company.website}
              name={company.name}
              size="lg"
            />
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight truncate">
                  {company.name}
                </h1>
                <span className="text-xs font-semibold text-text-muted bg-surface-muted border border-border-subtle px-2.5 py-0.5 rounded-full">
                  {company.industry}
                </span>
                {company.hiringStatus === 'FREEZE' ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Hiring freeze
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {opportunities.length} active {opportunities.length === 1 ? 'opening' : 'openings'}
                  </span>
                )}
              </div>

              {company.description && (
                <p className="text-xs text-text-muted max-w-3xl leading-relaxed line-clamp-2">
                  {company.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
                {company.country && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-text-muted/70" />
                    {company.country}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5 text-text-muted/70" />
                    Website
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {company.careerPage && (
                  <a
                    href={company.careerPage}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors hover:underline"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-text-muted/70" />
                    Official Careers
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {company.careerPage && (
              <a
                href={company.careerPage}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-surface-muted hover:bg-surface-elevated text-xs font-semibold text-foreground border border-border-subtle inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Career Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
              </a>
            )}

            <button
              onClick={handleToggleTrack}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs',
                company.isTracking
                  ? 'bg-surface-muted hover:bg-surface-elevated text-foreground border border-border-subtle'
                  : 'bg-primary hover:bg-primary-hover text-white shadow-primary/20'
              )}
            >
              {company.isTracking ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Tracking Company</span>
                </>
              ) : (
                <>
                  <Building className="w-4 h-4" />
                  <span>Track Company</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Location Region Quick Selector Chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-text-muted mr-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Region:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedRegion('all');
              setSelectedLocation('all');
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5',
              selectedRegion === 'all'
                ? 'bg-primary text-white border-primary shadow-xs shadow-primary/20'
                : 'bg-card-bg hover:bg-surface-muted text-text-muted hover:text-foreground border-border-subtle'
            )}
          >
            <span>All Locations</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                selectedRegion === 'all' ? 'bg-white/20 text-white' : 'bg-surface-muted text-text-muted'
              )}
            >
              {opportunities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRegion('india');
              setSelectedLocation('all');
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5',
              selectedRegion === 'india'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs shadow-emerald-500/20'
                : 'bg-card-bg hover:bg-surface-muted text-text-muted hover:text-foreground border-border-subtle'
            )}
          >
            <span>🇮🇳 Inside India</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                selectedRegion === 'india'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500/10 text-emerald-500'
              )}
            >
              {indiaCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRegion('outside_india');
              setSelectedLocation('all');
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5',
              selectedRegion === 'outside_india'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/20'
                : 'bg-card-bg hover:bg-surface-muted text-text-muted hover:text-foreground border-border-subtle'
            )}
          >
            <span>🌍 Outside India</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                selectedRegion === 'outside_india'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-500/10 text-blue-500'
              )}
            >
              {outsideIndiaCount}
            </span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-xs text-text-muted hover:text-foreground inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        {/* When Inside India is active: Show Major Indian Cities Quick Chips */}
        {selectedRegion === 'india' && availableLocations.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 bg-surface-muted/30 p-2 rounded-xl border border-emerald-500/20">
            <span className="text-[11px] font-bold text-emerald-400 mr-1 flex items-center gap-1">
              <span>🇮🇳 Indian Cities:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedLocation('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer',
                selectedLocation === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                  : 'bg-card-bg text-text-muted hover:text-foreground border-border-subtle'
              )}
            >
              All India ({indiaCount})
            </button>

            {availableLocations.map((loc) => {
              const count = opportunities.filter(
                (o) => isIndiaLocation(o.location) && o.location?.trim() === loc
              ).length;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelectedLocation(selectedLocation === loc ? 'all' : loc)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer flex items-center gap-1',
                    selectedLocation === loc
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-card-bg text-text-muted hover:text-foreground border-border-subtle hover:border-emerald-500/40'
                  )}
                >
                  <span>📍 {loc}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1 rounded-full',
                      selectedLocation === loc ? 'bg-white/20 text-white' : 'bg-surface-muted text-text-muted'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-surface-muted/40 p-3 rounded-xl border border-border-subtle">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Search Box */}
          <div className="relative flex items-center gap-2 bg-input-bg border border-border-subtle rounded-lg px-3 py-1.5 w-full sm:w-64 focus-within:border-primary/50 transition-colors h-9">
            <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <input
              type="text"
              placeholder={`Search ${company.name} openings, location...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder:text-text-muted/70"
            />
          </div>

          {/* Region Dropdown Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value as 'all' | 'india' | 'outside_india');
              setSelectedLocation('all');
            }}
            className="bg-input-bg border border-border-subtle text-xs text-foreground rounded-lg px-3 py-1.5 outline-none focus:border-primary/60 transition-all cursor-pointer h-9 font-medium"
          >
            <option value="all">📍 All Regions ({opportunities.length})</option>
            <option value="india">🇮🇳 Inside India ({indiaCount})</option>
            <option value="outside_india">🌍 Outside India ({outsideIndiaCount})</option>
          </select>

          {/* City / Specific Location Dropdown (strictly filtered by selected region) */}
          {availableLocations.length > 1 && (
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-input-bg border border-border-subtle text-xs text-foreground rounded-lg px-3 py-1.5 outline-none focus:border-primary/60 transition-all cursor-pointer h-9 max-w-[200px] truncate font-medium"
            >
              <option value="all">
                {selectedRegion === 'india'
                  ? `📍 All Indian Cities (${indiaCount})`
                  : selectedRegion === 'outside_india'
                  ? `🌍 All Global Cities (${outsideIndiaCount})`
                  : `📍 All Cities (${opportunities.length})`}
              </option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          )}

          {/* Type Filter */}
          {availableTypes.length > 1 && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-input-bg border border-border-subtle text-xs text-foreground rounded-lg px-3 py-1.5 outline-none focus:border-primary/60 transition-all cursor-pointer h-9"
            >
              <option value="all">All Role Types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').toLowerCase()}
                </option>
              ))}
            </select>
          )}

          {/* Remote Filter */}
          <select
            value={selectedRemote}
            onChange={(e) => setSelectedRemote(e.target.value)}
            className="bg-input-bg border border-border-subtle text-xs text-foreground rounded-lg px-3 py-1.5 outline-none focus:border-primary/60 transition-all cursor-pointer h-9"
          >
            <option value="all">All Work Modes</option>
            <option value="REMOTE">Remote / Hybrid</option>
            <option value="ON_SITE">On-site only</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-input-bg border border-border-subtle text-xs text-foreground rounded-lg px-3 py-1.5 outline-none focus:border-primary/60 transition-all cursor-pointer h-9"
          >
            <option value="deadline_asc">Sort: Nearest Deadline</option>
            <option value="recent">Sort: Recently Added</option>
            <option value="title">Sort: Role Title (A–Z)</option>
          </select>
        </div>

        <div className="text-xs text-text-muted font-medium shrink-0">
          Showing <span className="font-bold text-foreground">{filteredOpportunities.length}</span> of{' '}
          <span className="font-bold text-foreground">{opportunities.length}</span> openings
        </div>
      </div>

      {/* Opportunities List */}
      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredOpportunities.map((opp) => {
            const isIndia = isIndiaLocation(opp.location);
            return (
              <div
                key={opp.id}
                className="group bg-card-bg border border-border-subtle hover:border-primary/40 rounded-xl p-5 transition-all duration-200 hover:shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/jobs/${opp.id}`}
                      className="text-base font-bold text-foreground group-hover:text-primary transition-colors hover:underline"
                    >
                      {opp.title}
                    </Link>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-muted border border-border-subtle font-mono text-text-muted">
                      {opp.type.toLowerCase().replace('_', ' ')}
                    </span>

                    {/* Location Region Badge */}
                    {isIndia ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1">
                        <span>🇮🇳</span> Inside India
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                        <span>🌍</span> Outside India
                      </span>
                    )}

                    {opp.appliedStatus && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        Applied ({opp.appliedStatus})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-text-muted font-medium">
                    {/* Fetched Location */}
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <MapPin className={cn('w-3.5 h-3.5', isIndia ? 'text-emerald-500' : 'text-primary')} />
                      <span>{opp.location || opp.remoteType || 'Multiple locations'}</span>
                    </span>

                    {opp.remoteType && opp.remoteType !== 'ON_SITE' && (
                      <span className="text-[11px] text-text-muted bg-surface-muted px-2 py-0.2 rounded border border-border-subtle/60">
                        {opp.remoteType.toLowerCase()}
                      </span>
                    )}

                    {opp.deadline && (
                      <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        Due {new Date(opp.deadline).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}

                    {opp.salaryRange && (
                      <span>💰 {opp.salaryRange}</span>
                    )}
                  </div>

                  {opp.enrichment?.skills && opp.enrichment.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {opp.enrichment.skills.slice(0, 6).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-medium bg-surface-muted/80 text-text-muted border border-border-subtle/70 px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                      {opp.enrichment.skills.length > 6 && (
                        <span className="text-[10px] text-text-muted/60 self-center">
                          +{opp.enrichment.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle">
                  <button
                    type="button"
                    onClick={() => handleToggleSave(opp.id)}
                    className={cn(
                      'p-2 rounded-lg border transition-colors cursor-pointer',
                      opp.isSaved
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-surface-muted hover:bg-surface-elevated text-text-muted hover:text-foreground border-border-subtle'
                    )}
                    title={opp.isSaved ? 'Remove from saved' : 'Save opportunity'}
                  >
                    <Bookmark className={cn('w-4 h-4', opp.isSaved && 'fill-current')} />
                  </button>

                  {opp.applicationUrl && (
                    <a
                      href={opp.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-surface-muted hover:bg-surface-elevated text-text-muted hover:text-foreground text-xs font-semibold border border-border-subtle inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Direct Apply</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <Link
                    href={`/jobs/${opp.id}`}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs shadow-primary/20 inline-flex items-center gap-1.5 transition-all"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-border-subtle rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
          <Briefcase className="w-9 h-9 text-text-muted/60 mx-auto" />
          <h3 className="text-base font-bold text-foreground">
            {selectedRegion === 'india'
              ? `No openings inside India found for ${company.name}`
              : selectedRegion === 'outside_india'
              ? `No openings outside India found for ${company.name}`
              : 'No matching openings found'}
          </h3>
          <p className="text-xs text-text-muted">
            {selectedRegion !== 'all'
              ? `There are currently no active openings matching ${
                  selectedRegion === 'india' ? 'Inside India' : 'Outside India'
                } location criteria.`
              : `There are currently no openings matching your active search or filter criteria for ${company.name}.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all cursor-pointer shadow-xs shadow-primary/20 inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Show All {opportunities.length} Openings</span>
              </button>
            )}

            {company.careerPage && (
              <a
                href={company.careerPage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold"
              >
                <span>Check {company.name}&apos;s Official Career Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

