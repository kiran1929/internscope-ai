'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Search, Compass, MapPin, Calendar, Sparkles, Plus, Check, Bookmark, ArrowUpRight, X, FileText, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toggleSaveJobAction, upsertApplicationAction, searchJobsAction } from '@/app/actions/candidate';
import { CandidateApplicationStatus } from '@/types/candidate';

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
  const [isPending, startTransition] = useTransition();

  // Search input & filters
  const [query, setQuery] = useState('');
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white ">
      
      {/* Search and Filters Section */}
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
        
        {/* Search bar row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-850 bg-zinc-950">
            <Search className="w-4.5 h-4.5 text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by role, company name, location coordinates, or tech..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-zinc-650"
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
              </button>
            )}
          </div>

          {/* Salary threshold */}
          <div className="space-y-1 px-1 text-xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Min Salary Expectation</span>
              </span>
              <span className="font-mono text-zinc-200">${Math.round(salaryMin / 1000)}k</span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="10000"
              value={salaryMin}
              onChange={(e) => setSalaryMin(Number(e.target.value))}
              className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <select
            value={remoteType}
            onChange={(e) => setRemoteType(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-300 outline-none"
          >
            <option value="">Workplace: All Modes</option>
            <option value="remote">Remote Only</option>
            <option value="hybrid">Hybrid Only</option>
            <option value="onsite">Onsite Only</option>
          </select>

          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-300 outline-none"
          >
            <option value="">Job Type: All Categories</option>
            <option value="internship">Internship Only</option>
            <option value="new_grad">Full-Time / New Grad</option>
          </select>

          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-300 outline-none"
          >
            <option value="">Experience: All Levels</option>
            <option value="Intern">Intern Only</option>
            <option value="Entry Level">Entry Level</option>
            <option value="Junior">Junior Level</option>
            <option value="Mid Level">Mid Level</option>
            <option value="Senior">Senior Level</option>
            <option value="Lead">Lead / Principal</option>
          </select>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-900 text-[10px]">
          <span className="text-zinc-500 font-bold uppercase mr-1">Popular Keywords:</span>
          {popularKeywords.map((tag) => (
            <button
              key={tag}
              onClick={() => selectPopularKeyword(tag)}
              className={`px-2.5 py-1 rounded-md transition-all font-mono ${
                query.toLowerCase() === tag.toLowerCase()
                  ? 'bg-primary text-white font-bold'
                  : 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:border-zinc-850'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

      </div>

      {/* Main Results Panel */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-zinc-500 font-semibold border-b border-zinc-900 pb-2">
          <span>Found {total} active opportunities</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {/* Results List */}
        {opportunities.length === 0 ? (
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-12 text-center text-zinc-500 space-y-3">
            <Compass className="w-8 h-8 text-zinc-700 mx-auto" />
            <h3 className="text-xs font-bold text-white">No positions match query</h3>
            <p className="text-[10px] text-zinc-650 max-w-sm mx-auto leading-relaxed">
              Try adjusting your salary filters, query keywords, or selection categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {opportunities.map((role) => {
              const isSaved = savedIds.includes(role.id);
              const isApplied = trackedOpportunityIds.includes(role.id);

              return (
                <div
                  key={role.id}
                  className="bg-[#111113] border border-zinc-850 hover:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {role.company.logoUrl ? (
                      <img
                        src={role.company.logoUrl}
                        alt={role.company.name}
                        className="w-11 h-11 rounded-lg bg-zinc-950 border border-zinc-900 object-contain p-1 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                        {role.company.name[0]}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/jobs/${role.id}`} className="text-xs font-bold text-zinc-100 hover:text-primary transition-colors block max-w-[250px] sm:max-w-md truncate">
                          {role.title}
                        </Link>
                        <span className="text-[9px] font-bold bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded text-zinc-400 uppercase">
                          {role.company.name}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {role.location}
                        </span>
                        <span className="capitalize">{role.type.toLowerCase().replace('_', ' ')}</span>
                      </div>

                      {/* Extracted Skills */}
                      {role.enrichment?.skills && role.enrichment.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {role.enrichment.skills.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="text-[8px] font-semibold font-mono text-zinc-400 bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-900">
                    {role.enrichment?.qualityScore && (
                      <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        {Math.round(role.enrichment.qualityScore * 100)}% Match
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSave(role.id)}
                        disabled={isPending}
                        className={`p-2 rounded-lg border transition-all ${
                          isSaved ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={isSaved ? 'Remove Bookmark' : 'Bookmark job'}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setSelectedJobId(role.id)}
                        disabled={isApplied}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all hover:cursor-pointer ${
                          isApplied
                            ? 'bg-zinc-900 border border-zinc-850 text-zinc-500 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/95 text-white shadow-sm'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Tracked</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Track Job</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/jobs/${role.id}`}
                        className="p-1.5 rounded-lg border border-zinc-900 bg-zinc-950 text-[10px] font-bold text-zinc-300 hover:bg-zinc-900 flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      {role.applicationUrl && (
                        <a
                          href={role.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-primary/40 bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/20 flex items-center gap-1"
                          title="Open Direct Application Page"
                        >
                          <span>Apply</span>
                          <ExternalLink className="w-3 h-3" />
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
          <div className="pt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => handleSearch(page - 1)}
              disabled={isPending || page === 1}
              className="px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-950 text-xs text-zinc-400 hover:bg-zinc-900 transition-all disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-500 font-mono font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handleSearch(page + 1)}
              disabled={isPending || page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-zinc-850 bg-zinc-950 text-xs text-zinc-400 hover:bg-zinc-900 transition-all disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

      </div>

      {/* Track Application Dialog */}
      {selectedJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <form
            onSubmit={handleTrackSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-fade-in text-xs space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>Track application stage</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">Configure status filters for this position.</p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-400">Application Stage</label>
              <select
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value as CandidateApplicationStatus)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary"
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

            <div className="space-y-1">
              <label className="font-semibold text-zinc-400">Personal Notes / Timeline Updates</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Preparing online assessment questions. Sent email query."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedJobId(null)}
                className="px-3.5 py-1.5 border border-zinc-800 bg-zinc-950 text-zinc-300 rounded-lg hover:bg-zinc-900 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg font-bold transition-all shadow-md flex items-center gap-1.5 hover:cursor-pointer"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Stage</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
