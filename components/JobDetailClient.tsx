'use client';

import React, { useState, useTransition } from 'react';
import {
  Building,
  MapPin,
  Calendar,
  Briefcase,
  Clock,
  DollarSign,
  ChevronRight,
  Bookmark,
  Share2,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toggleSaveJobAction, upsertApplicationAction } from '@/app/actions/candidate';
import { CandidateApplicationStatus } from '@/types/candidate';

interface JobDetailClientProps {
  job: {
    id: string;
    title: string;
    description: string | null;
    requirements: string | null;
    location: string;
    remoteType: string;
    salaryRange: string | null;
    applicationUrl: string;
    createdAt: Date;
    company: {
      id: string;
      name: string;
      logoUrl: string | null;
      websiteUrl: string | null;
      industry: string | null;
      description: string | null;
    };
    enrichment: {
      skills: string[];
      techStack: any;
      experienceLevel: string | null;
      employmentType: string | null;
      salaryMin: number | null;
      salaryMax: number | null;
      salaryCurrency: string | null;
      salaryPeriod: string | null;
      qualityScore: number;
      reasoning: string | null;
    } | null;
  };
  isSaved: boolean;
  hasApplied: boolean;
  currentStatus?: string;
  relatedJobs: {
    id: string;
    title: string;
    location: string;
    company: {
      name: string;
    };
  }[];
}

export default function JobDetailClient({
  job,
  isSaved,
  hasApplied,
  currentStatus,
  relatedJobs,
}: JobDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(isSaved);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [appStatus, setAppStatus] = useState<CandidateApplicationStatus>(
    (currentStatus as CandidateApplicationStatus) || 'SAVED'
  );
  const [notes, setNotes] = useState('');

  const handleToggleSave = () => {
    setSaved(!saved);
    startTransition(async () => {
      const res = await toggleSaveJobAction(job.id);
      if (res.success) {
        setSaved(res.saved!);
        toast.success(res.saved ? 'Bookmark saved.' : 'Bookmark removed.');
        router.refresh();
      } else {
        setSaved(saved);
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await upsertApplicationAction(job.id, appStatus, notes);
      if (res.success) {
        toast.success('Opportunity tracked in your applications board!');
        setShowTrackModal(false);
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Job detail link copied to clipboard.');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/internships" className="hover:text-primary">Opportunities</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-zinc-300 truncate max-w-[150px]">{job.title}</span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4">
            {job.company.logoUrl ? (
              <img
                src={job.company.logoUrl}
                alt={job.company.name}
                className="w-14 h-14 rounded-lg bg-zinc-950 border border-zinc-800 object-contain p-1"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-lg text-primary">
                {job.company.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                {job.title}
              </h1>
              <p className="text-xs text-primary font-semibold mt-1">{job.company.name}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500 font-mono mt-2">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-400" /> {job.location}</span>
                <span>•</span>
                <span className="capitalize">{job.remoteType.toLowerCase()}</span>
                <span>•</span>
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleToggleSave}
              disabled={isPending}
              className={`p-2 rounded-lg border hover:bg-zinc-900 transition-all ${
                saved ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-800 text-zinc-400'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-900 transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowTrackModal(true)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg border font-bold text-xs transition-all flex items-center justify-center gap-1.5 hover:cursor-pointer ${
                hasApplied
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              {hasApplied ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{hasApplied ? `Tracked: ${currentStatus}` : 'Track Application'}</span>
            </button>

            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-xs font-bold text-white transition-all shadow-md"
            >
              <span>Apply Now</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Grid Content splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 columns: Description & details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#111113] border border-zinc-850 p-4 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block flex items-center gap-1"><DollarSign className="w-3 h-3" /> Salary Expectation</span>
              <span className="text-xs font-bold text-emerald-400">{job.salaryRange || 'Undisclosed'}</span>
            </div>

            <div className="bg-[#111113] border border-zinc-850 p-4 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block flex items-center gap-1"><Briefcase className="w-3 h-3" /> Experience level</span>
              <span className="text-xs font-bold text-zinc-200">{job.enrichment?.experienceLevel || 'Entry Level'}</span>
            </div>

            <div className="bg-[#111113] border border-zinc-850 p-4 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block flex items-center gap-1"><Clock className="w-3 h-3" /> Employment Type</span>
              <span className="text-xs font-bold text-zinc-200 capitalize">{job.enrichment?.employmentType?.toLowerCase() || 'Full-Time'}</span>
            </div>

            <div className="bg-[#111113] border border-zinc-850 p-4 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">AI Match Accuracy</span>
              <span className="text-xs font-bold text-primary font-mono">{job.enrichment?.qualityScore ? `${Math.round(job.enrichment.qualityScore * 100)}%` : '---'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Opportunity Description</h3>
            <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
              {job.description || 'No description provided.'}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Requirements</h3>
              <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                {job.requirements}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 column: Company details, skills, and related jobs */}
        <div className="space-y-6">
          
          {/* Enriched Skills & Technologies */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Target Skills</h4>
            {job.enrichment?.skills && job.enrichment.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {job.enrichment.skills.map((s) => (
                  <span key={s} className="text-[9px] bg-zinc-950 text-zinc-300 border border-zinc-900 px-2 py-1 rounded">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-zinc-500">No skills tags extracted.</p>
            )}
          </div>

          {/* Company Brief */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Company Coordinates</h4>
            <div className="text-xs space-y-2 text-zinc-400">
              <p className="font-semibold text-zinc-200">{job.company.name}</p>
              {job.company.industry && <p className="text-[10px]">Industry: {job.company.industry}</p>}
              {job.company.description && <p className="text-[10px] leading-relaxed line-clamp-4">{job.company.description}</p>}
              {job.company.websiteUrl && (
                <a
                  href={job.company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline font-bold inline-flex items-center gap-0.5 pt-1"
                >
                  Visit Website <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* Related Openings */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Related Openings</h4>
            {relatedJobs.length === 0 ? (
              <p className="text-[10px] text-zinc-500 text-center py-2">No other openings listed for this company.</p>
            ) : (
              <div className="space-y-2.5">
                {relatedJobs.map((rj) => (
                  <div key={rj.id} className="text-xs p-2 rounded bg-zinc-950 border border-zinc-900 space-y-1">
                    <Link href={`/jobs/${rj.id}`} className="font-bold text-zinc-200 hover:text-primary transition-colors block truncate">
                      {rj.title}
                    </Link>
                    <p className="text-[9px] text-zinc-500 font-mono">{rj.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Track Application Modal */}
      {showTrackModal && (
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
              <p className="text-[10px] text-zinc-500 mt-1">Organize this position in your applications pipeline.</p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-400">Application Stage</label>
              <select
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value as CandidateApplicationStatus)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary"
              >
                <option value="SAVED">Interested (Saved)</option>
                <option value="APPLIED">Applied (Submitted)</option>
                <option value="INTERVIEWING">Interview</option>
                <option value="OFFERED">Offer Received</option>
                <option value="REJECTED">Rejected</option>
                <option value="ACCEPTED">Accepted & Joined</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-400">Personal Notes / Timeline Updates</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Completed hacker-rank online assessment. Awaiting response."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTrackModal(false)}
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
