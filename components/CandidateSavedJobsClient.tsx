'use client';

import React, { useState, useTransition } from 'react';
import { Bookmark, Search, Trash2, Plus, ArrowUpRight, Check, X, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toggleSaveJobAction, upsertApplicationAction } from '@/app/actions/candidate';
import { CandidateApplicationStatus } from '@/types/candidate';
import { CompanyLogo } from '@/components/CompanyLogo';

interface SavedOpportunity {
  id: string;
  savedAt: Date;
  opportunity: {
    id: string;
    title: string;
    location: string;
    type: string;
    applicationUrl: string;
    company: {
      name: string;
      logoUrl: string | null;
      websiteUrl: string | null;
    };
    enrichment: {
      skills: string[];
      qualityScore: number;
    } | null;
  };
}

interface CandidateSavedJobsClientProps {
  savedJobs: SavedOpportunity[];
  trackedOpportunityIds: string[];
}

export default function CandidateSavedJobsClient({
  savedJobs,
  trackedOpportunityIds,
}: CandidateSavedJobsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'title'>('newest');

  // Tracking modal state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<CandidateApplicationStatus>('DISCOVERED');
  const [notes, setNotes] = useState('');

  const handleRemove = (opportunityId: string) => {
    startTransition(async () => {
      const res = await toggleSaveJobAction(opportunityId);
      if (res.success) {
        toast.success('Bookmark removed.');
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
        toast.success('Opportunity tracked successfully!');
        setSelectedJobId(null);
        setNotes('');
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  // Filter and sort
  const filtered = savedJobs.filter((item) =>
    item.opportunity.title.toLowerCase().includes(search.toLowerCase()) ||
    item.opportunity.company.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'title') {
      return a.opportunity.title.localeCompare(b.opportunity.title);
    }
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
  });

  return (
    <div className="page-shell animate-fade-in text-foreground">
      <div>
        <h2 className="page-header-title text-xl sm:text-2xl">Saved Opportunities</h2>
        <p className="page-header-subtitle">Review opportunities you marked to apply for later.</p>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border-subtle bg-input-bg w-full sm:max-w-md">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search saved positions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder:text-text-muted/70"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'title')}
            className="bg-input-bg border border-border-subtle rounded-lg text-xs p-1.5 text-foreground outline-none focus:border-primary/50"
          >
            <option value="newest">Sort by Date Saved</option>
            <option value="title">Sort by Job Title</option>
          </select>
          <span className="text-xs text-text-muted font-semibold">
            Bookmarked: {sorted.length} positions
          </span>
        </div>
      </div>

      {/* Grid list */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((item) => {
            const isApplied = trackedOpportunityIds.includes(item.opportunity.id);

            return (
              <div
                key={item.id}
                className="dashboard-card p-5 flex flex-col justify-between hover:shadow-md transition-all min-h-[12rem]"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        logoUrl={item.opportunity.company.logoUrl}
                        websiteUrl={item.opportunity.company.websiteUrl}
                        applicationUrl={item.opportunity.applicationUrl}
                        name={item.opportunity.company.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary leading-snug truncate">
                          {item.opportunity.company.name}
                        </p>
                        <Link href={`/jobs/${item.opportunity.id}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors block truncate max-w-[170px] mt-0.5">
                          {item.opportunity.title}
                        </Link>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {item.opportunity.location}
                        </p>
                      </div>
                    </div>
                    {item.opportunity.enrichment?.qualityScore && (
                      <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {Math.round(item.opportunity.enrichment.qualityScore * 100)}% Match
                      </span>
                    )}
                  </div>

                  {item.opportunity.enrichment?.skills && item.opportunity.enrichment.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.opportunity.enrichment.skills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[8px] bg-zinc-950 text-zinc-500 border border-zinc-900 px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-900 pt-3 flex items-center justify-between">
                  <button
                    onClick={() => handleRemove(item.opportunity.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg border border-zinc-900 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 text-[10px] font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={item.opportunity.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-zinc-900 text-[10px] font-bold text-white bg-zinc-950 hover:bg-zinc-900 transition-all flex items-center gap-1"
                    >
                      <span>Apply</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => setSelectedJobId(item.opportunity.id)}
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-850 rounded-xl p-12 text-center max-w-lg mx-auto space-y-3">
          <Bookmark className="w-8 h-8 text-zinc-700 mx-auto" />
          <h3 className="text-xs font-bold text-white">No bookmarked positions</h3>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Configure search filters and bookmark opportunities to save them here.
          </p>
        </div>
      )}

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
                placeholder="e.g. Prepared cover letter. Submitted resume online."
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
