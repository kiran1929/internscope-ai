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
  ChevronRight,
  MapPin,
  Sparkles,
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
import { CompanyLogo } from '@/components/CompanyLogo';

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
    location?: string;
    deadline: Date;
    company: {
      name: string;
      logoUrl?: string | null;
      websiteUrl?: string | null;
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
    <div className="animate-fade-in text-foreground space-y-8 sm:space-y-10 max-w-7xl mx-auto pb-8">
      {/* Welcome header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Welcome back, {user.profile?.firstName || 'Candidate'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Access matching postings, organize applications, and update preferred settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/internships"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-subtle bg-card-bg text-xs font-semibold text-foreground hover:bg-surface-muted transition-all shadow-2xs"
          >
            <Search className="w-4 h-4 text-text-muted" />
            <span>Search Jobs</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-all shadow-md shadow-primary/20"
          >
            <User className="w-4 h-4" />
            <span>Manage Profile</span>
          </Link>
        </div>
      </div>

      {/* KPI Funnels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Profile completion card */}
        <div className="group relative bg-card-bg border border-border-subtle hover:border-indigo-500/40 rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between overflow-hidden gap-6">
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Profile Setup</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans leading-none">{completionPct}%</span>
              <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                {completionPct === 100 ? 'Complete' : 'In Progress'}
              </span>
            </div>

            <div className="w-full bg-surface-muted rounded-full h-2.5 border border-border-subtle overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-primary h-full rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>

            <p className="text-xs text-text-muted pt-1">
              <Link href="/profile" className="hover:text-indigo-400 font-medium inline-flex items-center gap-1 transition-colors group-hover:underline">
                Complete profile setup <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Saved Jobs Card */}
        <div className="group relative bg-card-bg border border-border-subtle hover:border-emerald-500/40 rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between overflow-hidden gap-6">
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Bookmarks</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bookmark className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans leading-none">{savedCount}</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {savedCount > 0 ? 'Saved' : 'Empty'}
              </span>
            </div>

            <p className="text-xs text-text-muted">
              {savedCount > 0 ? 'Positions shortlisted for review.' : 'No positions saved yet.'}
            </p>

            <p className="text-xs text-text-muted pt-1">
              <Link href="/saved" className="hover:text-emerald-400 font-medium inline-flex items-center gap-1 transition-colors group-hover:underline">
                View saved positions <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Tracked Applications Card */}
        <div className="group relative bg-card-bg border border-border-subtle hover:border-primary/40 rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between overflow-hidden gap-6">
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Funnel</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans leading-none">{applicationsCount}</span>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                Pipeline
              </span>
            </div>

            <p className="text-xs text-text-muted">
              {applicationsCount > 0 ? 'Active roles in pipeline stages.' : 'No active applications logged.'}
            </p>

            <p className="text-xs text-text-muted pt-1">
              <Link href="/applications" className="hover:text-primary font-medium inline-flex items-center gap-1 transition-colors group-hover:underline">
                Open tracker dashboard <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Deadlines Card */}
        <div className="group relative bg-card-bg border border-border-subtle hover:border-amber-500/40 rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between overflow-hidden gap-6">
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Deadlines</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans leading-none">{upcomingDeadlines.length}</span>
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {upcomingDeadlines.length > 0 ? 'Urgent' : 'Clear'}
              </span>
            </div>

            <p className="text-xs text-text-muted">
              {upcomingDeadlines.length > 0 ? 'Positions closing within 14 days.' : 'No urgent closures tracked.'}
            </p>

            <p className="text-xs text-text-muted pt-1">
              <Link href="/internships" className="hover:text-amber-400 font-medium inline-flex items-center gap-1 transition-colors group-hover:underline">
                Explore closing roles <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Main dashboard body split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {recommendationsSlot}

        {/* Right 1 column: Deadlines, Recent Searches, and Quick Actions */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" /> Deadlines Coming Up
              </h4>
              <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                Next 14 days
              </span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-6 text-center space-y-1.5">
                <Clock className="w-6 h-6 text-text-muted/40 mx-auto" />
                <p className="text-xs text-text-muted font-semibold">No urgent deadlines tracked</p>
                <p className="text-[11px] text-text-muted/70">Save roles to monitor upcoming closing dates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-muted/40 hover:bg-surface-muted border border-border-subtle hover:border-amber-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CompanyLogo
                        logoUrl={item.company.logoUrl}
                        websiteUrl={item.company.websiteUrl}
                        name={item.company.name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/jobs/${item.id}`}
                          className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors block line-clamp-1"
                          title={item.title}
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
                          <span className="font-semibold text-text-muted truncate">{item.company.name}</span>
                          {item.location && (
                            <>
                              <span className="text-border-subtle">•</span>
                              <span className="truncate">{item.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg shrink-0 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(item.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Search Queries */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Recent Searches
              </h4>
              {searches.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSearches}
                  className="text-[11px] text-text-muted hover:text-red-500 transition-colors font-semibold cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {searches.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-text-muted">Popular searches:</p>
                <div className="flex flex-wrap gap-2">
                  {['Frontend', 'Backend', 'AI / ML', 'Full Stack', 'Data Engineer', 'Remote'].map((tag) => (
                    <Link
                      key={tag}
                      href={`/internships?query=${encodeURIComponent(tag)}`}
                      className="text-xs bg-surface-muted hover:bg-primary/10 text-text-muted hover:text-primary border border-border-subtle hover:border-primary/30 px-3 py-1.5 rounded-lg font-medium transition-all shadow-2xs cursor-pointer"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {searches.map((item) => (
                  <Link
                    key={item.id}
                    href={`/internships?query=${encodeURIComponent(item.query)}`}
                    className="group inline-flex items-center gap-2 text-xs bg-surface-muted hover:bg-primary/10 text-text-muted hover:text-primary border border-border-subtle hover:border-primary/30 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer shadow-2xs"
                    title={`Search for "${item.query}"`}
                  >
                    <Search className="w-3 h-3 text-text-muted group-hover:text-primary transition-colors" />
                    <span className="truncate max-w-[130px]">{item.query}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSearch(e, item.id)}
                      className="ml-0.5 opacity-60 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded transition-all"
                      title="Remove from history"
                      aria-label="Remove search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions - Moved to bottom */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Quick Actions
              </h4>
              <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Direct Shortcuts</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <Link
                href="/internships"
                className="group flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-primary/40 bg-surface-muted/30 hover:bg-surface-muted transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">Search Jobs & Internships</p>
                    <p className="text-[11px] text-text-muted truncate">Explore 850+ live opportunities</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>

              <Link
                href="/applications"
                className="group flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-primary/40 bg-surface-muted/30 hover:bg-surface-muted transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">Application Pipeline</p>
                    <p className="text-[11px] text-text-muted truncate">Track stages & interviews</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>

              <Link
                href="/resume"
                className="group flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-primary/40 bg-surface-muted/30 hover:bg-surface-muted transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">Resume Intel & ATS</p>
                    <p className="text-[11px] text-text-muted truncate">Optimize keyword match score</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
