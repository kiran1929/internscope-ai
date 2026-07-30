'use client';

import React, { useTransition } from 'react';
import {
  Briefcase,
  Bookmark,
  Calendar,
  Compass,
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  Clock,
  Search,
  ExternalLink,
  Trash2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toggleSaveJobAction, deleteApplicationAction } from '@/app/actions/candidate';

interface CandidateDashboardClientProps {
  user: {
    email: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      skills: string[];
      preferredLocations: string[];
      preferredTechnologies: string[];
      graduationYear: number | null;
      major: string | null;
      headline: string | null;
      bio: string | null;
      githubUrl: string | null;
      linkedinUrl: string | null;
      portfolioUrl: string | null;
    } | null;
  };
  savedCount: number;
  applicationsCount: number;
  applications: {
    id: string;
    status: string;
    appliedAt: Date;
    notes: string | null;
    opportunity: {
      id: string;
      title: string;
      location: string;
      company: {
        name: string;
        logoUrl: string | null;
      };
    };
  }[];
  recommendations: {
    id: string;
    title: string;
    location: string;
    type: string;
    createdAt: Date;
    company: {
      name: string;
      logoUrl: string | null;
    };
    enrichment: {
      skills: string[];
      experienceLevel: string | null;
      salaryMin: number | null;
      salaryMax: number | null;
      salaryCurrency: string | null;
    } | null;
  }[];
  recentSearches: {
    id: string;
    query: string;
    createdAt: Date;
  }[];
  upcomingDeadlines: {
    id: string;
    title: string;
    deadline: Date;
    company: {
      name: string;
    };
  }[];
}

export default function CandidateDashboardClient({
  user,
  savedCount,
  applicationsCount,
  applications,
  recommendations,
  recentSearches,
  upcomingDeadlines,
}: CandidateDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Profile Completion Calculation
  const getProfileCompletion = () => {
    if (!user.profile) return 0;
    const fields = [
      user.profile.firstName,
      user.profile.lastName,
      user.profile.headline,
      user.profile.bio,
      user.profile.skills.length > 0 ? 'skills' : null,
      user.profile.preferredLocations.length > 0 ? 'locations' : null,
      user.profile.githubUrl,
      user.profile.linkedinUrl,
    ];
    const filled = fields.filter(x => x !== null && x !== undefined && x !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPct = getProfileCompletion();

  const handleUnsave = (id: string) => {
    startTransition(async () => {
      const res = await toggleSaveJobAction(id);
      if (res.success) {
        toast.success('Opportunity removed from bookmarks.');
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  const handleDeleteApp = (id: string) => {
    startTransition(async () => {
      const res = await deleteApplicationAction(id);
      if (res.success) {
        toast.success('Application untracked successfully.');
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white select-none">
      {/* Welcome header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Welcome back, {user.profile?.firstName || 'Candidate'} 👋
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Access matching postings, organize applications, and update preferred settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/internships"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Jobs</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-xs font-semibold text-white transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span>Manage Profile</span>
          </Link>
        </div>
      </div>

      {/* KPI Funnels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile completion card */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 hover:border-zinc-800 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Profile Setup</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-2xl font-extrabold text-white font-mono">{completionPct}%</p>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-900 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${completionPct}%` }} />
            </div>
            <p className="text-[10px] text-zinc-500">
              {completionPct === 100 ? 'All parameters configured.' : 'Complete setup to refine AI matches.'}
            </p>
          </div>
        </div>

        {/* Saved Jobs Card */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 hover:border-zinc-800 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bookmarks</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white font-mono">{savedCount}</p>
            <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1">
              <Link href="/saved" className="hover:text-emerald-400 flex items-center gap-0.5">
                View saved positions <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Tracked Applications Card */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 hover:border-zinc-800 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Funnel</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white font-mono">{applicationsCount}</p>
            <p className="text-[10px] text-zinc-500 mt-1.5">
              <Link href="/applications" className="hover:text-primary flex items-center gap-0.5">
                Open tracker dashboard <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Deadlines Card */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 hover:border-zinc-800 transition-all shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Deadlines</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white font-mono">{upcomingDeadlines.length}</p>
            <p className="text-[10px] text-zinc-500 mt-1.5">
              {upcomingDeadlines.length > 0 ? 'Positions closing soon.' : 'No urgent closures tracked.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main dashboard body split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 columns: AI Recommended Positions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-primary" /> Personalized AI Recommendations
            </h3>
            <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase">
              Real-time matching active
            </span>
          </div>

          {recommendations.length === 0 ? (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-8 text-center text-zinc-500 space-y-2">
              <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs">No matching opportunities found. Update your skills in profile setup.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.map((job) => (
                <div
                  key={job.id}
                  className="bg-[#111113] border border-zinc-850 hover:border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/jobs/${job.id}`} className="text-xs font-bold text-zinc-100 hover:text-primary transition-colors block truncate max-w-[170px]">
                          {job.title}
                        </Link>
                        <p className="text-[10px] text-zinc-500 font-semibold">{job.company.name}</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-950 font-mono text-zinc-400 capitalize">
                        {job.type.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[10px] text-zinc-400 font-mono">{job.location}</p>

                    {/* Expose extracted skills */}
                    {job.enrichment?.skills && job.enrichment.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {job.enrichment.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-[8px] bg-zinc-950 text-zinc-400 border border-zinc-900 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-900 mt-4 pt-3 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-mono">
                      {job.enrichment?.salaryMin
                        ? `$${Math.round(job.enrichment.salaryMin / 1000)}k+`
                        : 'Salary undisclosed'}
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold"
                    >
                      Apply Now <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 column: Deadlines, Telemetry, and Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Quick Actions</h4>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/internships"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-left transition-all text-xs"
              >
                <span className="text-zinc-300 font-semibold">Search Jobs & Internships</span>
                <Compass className="w-4 h-4 text-zinc-500" />
              </Link>
              <Link
                href="/applications"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-left transition-all text-xs"
              >
                <span className="text-zinc-300 font-semibold">Track Active Applications</span>
                <Briefcase className="w-4 h-4 text-zinc-500" />
              </Link>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Deadlines Coming Up</h4>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-[10px] text-zinc-500 text-center py-2">No upcoming job deadlines logged.</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded bg-zinc-950 border border-zinc-900">
                    <div>
                      <Link href={`/jobs/${item.id}`} className="font-semibold text-zinc-200 hover:text-primary transition-colors block truncate max-w-[130px]">
                        {item.title}
                      </Link>
                      <p className="text-[9px] text-zinc-500 font-mono">{item.company.name}</p>
                    </div>
                    <span className="text-[9px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      {new Date(item.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Search Queries */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Recent Searches</h4>
            {recentSearches.length === 0 ? (
              <p className="text-[10px] text-zinc-500 text-center py-2">No recent queries logged.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((item) => (
                  <span
                    key={item.id}
                    className="text-[9px] bg-zinc-950 text-zinc-400 border border-zinc-900 px-2 py-1 rounded flex items-center gap-1 font-mono"
                  >
                    <Search className="w-2.5 h-2.5" />
                    {item.query}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
