'use client';

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
  const deadlinesThisWeek = 3; // Static dummy count
  const appliedCount = applications.filter(a => a.status === 'applied' || a.status === 'interviewing').length;

  const kpis = [
    { label: 'Companies Tracking', value: trackedCompaniesCount, icon: Building, color: 'text-primary', bg: 'bg-primary/10', trend: '+2 this week' },
    { label: 'Open Internships', value: openInternshipsCount, icon: Compass, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '14 new today' },
    { label: 'Deadlines This Week', value: deadlinesThisWeek, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'Critical alerts' },
    { label: 'Applied & Interviewing', value: appliedCount, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10', trend: 'Active funnels' },
  ];

  const handleResumeUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setResumeUploaded(true);
    }, 1500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/80 transition-all duration-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-text-muted">{kpi.label}</span>
                <div className={cn('p-2 rounded-lg', kpi.bg)}>
                  <Icon className={cn('w-4 h-4', kpi.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display text-white">{kpi.value}</span>
              </div>
              <div className="mt-2 flex items-center gap-1">
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
            <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Avg: 4.2 / mo</span>
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
                d="M 10 140 L 10 120 Q 90 90, 100 100 T 200 40 T 300 70 T 400 30 T 490 20 L 490 140 Z"
                fill="url(#chart-grad)"
              />

              {/* Curve Line */}
              <path
                d="M 10 120 Q 90 90, 100 100 T 200 40 T 300 70 T 400 30 T 490 20"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="10" cy="120" r="4" fill="#2563EB" stroke="#18181B" strokeWidth="2" />
              <circle cx="100" cy="100" r="4" fill="#2563EB" stroke="#18181B" strokeWidth="2" />
              <circle cx="200" cy="40" r="4" fill="#2563EB" stroke="#18181B" strokeWidth="2" />
              <circle cx="300" cy="70" r="4" fill="#2563EB" stroke="#18181B" strokeWidth="2" />
              <circle cx="400" cy="30" r="4" fill="#2563EB" stroke="#18181B" strokeWidth="2" />
              <circle cx="490" cy="20" r="4" fill="#2563EB" stroke="#18181B" strokeWidth="2" />
            </svg>
            
            {/* Axis labels */}
            <div className="flex justify-between text-[9px] text-text-muted font-mono mt-2 px-1">
              <span>FEB</span>
              <span>MAR</span>
              <span>APR</span>
              <span>MAY</span>
              <span>JUN</span>
              <span>JUL (CURRENT)</span>
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
              
              {/* Interviewing (1) - Blue: 25% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563EB" strokeWidth="11"
                strokeDasharray="251.2" strokeDashoffset="62.8" />

              {/* Offered (1) - Success Green: 25% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22C55E" strokeWidth="11"
                strokeDasharray="251.2" strokeDashoffset="125.6" />

              {/* Saved (1) - Muted Grey: 25% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#71717A" strokeWidth="11"
                strokeDasharray="251.2" strokeDashoffset="188.4" />

              {/* Applied (1) - Purple/Indigo: 25% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366F1" strokeWidth="11"
                strokeDasharray="251.2" strokeDashoffset="251.2" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white font-display">4</span>
              <span className="text-[9px] text-text-muted font-semibold uppercase">Total</span>
            </div>
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
              <span>Interview (25%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success shrink-0"></span>
              <span>Offered (25%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
              <span>Applied (25%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500 shrink-0"></span>
              <span>Saved (25%)</span>
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
                          className="p-1.5 rounded bg-zinc-800 text-text-muted hover:text-white hover:bg-zinc-700 transition-colors"
                          title="Apply Externally"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onTrackInternship(role)}
                          className="p-1.5 rounded bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
                          title="Track Application"
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
                className="w-full py-2.5 px-3 rounded-lg border border-zinc-850 hover:bg-zinc-900 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
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
