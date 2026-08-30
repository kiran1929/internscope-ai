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
      <div className="bg-card-bg border border-border-subtle rounded-xl p-5 space-y-4 shadow-2xs">
        {/* Top Search Bar & Salary Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          <div className="lg:col-span-8 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-border-subtle bg-surface-muted/30 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search by role title, company name, location, or skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-text-muted/70"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="p-1 text-text-muted hover:text-foreground rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Salary threshold */}
          <div className="lg:col-span-4 flex items-center gap-3 px-3.5 py-2 rounded-lg border border-border-subtle bg-surface-muted/20">
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1 text-text-muted font-medium">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Min Comp
                </span>
                <span className="font-mono text-foreground font-bold">
                  {salaryMin > 0 ? `$${Math.round(salaryMin / 1000)}k+/yr` : 'Any salary'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200000"
                step="10000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-primary mt-1"
              />
            </div>
            {salaryMin > 0 && (
              <button
                type="button"
                onClick={() => setSalaryMin(0)}
                className="text-[10px] text-text-muted hover:text-foreground"
                title="Reset salary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={remoteType}
            onChange={(e) => setRemoteType(e.target.value)}
            className="bg-surface-muted/30 border border-border-subtle hover:border-border-hover rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="">Workplace: All Modes</option>
            <option value="remote">Remote only</option>
            <option value="hybrid">Hybrid only</option>
            <option value="onsite">Onsite only</option>
          </select>

          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="bg-surface-muted/30 border border-border-subtle hover:border-border-hover rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="">Job Type: All Categories</option>
            <option value="internship">Internships</option>
            <option value="new_grad">New Grad & Full-time</option>
          </select>

          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="bg-surface-muted/30 border border-border-subtle hover:border-border-hover rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="">Experience: All Levels</option>
            <option value="Intern">Intern</option>
            <option value="Entry Level">Entry Level</option>
            <option value="Junior">Junior</option>
            <option value="Mid Level">Mid Level</option>
            <option value="Senior">Senior</option>
          </select>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-border-subtle">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mr-1">Popular:</span>
          {popularKeywords.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => selectPopularKeyword(tag)}
              className={`px-2.5 py-0.5 rounded-md transition-all text-[11px] font-medium cursor-pointer ${
                query.toLowerCase() === tag.toLowerCase()
                  ? 'bg-primary text-white font-semibold shadow-xs'
                  : 'bg-surface-muted/60 border border-border-subtle text-text-muted hover:text-foreground hover:bg-surface-muted'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Results Panel */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs text-text-muted font-medium border-b border-border-subtle pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{total.toLocaleString()}</span>
            <span>active opportunities</span>
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-1" />}
          </div>
          <span className="font-mono text-xs text-text-muted">
            Page {page} of {totalPages || 1}
          </span>
        </div>

        {/* Results List */}
        {opportunities.length === 0 ? (
          <div className="bg-card-bg border border-border-subtle rounded-xl p-12 text-center space-y-3">
            <Compass className="w-10 h-10 text-text-muted/40 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No matching positions found</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
              Try adjusting your keyword query, workplace preference, or salary threshold.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {opportunities.map((role) => {
              const isSaved = savedIds.includes(role.id);
              const isApplied = trackedOpportunityIds.includes(role.id);

              return (
                <div
                  key={role.id}
                  className="group relative bg-card-bg border border-border-subtle hover:border-primary/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shadow-2xs"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <CompanyLogo
                      logoUrl={role.company.logoUrl}
                      websiteUrl={role.company.websiteUrl}
                      applicationUrl={role.applicationUrl}
                      name={role.company.name}
                      size="md"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-muted truncate">
                          {role.company.name}
                        </span>
                        {role.enrichment?.qualityScore != null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                            {Math.round(role.enrichment.qualityScore * 100)}% Match
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/jobs/${role.id}`}
                        className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors block line-clamp-1 leading-snug"
                        title={role.title}
                      >
                        {role.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-text-muted pt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-text-muted/70 shrink-0" />
                          <span className="truncate">{role.location || 'Remote'}</span>
                        </span>
                        <span className="text-border-subtle">•</span>
                        <span className="capitalize">{role.type.toLowerCase().replace('_', ' ')}</span>
                        {role.enrichment?.salaryMin && (
                          <>
                            <span className="text-border-subtle">•</span>
                            <span className="font-mono text-emerald-500 font-semibold">
                              ${Math.round(role.enrichment.salaryMin / 1000)}k+/yr
                            </span>
                          </>
                        )}
                      </div>

                      {role.enrichment?.skills && role.enrichment.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {role.enrichment.skills.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="text-[9px] font-medium text-text-muted bg-surface-muted/90 border border-border-subtle px-1.5 py-0.5 rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-border-subtle">
                    <button
                      type="button"
                      onClick={() => handleToggleSave(role.id)}
                      disabled={isPending}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        isSaved
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                          : 'border-border-subtle hover:border-border-hover text-text-muted hover:text-foreground bg-surface-muted/40'
                      }`}
                      title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedJobId(role.id)}
                      disabled={isApplied}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
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

                    {role.applicationUrl && (
                      <a
                        href={role.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-muted/80 border border-border-subtle text-xs font-semibold text-foreground hover:text-primary flex items-center gap-1 transition-all cursor-pointer"
                      >
                        Apply <ExternalLink className="w-3 h-3 text-text-muted" />
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
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-card-bg text-xs font-semibold text-foreground hover:bg-surface-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-card-bg text-xs font-semibold text-foreground hover:bg-surface-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
