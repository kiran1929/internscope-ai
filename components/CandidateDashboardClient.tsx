'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  toggleSaveJobAction,
  deleteApplicationAction,
  deleteRecentSearchAction,
  clearRecentSearchesAction,
} from '@/app/actions/candidate';

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
  recommendationsSlot: React.ReactNode;
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
  recommendationsSlot,
  recentSearches,
  upcomingDeadlines,
}: CandidateDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searches, setSearches] = useState(recentSearches);

  useEffect(() => {
    setSearches(recentSearches);
  }, [recentSearches]);

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

  const handleDeleteSearch = (e: React.MouseEvent, searchId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSearches((prev) => prev.filter((s) => s.id !== searchId));
    startTransition(async () => {
      const res = await deleteRecentSearchAction(searchId);
      if (res.success) {
        toast.success('Search query removed.');
      } else {
        toast.error(`Error: ${res.error}`);
        router.refresh();
      }
    });
  };

  const handleClearSearches = () => {
    setSearches([]);
    startTransition(async () => {
      const res = await clearRecentSearchesAction();
      if (res.success) {
        toast.success('Search history cleared.');
      } else {
        toast.error(`Error: ${res.error}`);
        router.refresh();
      }
    });
  };

  return (
    <div className="animate-fade-in text-foreground space-y-6 max-w-7xl mx-auto">
      {/* Welcome header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Welcome back, {user.profile?.firstName || 'Candidate'} 👋
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Access matching postings, organize applications, and update preferred settings.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/internships"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-bg text-xs font-semibold text-foreground hover:bg-surface-muted transition-all shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <span>Search Jobs</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-all shadow-xs shadow-primary/20"
          >
            <User className="w-3.5 h-3.5" />
            <span>Manage Profile</span>
          </Link>
        </div>
      </div>

      {/* KPI Funnels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Profile completion card */}
        <div className="bg-card-bg border border-border-subtle hover:border-indigo-500/40 rounded-xl p-4.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Profile Setup</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-2xl font-extrabold text-foreground font-mono leading-none">{completionPct}%</p>
            <div className="w-full bg-surface-muted rounded-full h-1.5 border border-border-subtle overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
            </div>
            <p className="text-[11px] text-text-muted">
              {completionPct === 100 ? 'All parameters configured.' : 'Complete setup to refine AI matches.'}
            </p>
          </div>
        </div>

        {/* Saved Jobs Card */}
        <div className="bg-card-bg border border-border-subtle hover:border-emerald-500/40 rounded-xl p-4.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Bookmarks</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-2xl font-extrabold text-foreground font-mono leading-none">{savedCount}</p>
            <p className="text-[11px] text-text-muted flex items-center gap-1">
              <Link href="/saved" className="hover:text-emerald-400 font-medium inline-flex items-center gap-0.5 transition-colors">
                View saved positions <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Tracked Applications Card */}
        <div className="bg-card-bg border border-border-subtle hover:border-primary/40 rounded-xl p-4.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Active Funnel</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-2xl font-extrabold text-foreground font-mono leading-none">{applicationsCount}</p>
            <p className="text-[11px] text-text-muted">
              <Link href="/applications" className="hover:text-primary font-medium inline-flex items-center gap-0.5 transition-colors">
                Open tracker dashboard <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Deadlines Card */}
        <div className="bg-card-bg border border-border-subtle hover:border-amber-500/40 rounded-xl p-4.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Deadlines</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-2xl font-extrabold text-foreground font-mono leading-none">{upcomingDeadlines.length}</p>
            <p className="text-[11px] text-text-muted">
              {upcomingDeadlines.length > 0 ? 'Positions closing soon.' : 'No urgent closures tracked.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main dashboard body split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {recommendationsSlot}

        {/* Right 1 column: Deadlines, Telemetry, and Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="dashboard-card p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border-subtle pb-2">Quick Actions</h4>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/internships"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-input-bg hover:bg-surface-muted text-left transition-all text-xs"
              >
                <span className="text-foreground font-semibold">Search Jobs & Internships</span>
                <Compass className="w-4 h-4 text-text-muted" />
              </Link>
              <Link
                href="/applications"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-input-bg hover:bg-surface-muted text-left transition-all text-xs"
              >
                <span className="text-foreground font-semibold">Track Active Applications</span>
                <Briefcase className="w-4 h-4 text-text-muted" />
              </Link>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="dashboard-card p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border-subtle pb-2">Deadlines Coming Up</h4>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-[10px] text-text-muted text-center py-2">No upcoming job deadlines logged.</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-surface-muted border border-border-subtle">
                    <div>
                      <Link href={`/jobs/${item.id}`} className="font-semibold text-foreground hover:text-primary transition-colors block truncate max-w-[130px]">
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-primary font-semibold truncate max-w-[130px]">{item.company.name}</span>
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
          <div className="dashboard-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Recent Searches</h4>
              {searches.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSearches}
                  className="text-[10px] text-text-muted hover:text-red-500 transition-colors font-medium cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
            {searches.length === 0 ? (
              <p className="text-[10px] text-text-muted text-center py-2">No recent queries logged.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {searches.map((item) => (
                  <Link
                    key={item.id}
                    href={`/internships?query=${encodeURIComponent(item.query)}`}
                    className="group inline-flex items-center gap-1.5 text-[11px] bg-surface-muted hover:bg-primary/10 text-text-muted hover:text-primary border border-border-subtle hover:border-primary/30 px-2.5 py-1 rounded-md font-medium transition-all duration-150 cursor-pointer shadow-2xs"
                    title={`Search for "${item.query}"`}
                  >
                    <Search className="w-2.5 h-2.5 text-text-muted group-hover:text-primary transition-colors" />
                    <span className="truncate max-w-[120px]">{item.query}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSearch(e, item.id)}
                      className="ml-0.5 opacity-60 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded transition-all"
                      title="Remove from history"
                      aria-label="Remove search"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
