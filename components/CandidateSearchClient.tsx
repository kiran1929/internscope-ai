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
  const [employmentType, setEmploymentType] = useState('');
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
      
      {/* Search and Filters Section */}
      <div className="dashboard-card p-5 space-y-4 shadow-sm">
        
        {/* Search bar row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border-subtle bg-input-bg max-w-xl">
            <Search className="w-4 h-4 text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search by role, company, location, or tech stack..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-text-muted/70"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <X className="w-3.5 h-3.5 text-text-muted hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Salary threshold */}
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1 text-text-muted font-medium">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Min salary
              </span>
              <span className="font-mono text-foreground font-semibold">${Math.round(salaryMin / 1000)}k</span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="10000"
              value={salaryMin}
              onChange={(e) => setSalaryMin(Number(e.target.value))}
              className="w-full h-1.5 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <select
            value={remoteType}
            onChange={(e) => setRemoteType(e.target.value)}
            className="bg-input-bg border border-border-subtle rounded-lg p-2.5 text-sm text-foreground outline-none focus:border-primary/50"
          >
            <option value="">Workplace: All modes</option>
            <option value="remote">Remote only</option>
            <option value="hybrid">Hybrid only</option>
            <option value="onsite">Onsite only</option>
          </select>

          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="bg-input-bg border border-border-subtle rounded-lg p-2.5 text-sm text-foreground outline-none focus:border-primary/50"
          >
            <option value="">Job type: All categories</option>
            <option value="internship">Internship only</option>
            <option value="new_grad">Full-time / New grad</option>
          </select>

          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="bg-input-bg border border-border-subtle rounded-lg p-2.5 text-sm text-foreground outline-none focus:border-primary/50"
          >
            <option value="">Experience: All levels</option>
            <option value="Intern">Intern</option>
            <option value="Entry Level">Entry level</option>
            <option value="Junior">Junior</option>
            <option value="Mid Level">Mid level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead / Principal</option>
          </select>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border-subtle">
          <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wide mr-1">Popular:</span>
          {popularKeywords.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => selectPopularKeyword(tag)}
              className={`px-2.5 py-1 rounded-md transition-all text-xs font-medium ${
                query.toLowerCase() === tag.toLowerCase()
                  ? 'bg-primary text-white'
                  : 'bg-surface-muted border border-border-subtle text-text-muted hover:text-foreground hover:border-border-hover'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

      </div>

      {/* Main Results Panel */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm text-text-muted font-medium border-b border-border-subtle pb-2">
          <span>{total} active {total === 1 ? 'opportunity' : 'opportunities'}</span>
          <span className="font-mono text-xs">Page {page} of {totalPages}</span>
        </div>

        {/* Results List */}
        {opportunities.length === 0 ? (
          <div className="dashboard-card p-12 text-center space-y-3">
            <Compass className="w-10 h-10 text-text-muted/40 mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">No positions match your search</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
              Try adjusting filters, salary range, or search keywords.
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
                  className="dashboard-card p-5 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <CompanyLogo
                      logoUrl={role.company.logoUrl}
                      websiteUrl={role.company.websiteUrl}
                      applicationUrl={role.applicationUrl}
                      name={role.company.name}
                      size="md"
                    />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary leading-snug truncate">
                        {role.company.name}
                      </p>
                      <Link
                        href={`/jobs/${role.id}`}
                        className="text-base font-bold text-foreground hover:text-primary transition-colors block leading-snug line-clamp-2"
                      >
                        {role.title}
                      </Link>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {role.location}
                        </span>
                        <span className="hidden sm:inline text-border-subtle">•</span>
                        <span className="capitalize">{role.type.toLowerCase().replace('_', ' ')}</span>
                      </div>

                      {role.enrichment?.skills && role.enrichment.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {role.enrichment.skills.slice(0, 4).map((s) => (
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

                  {/* Right: Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border-subtle">
                    {role.enrichment?.qualityScore != null && (
                      <span className="text-xs font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
                        {Math.round(role.enrichment.qualityScore * 100)}% match
                      </span>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSave(role.id)}
                        disabled={isPending}
                        className={`p-2 rounded-lg border transition-all ${
                          isSaved
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'border-border-subtle hover:border-border-hover text-text-muted hover:text-foreground bg-input-bg'
                        }`}
                        title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedJobId(role.id)}
                        disabled={isApplied}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isApplied
                            ? 'bg-surface-muted border border-border-subtle text-text-muted cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/90 text-white shadow-sm'
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

                      <Link
                        href={`/jobs/${role.id}`}
                        className="px-3 py-1.5 rounded-lg border border-border-subtle bg-input-bg text-xs font-semibold text-foreground hover:bg-surface-muted flex items-center gap-1"
                      >
                        Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {role.applicationUrl && (
                        <a
                          href={role.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/15 flex items-center gap-1"
                        >
                          Apply
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleSearch(page - 1)}
              disabled={isPending || page === 1}
              className="px-4 py-2 rounded-lg border border-border-subtle bg-input-bg text-sm text-foreground hover:bg-surface-muted transition-all disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted font-mono">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handleSearch(page + 1)}
              disabled={isPending || page === totalPages}
              className="px-4 py-2 rounded-lg border border-border-subtle bg-input-bg text-sm text-foreground hover:bg-surface-muted transition-all disabled:opacity-50"
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
