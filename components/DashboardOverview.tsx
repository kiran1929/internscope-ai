'use client';
/* eslint-disable react-hooks/purity */

import React, { useState } from 'react';
import {
  Building,
  Compass,
  Calendar,
  Briefcase,
  TrendingUp,
  Clock,
  ArrowRight,
  UploadCloud,
  Plus,
  Eye,
  FileText
} from 'lucide-react';
import { Company, Internship, Application, Activity } from '@/types';
import { CompanyLogo } from './CompanyLogo';
import { Counter } from './Counter';
import { cn } from '@/lib/utils';
import { DashboardTab } from './Sidebar';

interface DashboardOverviewProps {
  companies: Company[];
  internships: Internship[];
  applications: Application[];
  activities: Activity[];
  onNavigate: (tab: DashboardTab) => void;
  onTrackInternship: (internship: Internship) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  companies,
  internships,
  applications,
  activities,
  onNavigate,
  onTrackInternship
}) => {
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Statistics calculation
  const trackedCompaniesCount = companies.filter(c => c.isTracking).length;
  const openInternshipsCount = internships.length;
  
  const today = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const deadlinesThisWeek = internships.filter(role => {
    if (!role.deadline) return false;
    const deadlineDate = new Date(role.deadline);
    if (isNaN(deadlineDate.getTime())) return false;
    return deadlineDate >= today && deadlineDate <= nextWeek;
  }).length;

  const appliedCount = applications.filter(a => a.status === 'applied' || a.status === 'interview' || a.status === 'oa').length;

  const companiesTrend = trackedCompaniesCount > 0 ? `+${Math.min(trackedCompaniesCount, 2)} this week` : '0 this week';
  const internshipsTrend = `${Math.min(openInternshipsCount, 14)} new today`;
  const deadlinesTrend = deadlinesThisWeek > 0 ? `${deadlinesThisWeek} closing soon` : 'Critical alerts';
  const appliedTrend = `${appliedCount} active funnels`;

  const kpis = [
    { label: 'Companies Tracking', value: trackedCompaniesCount, icon: Building, color: 'text-primary', bg: 'bg-primary/10', trend: companiesTrend },
    { label: 'Open Internships', value: openInternshipsCount, icon: Compass, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: internshipsTrend },
    { label: 'Deadlines This Week', value: deadlinesThisWeek, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: deadlinesTrend },
    { label: 'Applied & Interviewing', value: appliedCount, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10', trend: appliedTrend },
  ];

  const handleResumeUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setResumeUploaded(true);
    }, 1500);
  };

  // 1. Application Velocity Area Chart calculations
  const getLast6Months = () => {
    const monthNames = ['FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN'];
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      result.push({
        name: monthNames[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        count: 0,
      });
    }
    return result;
  };

  const monthsData = getLast6Months();
  applications.forEach(app => {
    const appDate = app.appliedDate ? new Date(app.appliedDate) : null;
    if (appDate && !isNaN(appDate.getTime())) {
      const match = monthsData.find(m => m.monthIndex === appDate.getMonth() && m.year === appDate.getFullYear());
      if (match) {
        match.count++;
      }
    }
  });

  const totalAppsCount = applications.length;
  const avgAppsPerMonth = (totalAppsCount / 6).toFixed(1);

  const maxMonthCount = Math.max(1, ...monthsData.map(m => m.count));
  const getPointY = (count: number) => {
    const ratio = count / maxMonthCount;
    return 130 - ratio * 100;
  };

  const points = monthsData.map((m, i) => {
    const x = 10 + i * 96;
    const y = getPointY(m.count);
    return { x, y };
  });

  const areaPath = `M 10 140 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L 490 140 Z`;
  const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  // 2. Application Stages breakdown
  const interviewCount = applications.filter(a => a.status === 'interview' || a.status === 'oa').length;
  const offeredCount = applications.filter(a => a.status === 'offer').length;
  const appliedCountTotal = applications.filter(a => a.status === 'applied').length;
  const savedCountTotal = applications.filter(a => a.status === 'discovered' || a.status === 'shortlisted' || a.status === 'preparing').length;
  const totalStagesCount = applications.length || 1;

  const pctInterview = Math.round((interviewCount / totalStagesCount) * 100);
  const pctOffered = Math.round((offeredCount / totalStagesCount) * 100);
  const pctApplied = Math.round((appliedCountTotal / totalStagesCount) * 100);
  const pctSaved = Math.round((savedCountTotal / totalStagesCount) * 100);

  const interviewShare = (interviewCount / totalStagesCount) * 251.2;
  const offeredShare = (offeredCount / totalStagesCount) * 251.2;
  const savedShare = (savedCountTotal / totalStagesCount) * 251.2;
  const appliedShare = (appliedCountTotal / totalStagesCount) * 251.2;

  const interviewOffset = 251.2;
  const offeredOffset = 251.2 - interviewShare;
  const appliedOffset = offeredOffset - offeredShare;
  const savedOffset = appliedOffset - appliedShare;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[#18181B] border border-zinc-850 rounded-xl p-5 hover:border-zinc-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 relative overflow-hidden group "
            >
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-750/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex justify-between items-start relative z-10">
                <span className="text-xs font-semibold text-text-muted">{kpi.label}</span>
                <div className={cn('p-2 rounded-lg transition-transform duration-300 group-hover:scale-105', kpi.bg)}>
                  <Icon className={cn('w-4 h-4', kpi.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2 relative z-10">
                <span className="text-3xl font-bold font-display text-white">
                  <Counter value={kpi.value} />
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 relative z-10">
                <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" />
                <span className="text-[10px] text-text-muted font-medium">{kpi.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Application Timeline Area Chart */}
        <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Application Velocity</h3>
              <p className="text-[11px] text-text-muted">Tracking applications sent over the past 6 months</p>
            </div>
            <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Avg: {avgAppsPerMonth} / mo</span>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="relative h-48 w-full pt-4">
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="500" y2="25" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="125" x2="500" y2="125" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />

              {/* Area Under Curve */}
              <path
                d={areaPath}
                fill="url(#chart-grad)"
              />

              {/* Curve Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              {points.map((p, idx) => (
                <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#2563EB" stroke="#18181B" strokeWidth="2" />
              ))}
            </svg>
            
            {/* Axis labels */}
            <div className="flex justify-between text-[9px] text-text-muted font-mono mt-2 px-1">
              {monthsData.map((m, i) => (
                <span key={i}>{m.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Application Stages</h3>
            <p className="text-[11px] text-text-muted">Breakdown of applications by current phase</p>
          </div>

          <div className="flex items-center justify-center my-4 relative">
            {/* SVG Donut Chart */}
            <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
              {/* Background ring */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#27272a" strokeWidth="11" />
              
              {/* Interviewing - Blue */}
              {interviewCount > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563EB" strokeWidth="11"
                  strokeDasharray={`${interviewShare} 251.2`} strokeDashoffset={interviewOffset} />
              )}

              {/* Offered - Success Green */}
              {offeredCount > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22C55E" strokeWidth="11"
                  strokeDasharray={`${offeredShare} 251.2`} strokeDashoffset={offeredOffset} />
              )}

              {/* Saved - Muted Grey */}
              {savedCountTotal > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#71717A" strokeWidth="11"
                  strokeDasharray={`${savedShare} 251.2`} strokeDashoffset={savedOffset} />
              )}

              {/* Applied - Purple/Indigo */}
              {appliedCountTotal > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366F1" strokeWidth="11"
                  strokeDasharray={`${appliedShare} 251.2`} strokeDashoffset={appliedOffset} />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white font-display">{applications.length}</span>
              <span className="text-[9px] text-text-muted font-semibold uppercase">Total</span>
            </div>
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
              <span>Interview ({pctInterview}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success shrink-0"></span>
              <span>Offered ({pctOffered}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
              <span>Applied ({pctApplied}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500 shrink-0"></span>
              <span>Saved ({pctSaved}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Latest Openings & Sidebar Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Latest Openings Table */}
        <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recommended Openings</h3>
              <p className="text-[11px] text-text-muted">High-match internship roles updated within the last 24h</p>
            </div>
            <button
              onClick={() => onNavigate('internships')}
              className="text-xs font-semibold text-primary hover:text-blue-400 flex items-center gap-1 group"
            >
              <span>View all roles</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  <th className="py-3 px-1">Company</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Match Score</th>
                  <th className="py-3 px-2">Deadline</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {internships.slice(0, 4).map((role) => (
                  <tr key={role.id} className="text-xs text-text-muted hover:bg-zinc-900/30 transition-colors group">
                    <td className="py-3 px-1 flex items-center gap-3">
                      <CompanyLogo logo={role.companyLogo} name={role.companyName} size="sm" />
                      <span className="font-semibold text-white">{role.companyName}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-white font-medium block truncate max-w-[160px] sm:max-w-[200px]" title={role.role}>
                        {role.role}
                      </span>
                      <span className="text-[10px] text-text-muted">{role.location}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-mono font-bold text-[10px] px-1.5 py-0.5 rounded',
                          role.matchScore >= 90 ? 'text-success bg-success/10' :
                          role.matchScore >= 80 ? 'text-primary bg-primary/10' : 'text-amber-500 bg-amber-500/10'
                        )}>
                          {role.matchScore}%
                        </span>
                        <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              role.matchScore >= 90 ? 'bg-success' :
                              role.matchScore >= 80 ? 'bg-primary' : 'bg-amber-500'
                            )}
                            style={{ width: `${role.matchScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-mono text-zinc-400">{role.deadline}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <a
                          href={role.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-zinc-850 text-text-muted hover:text-white hover:bg-zinc-800 transition-all focus-ring"
                          title="Apply Externally"
                          aria-label={`Apply Externally to ${role.role} at ${role.companyName}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onTrackInternship(role)}
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all focus-ring"
                          title="Track Application"
                          aria-label={`Track Application for ${role.role} at ${role.companyName}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Activity & Quick Actions */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
            
            <div className="space-y-2.5">
              {/* Upload Resume Mock */}
              <div className="border border-dashed border-zinc-800 rounded-xl p-4 text-center hover:border-zinc-700/80 transition-colors">
                {uploading ? (
                  <div className="py-1 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary animate-bounce">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-text-muted block animate-pulse-subtle">Extracting fields and profiling skills...</span>
                  </div>
                ) : resumeUploaded ? (
                  <div className="py-1 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center mx-auto text-success">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-success block font-semibold">Resume Analyzed (Inter_Resume.pdf)</span>
                    <button
                      onClick={() => setResumeUploaded(false)}
                      className="text-[9px] text-text-muted hover:text-white underline font-medium"
                    >
                      Upload different file
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleResumeUpload}
                    className="w-full py-1 space-y-2 cursor-pointer focus:outline-none"
                  >
                    <UploadCloud className="w-6 h-6 text-text-muted mx-auto" />
                    <div>
                      <span className="text-xs font-semibold text-white block">Tailor Match Scores</span>
                      <span className="text-[10px] text-text-muted block mt-0.5">Upload PDF resume (Max 4MB)</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Add Custom Application button */}
              <button
                onClick={() => onNavigate('applications')}
                className="w-full btn-secondary focus-ring text-xs py-2"
                aria-label="Track Custom Application"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Track Custom Application</span>
              </button>
            </div>
          </div>

          {/* Recent Activity Panel */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
              <Clock className="w-3.5 h-3.5 text-text-muted" />
            </div>

            <div className="space-y-4">
              {activities.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex gap-3 items-start text-xs text-text-muted leading-relaxed">
                  <span className={cn(
                    'w-2 h-2 rounded-full mt-1.5 shrink-0',
                    activity.type === 'interview' ? 'bg-primary' :
                    activity.type === 'match' ? 'bg-[#A855F7]' :
                    activity.type === 'deadline' ? 'bg-danger' : 'bg-zinc-600'
                  )} />
                  <div className="space-y-0.5">
                    <p className="text-zinc-200">{activity.message}</p>
                    <p className="text-[10px] text-text-muted/65">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardOverview;
