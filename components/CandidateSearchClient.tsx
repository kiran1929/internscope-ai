'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Search, Compass, MapPin, Calendar, Sparkles, Plus, Check, Bookmark, ArrowUpRight, X, FileText, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { toggleSaveJobAction, upsertApplicationAction, searchJobsAction } from '@/app/actions/candidate';
import { CandidateApplicationStatus } from '@/types/candidate';
import { CompanyLogo } from '@/components/CompanyLogo';

interface OpportunityItem {
  id: string;
  title: string;
  location: string;
  type: string;
  applicationUrl: string;
  createdAt: Date;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
  };
  enrichment: {
    skills: string[];
    qualityScore: number;
    experienceLevel: string | null;
    salaryMin: number | null;
  } | null;
}

interface CandidateSearchClientProps {
  initialOpportunities: OpportunityItem[];
  initialTotal: number;
  initialTotalPages: number;
  savedOpportunityIds: string[];
  trackedOpportunityIds: string[];
}

export default function CandidateSearchClient({
  initialOpportunities,
  initialTotal,
  initialTotalPages,
  savedOpportunityIds,
  trackedOpportunityIds,
}: CandidateSearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search input & filters
  const initialUrlQuery = searchParams.get('query') || searchParams.get('q') || '';
  const [query, setQuery] = useState(initialUrlQuery);
  const [remoteType, setRemoteType] = useState('');
  const [employmentType] = useState('internship');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [salaryMin, setSalaryMin] = useState<number>(0);
  
  // Results states
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(initialOpportunities);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(1);

  // Saved/Tracked local states
  const [savedIds, setSavedIds] = useState<string[]>(savedOpportunityIds);

  // Tracking modal dialog states
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<CandidateApplicationStatus>('DISCOVERED');
  const [notes, setNotes] = useState('');

  // Autocomplete suggestion states
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'company' | 'skill' | 'location' | null>(null);

  // Pre-configured popular searches
  const popularKeywords = ['React', 'TypeScript', 'Node.js', 'Python', 'Machine Learning', 'Docker'];

  // Trigger search when query or filters update
  const handleSearch = (targetPage = 1) => {
    startTransition(async () => {
      const res = await searchJobsAction({
        query: query || undefined,
        remoteType: remoteType || undefined,
        employmentType: employmentType || undefined,
        experienceLevel: experienceLevel || undefined,
        salaryMin: salaryMin > 0 ? salaryMin : undefined,
        limit: 10,
        offset: (targetPage - 1) * 10,
      });

      if (res.success) {
        setOpportunities(res.opportunities as OpportunityItem[]);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(targetPage);
      } else {
        toast.error(`Search error: ${res.error}`);
      }
    });
  };

  useEffect(() => {
    const urlParamQuery = searchParams.get('query') || searchParams.get('q');
    if (urlParamQuery !== null && urlParamQuery !== query) {
      setQuery(urlParamQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    // Debounced search trigger for input/filter changes
    const delayDebounceFn = setTimeout(() => {
      handleSearch(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, remoteType, employmentType, experienceLevel, salaryMin]);

  const handleToggleSave = (opportunityId: string) => {
    setSavedIds((prev) =>
      prev.includes(opportunityId) ? prev.filter((x) => x !== opportunityId) : [...prev, opportunityId]
    );

    startTransition(async () => {
      const res = await toggleSaveJobAction(opportunityId);
      if (res.success) {
        toast.success(res.saved ? 'Bookmark saved.' : 'Bookmark removed.');
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;

    startTransition(async () => {
      const res = await upsertApplicationAction(selectedJobId, appStatus, notes);
      if (res.success) {
        toast.success('Opportunity tracked in pipeline!');
        setSelectedJobId(null);
        setNotes('');
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  const selectPopularKeyword = (kw: string) => {
    setQuery(kw);
  };

  return (
    <div className="page-shell animate-fade-in text-foreground">
      
      {/* Compact Streamlined Filter Toolbar */}
      <div className="bg-card-bg border border-border-subtle rounded-xl p-3 space-y-2.5 shadow-2xs">
        {/* Main Single-Row Control Bar */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {/* Search Input */}
          <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3 h-9 rounded-lg border border-border-subtle bg-surface-muted/30 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search by role title, company name, location, or tech skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder:text-text-muted/70"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="p-0.5 text-text-muted hover:text-foreground rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Workplace Mode Dropdown */}
          <select
            value={remoteType}
            onChange={(e) => setRemoteType(e.target.value)}
            className="h-9 bg-surface-muted/40 border border-border-subtle hover:border-border-hover rounded-lg px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary/50 cursor-pointer shrink-0"
          >
            <option value="">Workplace: All Modes</option>
            <option value="remote">🏠 Remote Only</option>
            <option value="hybrid">⚡ Hybrid Only</option>
            <option value="onsite">🏢 On-site Only</option>
          </select>

          {/* Experience Level Dropdown */}
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="h-9 bg-surface-muted/40 border border-border-subtle hover:border-border-hover rounded-lg px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary/50 cursor-pointer shrink-0"
          >
            <option value="">Level: All Levels</option>
            <option value="Intern">🎯 Intern</option>
            <option value="Entry Level">🎯 Entry Level</option>
            <option value="Junior">🎯 Junior</option>
            <option value="Mid Level">🎯 Mid Level</option>
            <option value="Senior">🎯 Senior</option>
          </select>

          {/* Min Salary Dropdown */}
          <select
            value={salaryMin}
            onChange={(e) => setSalaryMin(Number(e.target.value))}
            className="h-9 bg-surface-muted/40 border border-border-subtle hover:border-border-hover rounded-lg px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary/50 cursor-pointer shrink-0"
          >
            <option value="0">Comp: Any Salary</option>
            <option value="20000">💰 $20k+/yr ($10+/hr)</option>
            <option value="40000">💰 $40k+/yr ($20+/hr)</option>
            <option value="60000">💰 $60k+/yr ($30+/hr)</option>
            <option value="80000">💰 $80k+/yr ($40+/hr)</option>
            <option value="100000">💰 $100k+/yr ($50+/hr)</option>
            <option value="120000">💰 $120k+/yr ($60+/hr)</option>
          </select>

          {/* Reset Filters Action */}
          {(query || remoteType || experienceLevel || salaryMin > 0) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setRemoteType('');
                setExperienceLevel('');
                setSalaryMin(0);
              }}
              className="h-9 px-2.5 rounded-lg border border-border-subtle bg-surface-muted/40 hover:bg-surface-muted text-xs font-semibold text-text-muted hover:text-foreground flex items-center gap-1 transition-all shrink-0 cursor-pointer"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Sub-row: Popular Keywords & Live Results Count in One Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mr-1">Popular:</span>
            {popularKeywords.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => selectPopularKeyword(tag)}
                className={`px-2 py-0.5 rounded-md transition-all text-[11px] font-medium cursor-pointer ${
                  query.toLowerCase() === tag.toLowerCase()
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'bg-surface-muted/60 border border-border-subtle text-text-muted hover:text-foreground hover:bg-surface-muted'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-text-muted font-medium ml-auto">
            <span className="font-bold text-foreground">{total.toLocaleString()}</span>
            <span>roles found</span>
            <span className="text-border-subtle">•</span>
            <span className="font-mono text-[11px]">Page {page} of {totalPages || 1}</span>
            {isPending && <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />}
          </div>
        </div>
      </div>

      {/* Main Results Panel */}
      <div className="space-y-3">
        {/* Results List */}
        {opportunities.length === 0 ? (
          <div className="bg-card-bg border border-border-subtle rounded-xl p-12 text-center space-y-3">
            <Compass className="w-10 h-10 text-text-muted/40 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No matching positions found</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
              Try broadening your keyword query or resetting workplace and compensation filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {opportunities.map((role) => {
              const isSaved = savedIds.includes(role.id);
              const isApplied = trackedOpportunityIds.includes(role.id);

              return (
                <div
                  key={role.id}
                  className="group relative bg-card-bg border border-border-subtle hover:border-primary/40 rounded-xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shadow-2xs"
                >
                  {/* Left Column: Logo & Explicit Role Details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <CompanyLogo
                      logoUrl={role.company.logoUrl}
                      websiteUrl={role.company.websiteUrl}
                      applicationUrl={role.applicationUrl}
                      name={role.company.name}
                      size="md"
                    />

                    <div className="space-y-2 min-w-0 flex-1">
                      {/* Top Header: Company Name & Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {role.company.name}
                        </span>

                        {role.enrichment?.qualityScore != null && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                            {Math.round(role.enrichment.qualityScore * 100)}% Match
                          </span>
                        )}

                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                          {role.type.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>

                      {/* Explicit Job Title */}
                      <Link
                        href={`/jobs/${role.id}`}
                        className="text-base font-bold text-foreground group-hover:text-primary transition-colors block line-clamp-1 leading-snug"
                        title={role.title}
                      >
                        {role.title}
                      </Link>

                      {/* Concrete Spec Badges (Location, Mode, Salary, Level) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Location */}
                        <div className="inline-flex items-center gap-1 text-text-muted bg-surface-muted/70 border border-border-subtle px-2 py-0.5 rounded-md text-[11px]">
                          <MapPin className="w-3 h-3 text-text-muted/70 shrink-0" />
                          <span>{role.location || 'Remote'}</span>
                        </div>

                        {/* Salary */}
                        <div className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <span>
                            {role.enrichment?.salaryMin
                              ? `$${Math.round(role.enrichment.salaryMin / 1000)}k+/yr`
                              : 'Competitive Pay'}
                          </span>
                        </div>

                        {/* Experience */}
                        {role.enrichment?.experienceLevel && (
                          <div className="inline-flex items-center gap-1 text-[11px] text-text-muted bg-surface-muted/70 border border-border-subtle px-2 py-0.5 rounded-md">
                            <span>Level: {role.enrichment.experienceLevel}</span>
                          </div>
                        )}
                      </div>

                      {/* Explicit Skills Strip */}
                      {role.enrichment?.skills && role.enrichment.skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Skills:</span>
                          {role.enrichment.skills.slice(0, 5).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] font-medium text-text-muted bg-surface-muted border border-border-subtle px-2 py-0.5 rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Clear Action Bar */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-subtle">
                    {/* Bookmark Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSave(role.id)}
                      disabled={isPending}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        isSaved
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                          : 'border-border-subtle hover:border-border-hover text-text-muted hover:text-foreground bg-surface-muted/40'
                      }`}
                      title={isSaved ? 'Saved to bookmarks' : 'Save opportunity'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>

                    {/* Track Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedJobId(role.id)}
                      disabled={isApplied}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isApplied
                          ? 'bg-surface-muted border border-border-subtle text-text-muted cursor-not-allowed'
                          : 'bg-primary hover:bg-primary-hover text-white shadow-xs'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Tracked
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Track
                        </>
                      )}
                    </button>

                    {/* View Details / Job Link */}
                    <Link
                      href={`/jobs/${role.id}`}
                      className="px-3 py-2 rounded-lg border border-border-subtle bg-surface-muted/40 hover:bg-surface-muted text-xs font-semibold text-foreground flex items-center gap-1 transition-all cursor-pointer"
                    >
                      Details
                    </Link>

                    {/* Direct Apply Action */}
                    {role.applicationUrl && (
                      <a
                        href={role.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shadow-emerald-600/20"
                      >
                        Apply <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleSearch(page - 1)}
              disabled={isPending || page === 1}
              className="px-3.5 py-1.5 rounded-lg border border-border-subtle bg-card-bg text-xs font-semibold text-foreground hover:bg-surface-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-text-muted font-mono px-3">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handleSearch(page + 1)}
              disabled={isPending || page === totalPages}
              className="px-3.5 py-1.5 rounded-lg border border-border-subtle bg-card-bg text-xs font-semibold text-foreground hover:bg-surface-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Track Application Dialog */}
      {selectedJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4">
          <form
            onSubmit={handleTrackSubmit}
            className="bg-card-bg border border-border-subtle rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-fade-in space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Track application stage
              </h3>
              <p className="text-sm text-text-muted mt-1">Set status and notes for this position.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Application stage</label>
              <select
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value as CandidateApplicationStatus)}
                className="w-full bg-input-bg border border-border-subtle rounded-lg p-2.5 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="DISCOVERED">Discovered</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="PREPARING">Preparing</option>
                <option value="APPLIED">Applied</option>
                <option value="OA">OA / Test</option>
                <option value="INTERVIEW">Interviewing</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Completed OA, waiting for recruiter reply..."
                className="w-full bg-input-bg border border-border-subtle rounded-lg p-2.5 text-sm text-foreground outline-none focus:border-primary/50 placeholder:text-text-muted/60 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedJobId(null)}
                className="px-4 py-2 border border-border-subtle bg-input-bg text-foreground rounded-lg hover:bg-surface-muted transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save stage
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
