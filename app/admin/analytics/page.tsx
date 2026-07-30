import React from 'react';
import { prisma } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import { SearchService } from '@/lib/search/search-service';
import {
  Users,
  Building,
  Briefcase,
  Compass,
  TrendingUp,
  MapPin,
  PieChart,
  Grid
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAdminUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const dbUser = await UserRepository.findByClerkId(clerkUser.id);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    redirect('/403');
  }
  return dbUser;
}

export default async function AdminAnalyticsPage() {
  await getAdminUser();

  // 1. Fetch real DB aggregates
  const [
    totalUsers,
    activeUsers,
    totalCompanies,
    totalOpportunities,
    totalApplications,
    publishedCount,
    draftCount,
    archivedCount,
    // Status distribution
    savedCount,
    appliedCount,
    interviewingCount,
    offeredCount,
    rejectedCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.company.count(),
    prisma.opportunity.count(),
    prisma.application.count(),
    prisma.opportunity.count({ where: { isActive: true, isArchived: false } }),
    prisma.opportunity.count({ where: { isActive: false, isArchived: false } }),
    prisma.opportunity.count({ where: { isArchived: true } }),
    // Application statuses
    prisma.application.count({ where: { status: 'SAVED' } }),
    prisma.application.count({ where: { status: 'APPLIED' } }),
    prisma.application.count({ where: { status: 'INTERVIEWING' } }),
    prisma.application.count({ where: { status: 'OFFERED' } }),
    prisma.application.count({ where: { status: 'REJECTED' } }),
  ]);

  // 2. Fetch telemetry stats and trend analytics from SearchService
  const [searchStats, trendAnalytics] = await Promise.all([
    SearchService.getSearchStats(),
    SearchService.getTrendAnalytics(),
  ]);

  // Demo / Placeholder charts data for user growth timeline representation
  const userGrowth = [
    { label: 'Week 1', value: 12 },
    { label: 'Week 2', value: 24 },
    { label: 'Week 3', value: 45 },
    { label: 'Week 4', value: 89 },
    { label: 'Week 5', value: 134 },
    { label: 'Week 6', value: 210 },
  ];

  // Daily Indexed Positions from SearchService
  const appSubmissions = searchStats.dailyIndexed;

  // Top skills count to compute percentage
  const totalSkillsCount = trendAnalytics.topSkills.reduce((acc, s) => acc + s.count, 0) || 1;
  const oppsByType = trendAnalytics.topSkills.map((s) => ({
    label: s.name,
    value: s.count,
    percentage: Math.round((s.count / totalSkillsCount) * 100),
  }));

  const oppsByLocation = trendAnalytics.mostCommonLocations.map((l) => ({
    label: l.name,
    count: l.count,
  }));

  const companiesByIndustry = trendAnalytics.hiringCompanies.map((c) => ({
    label: c.name,
    count: c.count,
  }));

  const totalStatus = savedCount + appliedCount + interviewingCount + offeredCount + rejectedCount || 1;

  const appStatusDist = [
    { label: 'Saved', count: savedCount, color: 'bg-zinc-600', pct: Math.round((savedCount / totalStatus) * 100) },
    { label: 'Applied', count: appliedCount, color: 'bg-blue-500', pct: Math.round((appliedCount / totalStatus) * 100) },
    { label: 'Interview', count: interviewingCount, color: 'bg-amber-500', pct: Math.round((interviewingCount / totalStatus) * 100) },
    { label: 'Offered', count: offeredCount, color: 'bg-emerald-500', pct: Math.round((offeredCount / totalStatus) * 100) },
    { label: 'Rejected', count: rejectedCount, color: 'bg-red-500', pct: Math.round((rejectedCount / totalStatus) * 100) },
  ];

  // KPI Stats Cards (Extended to 5 cards)
  const cards = [
    { label: 'Total Users', value: totalUsers, desc: `${activeUsers} Active Profiles`, icon: Users, color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
    { label: 'Tracked Companies', value: totalCompanies, desc: 'Top Technology firms', icon: Building, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { label: 'Total Positions', value: totalOpportunities, desc: `${publishedCount} Published index`, icon: Compass, color: 'text-primary border-primary/20 bg-primary/5' },
    { label: 'Applications Logged', value: totalApplications, desc: 'Student submissions', icon: Briefcase, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
    { label: 'Search Telemetry', value: searchStats.totalSearches, desc: `${trendAnalytics.remotePercentage}% Remote postings`, icon: TrendingUp, color: 'text-pink-400 border-pink-500/20 bg-pink-500/5' },
  ];

  const publicationBreakdown = [
    { label: 'Published / Active', count: publishedCount, color: 'bg-primary' },
    { label: 'Drafts / Inactive', count: draftCount, color: 'bg-zinc-600' },
    { label: 'Archived / Deleted', count: archivedCount, color: 'bg-red-500/40' },
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in text-white">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          System Analytics
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Monitor platform metrics, user engagement levels, and job indexing distributions.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/60 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {card.value}
                </span>
                <p className="text-[10px] text-text-muted mt-1 font-semibold">
                  {card.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Publication & Status distribution row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunity Index Breakdown */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Index Publications</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Distribution of job positions states.</p>
          </div>

          <div className="space-y-4 py-2">
            {publicationBreakdown.map((item) => {
              const pct = totalOpportunities > 0 ? Math.round((item.count / totalOpportunities) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} /> {item.label}
                    </span>
                    <span className="text-white font-semibold font-mono">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Application Status distribution */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Application Pipeline</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Tracking pipeline stage breakdown.</p>
          </div>

          <div className="space-y-4">
            <div className="h-6 w-full bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden flex">
              {appStatusDist.map((item) => (
                <div
                  key={item.label}
                  className={`${item.color} h-full transition-all duration-350`}
                  style={{ width: `${item.count > 0 ? item.pct : 0}%` }}
                  title={`${item.label}: ${item.count} (${item.pct}%)`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {appStatusDist.map((item) => (
                <div key={item.label} className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-lg text-center">
                  <span className="text-[9px] uppercase font-bold text-text-muted flex items-center justify-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} /> {item.label}
                  </span>
                  <p className="text-sm font-extrabold text-white mt-1 font-mono">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visualizations charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User registrations over time */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">User Growth Timeline</h3>
          </div>

          <div className="h-48 flex items-end gap-3 pt-4 justify-between font-mono text-[9px] text-text-muted">
            {userGrowth.map((g) => {
              const maxVal = Math.max(...userGrowth.map(x => x.value)) || 1;
              const heightPct = Math.round((g.value / maxVal) * 80);
              return (
                <div key={g.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-white font-semibold font-mono">{g.value}</span>
                  <div
                    className="w-full bg-primary/25 border-t border-primary rounded-t-sm transition-all duration-500"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span>{g.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applications over time */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Daily Indexed Positions</h3>
          </div>

          <div className="h-48 flex items-end gap-3 pt-4 justify-between font-mono text-[9px] text-text-muted">
            {appSubmissions.map((s) => {
              const maxVal = Math.max(...appSubmissions.map(x => x.value)) || 1;
              const heightPct = Math.round((s.value / maxVal) * 80);
              return (
                <div key={s.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-white font-semibold font-mono">{s.value}</span>
                  <div
                    className="w-full bg-emerald-500/20 border-t border-emerald-500 rounded-t-sm transition-all duration-500"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & Technology Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Searched Keywords & Skills */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Compass className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Trending Search Queries</h3>
          </div>

          <div className="space-y-3 font-mono text-[11px] text-zinc-300">
            {searchStats.trendingQueries.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No search queries tracked yet.</p>
            ) : (
              searchStats.trendingQueries.map((item, idx) => (
                <div key={item.query} className="flex items-center justify-between text-xs py-1">
                  <span className="text-zinc-200 font-bold flex items-center gap-2">
                    <span className="text-zinc-600 font-mono">#{idx + 1}</span>
                    <span>{item.query}</span>
                  </span>
                  <span className="text-primary font-bold px-2 py-0.5 rounded border border-primary/20 bg-primary/5 font-mono">
                    {item.count} searches
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Salary Distribution Bins */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Enriched Salary Distribution</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(trendAnalytics.salaryDistribution).map(([bin, count]) => {
              const totalSalaries = Object.values(trendAnalytics.salaryDistribution).reduce((acc, c) => acc + c, 0) || 1;
              const pct = Math.round((count / totalSalaries) * 100);
              return (
                <div key={bin} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">{bin}</span>
                    <span className="text-white font-bold font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Locations, Industry, Types lists details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Opportunities by Location */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" /> Top Locations
          </h3>

          <div className="space-y-3">
            {oppsByLocation.map((loc) => (
              <div key={loc.label} className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-medium">{loc.label}</span>
                <span className="text-white font-bold font-mono">{loc.count} roles</span>
              </div>
            ))}
          </div>
        </div>

        {/* Companies by Industry */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-primary" /> Industries
          </h3>

          <div className="space-y-3">
            {companiesByIndustry.map((ind) => (
              <div key={ind.label} className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-medium">{ind.label}</span>
                <span className="text-white font-bold font-mono">{ind.count} firms</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities by Type */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-primary" /> Key Categories
          </h3>

          <div className="space-y-3">
            {oppsByType.map((t) => (
              <div key={t.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-medium truncate max-w-[150px]">{t.label}</span>
                  <span className="text-white font-bold font-mono">{t.value} ({t.percentage}%)</span>
                </div>
                <div className="h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
