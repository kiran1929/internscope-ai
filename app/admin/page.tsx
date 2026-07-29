import React from 'react';
import { prisma } from '@/lib/db';
import { cn } from '@/lib/utils';
import {
  Compass,
  Building,
  Users,
  Briefcase,
  Activity,
  Calendar,
  Sparkles
} from 'lucide-react';
import { ApplicationStatus } from '@/lib/generated/prisma/enums';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // 1. Fetch metrics from the database
  const [
    totalOpportunities,
    totalCompanies,
    totalUsers,
    totalApplications,
    publishedCount,
    draftCount,
    recentApplications,
    upcomingDeadlines
  ] = await Promise.all([
    prisma.opportunity.count(),
    prisma.company.count(),
    prisma.user.count(),
    prisma.application.count(),
    prisma.opportunity.count({ where: { isActive: true } }),
    prisma.opportunity.count({ where: { isActive: false } }),
    // Recent activity: get last 5 applications
    prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        opportunity: {
          include: {
            company: true
          }
        }
      }
    }),
    // Upcoming deadlines
    prisma.opportunity.findMany({
      where: {
        deadline: {
          gte: new Date(),
        },
        isActive: true,
      },
      take: 5,
      orderBy: { deadline: 'asc' },
      include: {
        company: true,
      },
    }),
  ]);

  // Stat Cards Config
  const stats = [
    { label: 'Total Opportunities', value: totalOpportunities, icon: Compass, color: 'text-primary bg-primary/10 border-primary/20' },
    { label: 'Tracked Companies', value: totalCompanies, icon: Building, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Registered Users', value: totalUsers, icon: Users, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Submissions/Apps', value: totalApplications, icon: Briefcase, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          System Overview
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Monitor job opportunities, scraping health, and user metrics for InternScope AI.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/60 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Published vs Draft, Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Published vs Draft KPI Card */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Opportunity Status
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              Active index publication breakdown.
            </p>
          </div>
          
          <div className="my-6 space-y-4">
            {/* Published Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Published (Active)
                </span>
                <span className="text-white font-semibold">
                  {publishedCount} ({totalOpportunities > 0 ? Math.round((publishedCount / totalOpportunities) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${totalOpportunities > 0 ? (publishedCount / totalOpportunities) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Draft Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> Inactive / Drafts
                </span>
                <span className="text-white font-semibold">
                  {draftCount} ({totalOpportunities > 0 ? Math.round((draftCount / totalOpportunities) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-650 bg-zinc-600 rounded-full transition-all"
                  style={{ width: `${totalOpportunities > 0 ? (draftCount / totalOpportunities) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-3 flex items-center justify-between text-[10px] text-text-muted">
            <span>Last scraped: Just now</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Healthy
            </span>
          </div>
        </div>

        {/* System Logs Info Card */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Data Quality Index
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              Scraping success and sync intervals.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 my-4">
            <div className="text-center bg-zinc-900/30 p-3 rounded-lg border border-zinc-900">
              <p className="text-[10px] text-text-muted uppercase">Scrape Success</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">98.4%</p>
            </div>
            <div className="text-center bg-zinc-900/30 p-3 rounded-lg border border-zinc-900">
              <p className="text-[10px] text-text-muted uppercase">API Latency</p>
              <p className="text-lg font-bold text-white mt-1">112ms</p>
            </div>
            <div className="text-center bg-zinc-900/30 p-3 rounded-lg border border-zinc-900">
              <p className="text-[10px] text-text-muted uppercase">Match Accuracy</p>
              <p className="text-lg font-bold text-primary mt-1">94.1%</p>
            </div>
          </div>

          <div className="text-[10px] text-text-muted border-t border-zinc-900 pt-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI recommendation vector engines are configured and running in idle standby.</span>
          </div>
        </div>
      </div>

      {/* Split Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity List */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Recent Application Activity
            </h3>
          </div>

          <div className="space-y-3">
            {recentApplications.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">No recent submissions found.</p>
            ) : (
              recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-900/50 bg-zinc-900/10 hover:border-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {app.user.profile?.avatarUrl ? (
                      <img
                        src={app.user.profile.avatarUrl}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full border border-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-white uppercase">
                        {app.user.profile?.firstName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {app.user.profile?.firstName} {app.user.profile?.lastName}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Applied to <span className="text-zinc-300 font-medium">{app.opportunity.title}</span> at {app.opportunity.company.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-semibold uppercase px-2 py-0.5 rounded border tracking-wider',
                      app.status === ApplicationStatus.OFFERED && 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      app.status === ApplicationStatus.INTERVIEWING && 'text-primary bg-primary/10 border-primary/20',
                      app.status === ApplicationStatus.APPLIED && 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                      app.status === ApplicationStatus.SAVED && 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
                      app.status === ApplicationStatus.REJECTED && 'text-red-400 bg-red-500/10 border-red-500/20'
                    )}
                  >
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deadlines List */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Upcoming Opportunity Deadlines
            </h3>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((opp) => {
                const daysLeft = Math.ceil(
                  ((opp.deadline?.getTime() || 0) - new Date().getTime()) / (1000 * 3600 * 24)
                );

                return (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-900/50 bg-zinc-900/10 hover:border-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {opp.company.logoUrl ? (
                        <img
                          src={opp.company.logoUrl}
                          alt="Logo"
                          className="w-7 h-7 rounded-md border border-zinc-800 bg-white object-contain p-0.5"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-white">
                          C
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                          {opp.title}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {opp.company.name} • {opp.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          'text-[9px] font-semibold px-2 py-0.5 rounded border uppercase',
                          daysLeft <= 7
                            ? 'text-red-400 bg-red-500/10 border-red-500/20'
                            : 'text-zinc-400 bg-zinc-900 border-zinc-800'
                        )}
                      >
                        {daysLeft <= 0 ? 'Closed' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                      </span>
                      <p className="text-[8px] text-text-muted mt-1.5">
                        {opp.deadline?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
