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
  FileText,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toggleSaveJobAction, upsertApplicationAction, generateApplicationCopilotAction } from '@/app/actions/candidate';
import { CandidateApplicationStatus } from '@/types/candidate';
import { CompanyLogo } from '@/components/CompanyLogo';
import { RichDescription } from '@/components/RichDescription';

interface JobDetailClientProps {
  job: {
    id: string;
    title: string;
    type?: string;
    description: string | null;
    requirements: string | null;
    location: string;
    remoteType: string;
    salaryRange: string | null;
    applicationUrl: string;
    tags?: string[];
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
  jobMatch?: {
    overallScore: number;
    skillScore: number;
    techScore: number;
    experienceScore: number;
    locationScore: number;
    employmentTypeScore: number;
    missingSkills: string[];
    missingTechnologies: string[];
    niceToHaveSkills: string[];
    strengthAreas: string[];
    improvementSuggestions: string[];
    matchExplanation: string | null;
  } | null;
}

export default function JobDetailClient({
  job,
  isSaved,
  hasApplied,
  currentStatus,
  relatedJobs,
  jobMatch,
}: JobDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(isSaved);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [appStatus, setAppStatus] = useState<CandidateApplicationStatus>(
    (currentStatus as CandidateApplicationStatus) || 'DISCOVERED'
  );
  const [notes, setNotes] = useState('');

  // AI Application Copilot states
  const [selectedCopilotTab, setSelectedCopilotTab] = useState<'resume' | 'cover-letter' | 'email' | 'questions' | null>(null);
  const [copilotText, setCopilotText] = useState('');
  const [isGeneratingCopilot, setIsGeneratingCopilot] = useState(false);

  const handleGenerateCopilot = async (type: 'resume' | 'cover-letter' | 'email' | 'questions') => {
    setSelectedCopilotTab(type);
    setIsGeneratingCopilot(true);
    setCopilotText('');
    const res = await generateApplicationCopilotAction(job.id, type);
    setIsGeneratingCopilot(false);
    if (res.success) {
      setCopilotText(res.text!);
      toast.success('Tailored copilot draft generated!');
    } else {
      toast.error(`Generation failed: ${res.error}`);
    }
  };

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
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white ">
      {/* Breadcrumb & Back action */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/internships" className="hover:text-primary">Internships</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-300 truncate max-w-[200px]">{job.title}</span>
        </div>
        <button
          onClick={() => router.push('/internships')}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 transition-colors"
        >
          ← Back to Internships
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4">
            <CompanyLogo
              logoUrl={job.company.logoUrl}
              websiteUrl={job.company.websiteUrl}
              applicationUrl={job.applicationUrl}
              name={job.company.name}
              size="lg"
            />
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
          {/* AI Match Insights */}
          {jobMatch && (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> AI Resume Match Insights
                </h3>
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                  {jobMatch.overallScore}% Overall Match
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {jobMatch.matchExplanation}
              </p>

              {/* Sub Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center text-[10px] font-mono text-zinc-400">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                  <span className="text-zinc-500 block">Skills:</span>
                  <span className="text-zinc-200 font-bold">{jobMatch.skillScore}%</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                  <span className="text-zinc-500 block">Tech Stack:</span>
                  <span className="text-zinc-200 font-bold">{jobMatch.techScore}%</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                  <span className="text-zinc-500 block">Experience:</span>
                  <span className="text-zinc-200 font-bold">{jobMatch.experienceScore}%</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                  <span className="text-zinc-500 block">Location:</span>
                  <span className="text-zinc-200 font-bold">{jobMatch.locationScore}%</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                  <span className="text-zinc-500 block">Work Mode:</span>
                  <span className="text-zinc-200 font-bold">{jobMatch.employmentTypeScore}%</span>
                </div>
              </div>

              {/* Missing Skills & Tech Stack */}
              {(jobMatch.missingSkills.length > 0 || jobMatch.missingTechnologies.length > 0) && (
                <div className="space-y-2 border-t border-zinc-900 pt-3 text-xs">
                  <span className="text-zinc-450 block font-semibold">Missing Requirements (Gaps):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {jobMatch.missingSkills.map((s) => (
                      <span key={s} className="text-[9px] bg-red-500/5 text-red-400 border border-red-500/10 px-2.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                    {jobMatch.missingTechnologies.map((t) => (
                      <span key={t} className="text-[9px] bg-red-500/5 text-red-400 border border-red-500/10 px-2.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {jobMatch.strengthAreas.length > 0 && (
                <div className="space-y-2 border-t border-zinc-900 pt-3 text-xs">
                  <span className="text-zinc-450 block font-semibold">Strengths:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[10px] text-emerald-400">
                    {jobMatch.strengthAreas.map((st, sidx) => (
                      <li key={sidx} className="font-sans leading-relaxed">{st}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {jobMatch.improvementSuggestions.length > 0 && (
                <div className="space-y-2 border-t border-zinc-900 pt-3 text-xs">
                  <span className="text-zinc-450 block font-semibold">Actionable Recommendations:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[10px] text-amber-500">
                    {jobMatch.improvementSuggestions.map((sug, suidx) => (
                      <li key={suidx} className="font-sans leading-relaxed">{sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#111113] border border-zinc-850 p-3.5 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block flex items-center gap-1"><DollarSign className="w-3 h-3" /> Compensation</span>
              <span className="text-xs font-bold text-emerald-400 truncate block">{job.salaryRange || 'Undisclosed'}</span>
            </div>

            <div className="bg-[#111113] border border-zinc-850 p-3.5 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block flex items-center gap-1"><Clock className="w-3 h-3" /> Program Timeline</span>
              <span className="text-xs font-bold text-indigo-300 truncate block">
                {(() => {
                  const t = job.title.toLowerCase();
                  const type = (job.type || '').toUpperCase();
                  if (type === 'FELLOWSHIP' || t.includes('fellowship') || t.includes('phd')) return 'Academic Year (9–12 Mos)';
                  if (type === 'HACKATHON' || t.includes('hackathon')) return 'Weekend Sprint (48 Hrs)';
                  if (type === 'RESEARCH' || t.includes('summer of code') || t.includes('gsoc')) return 'Summer (12–16 Wks)';
                  if (type === 'SCHOLARSHIP' || t.includes('scholarship')) return 'Annual Award';
                  if (type === 'NEW_GRAD' || t.includes('new grad') || t.includes('sde')) return 'Full-Time (Starting 2027)';
                  if (t.includes('step') || t.includes('explore') || t.includes('university')) return 'Summer 2027 (12 Wks)';
                  if (t.includes('fall') || t.includes('winter') || t.includes('spring')) return 'Semester Co-op (16 Wks)';
                  return 'Summer 2027 (10–12 Wks)';
                })()}
              </span>
            </div>

            <div className="bg-[#111113] border border-zinc-850 p-3.5 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block flex items-center gap-1"><Briefcase className="w-3 h-3" /> Experience</span>
              <span className="text-xs font-bold text-zinc-200 truncate block">{job.enrichment?.experienceLevel || 'Entry Level'}</span>
            </div>

            <div className="bg-[#111113] border border-zinc-850 p-3.5 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block flex items-center gap-1"><Clock className="w-3 h-3" /> Role Type</span>
              <span className="text-xs font-bold text-zinc-200 capitalize truncate block">{(job.type || 'INTERNSHIP').toLowerCase()}</span>
            </div>

            <div className="bg-[#111113] border border-zinc-850 p-3.5 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">AI Match Accuracy</span>
              <span className="text-xs font-bold text-primary font-mono block">{job.enrichment?.qualityScore ? `${Math.round(job.enrichment.qualityScore * 100)}%` : '95%'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Opportunity Description</h3>
            <RichDescription content={job.description} />
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Requirements</h3>
              <RichDescription content={job.requirements} />
            </div>
          )}

          {/* RAG Application Copilot */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Application Copilot</h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Generate personalized artifacts for this role powered by your parsed resume and target job requirements.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleGenerateCopilot('resume')}
                className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${
                  selectedCopilotTab === 'resume'
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                Tailored Resume Check
              </button>
              <button
                type="button"
                onClick={() => handleGenerateCopilot('cover-letter')}
                className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${
                  selectedCopilotTab === 'cover-letter'
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                Tailor Cover Letter
              </button>
              <button
                type="button"
                onClick={() => handleGenerateCopilot('email')}
                className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${
                  selectedCopilotTab === 'email'
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                Outreach Draft
              </button>
              <button
                type="button"
                onClick={() => handleGenerateCopilot('questions')}
                className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${
                  selectedCopilotTab === 'questions'
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                Q&A Answers
              </button>
            </div>

            {isGeneratingCopilot && (
              <div className="flex flex-col items-center justify-center py-10 space-y-2.5">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-zinc-500 font-mono">Formulating tailored artifacts...</span>
              </div>
            )}

            {!isGeneratingCopilot && copilotText && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center bg-zinc-950 border border-zinc-900 px-3 py-2 rounded-lg text-xs">
                  <span className="font-bold text-zinc-300 capitalize">{selectedCopilotTab} Draft</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(copilotText);
                      toast.success('Copied draft to clipboard.');
                    }}
                    className="text-primary hover:underline font-bold text-[10px]"
                  >
                    Copy Draft
                  </button>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-4 font-mono text-[10px] text-zinc-300 overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed font-sans">
                  {copilotText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 column: Company details, skills, and related jobs */}
        <div className="space-y-6">
          
          {/* Enriched Skills & Technologies */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Target Skills</h4>
            {(() => {
              const skills: string[] = (job.enrichment?.skills && job.enrichment.skills.length > 0)
                ? job.enrichment.skills
                : (job.tags && job.tags.length > 0)
                ? job.tags
                : ['Problem Solving', 'Communication', 'Technical Adaptability'];

              return (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s: string) => (
                    <span key={s} className="text-[9px] bg-zinc-950 text-zinc-300 border border-zinc-900 px-2 py-1 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              );
            })()}
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
