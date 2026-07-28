'use client';

import React from 'react';
import { TrendingUp, Award, Calendar, Percent } from 'lucide-react';

export const DashboardAnalytics: React.FC = () => {
  const metrics = [
    { label: 'Application Response Rate', value: '42.8%', icon: Percent, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Interview Conversion', value: '25.0%', icon: Award, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Weekly Match Rate', value: '+18.4%', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Days Active', value: '18 Days', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const industryDistribution = [
    { name: 'Artificial Intelligence', count: 24, percent: 80, color: 'bg-emerald-500' },
    { name: 'Enterprise Cloud Systems', count: 18, percent: 60, color: 'bg-primary' },
    { name: 'Financial Tech (Fintech)', count: 12, percent: 40, color: 'bg-indigo-500' },
    { name: 'Developer Tooling & DevOps', count: 9, percent: 30, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="text-base font-bold text-white">Scouting & Funnel Analytics</h2>
        <p className="text-xs text-text-muted">Analyze application conversion rates, matching trends, and sector allocations</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-text-muted">{metric.label}</span>
                <div className={`p-1.5 rounded-md ${metric.bg}`}>
                  <Icon className={`w-4.5 h-4.5 ${metric.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold font-display text-white mt-4">{metric.value}</p>
              <span className="text-[10px] text-text-muted block mt-1">Calculated from tracked logs</span>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Industry Distribution Bar Chart */}
        <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white">Target Distribution by Sector</h3>
            <p className="text-[11px] text-text-muted">Proportion of scanned roles aligned to specific industries</p>
          </div>

          <div className="space-y-4">
            {industryDistribution.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">{item.name}</span>
                  <span className="text-text-muted font-mono">{item.count} roles ({item.percent / 2}%)</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match Score Distribution Histogram (SVG) */}
        <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white">Match Score Density</h3>
            <p className="text-[11px] text-text-muted">Frequency distribution of matching scores from uploaded profiles</p>
          </div>

          {/* SVG Custom Bar Chart */}
          <div className="relative h-44 w-full pt-4">
            <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Bottom line */}
              <line x1="0" y1="110" x2="400" y2="110" stroke="#27272a" strokeWidth="1" />

              {/* Bars */}
              {/* 50-60% */}
              <rect x="20" y="80" width="40" height="30" fill="#3f3f46" rx="3" />
              {/* 60-70% */}
              <rect x="80" y="60" width="40" height="50" fill="#2563EB" opacity="0.6" rx="3" />
              {/* 70-80% */}
              <rect x="140" y="30" width="40" height="80" fill="#2563EB" opacity="0.8" rx="3" />
              {/* 80-90% */}
              <rect x="200" y="10" width="40" height="100" fill="#2563EB" rx="3" />
              {/* 90-95% */}
              <rect x="260" y="25" width="40" height="85" fill="#22C55E" rx="3" />
              {/* 95-100% */}
              <rect x="320" y="70" width="40" height="40" fill="#22C55E" opacity="0.7" rx="3" />
            </svg>

            {/* Labels */}
            <div className="flex justify-between text-[9px] text-text-muted font-mono mt-2">
              <span className="w-10 text-center">50%</span>
              <span className="w-10 text-center">60%</span>
              <span className="w-10 text-center">70%</span>
              <span className="w-10 text-center">80%</span>
              <span className="w-10 text-center">90%</span>
              <span className="w-10 text-center">100%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default DashboardAnalytics;
