'use client';

import React from 'react';
import { TrendingUp, Award, Calendar, Percent } from 'lucide-react';

interface DashboardAnalyticsProps {
  responseRate: number;
  interviewConversion: number;
  averageMatchRate: number;
  daysActive: number;
  scoreBins: {
    fiftyToSixty: number;
    sixtyToSeventy: number;
    seventyToEighty: number;
    eightyToNinety: number;
    ninetyToNinetyFive: number;
    ninetyFiveToHundred: number;
  };
  sectorDistribution: Array<{
    name: string;
    count: number;
    percent: number;
  }>;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  responseRate,
  interviewConversion,
  averageMatchRate,
  daysActive,
  scoreBins,
  sectorDistribution,
}) => {
  const metrics = [
    { label: 'Application Response Rate', value: `${responseRate}%`, icon: Percent, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Interview Conversion', value: `${interviewConversion}%`, icon: Award, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Average Match Rate', value: `${averageMatchRate}%`, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Days Active', value: `${daysActive} Days`, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const maxCount = Math.max(
    1,
    scoreBins.fiftyToSixty,
    scoreBins.sixtyToSeventy,
    scoreBins.seventyToEighty,
    scoreBins.eightyToNinety,
    scoreBins.ninetyToNinetyFive,
    scoreBins.ninetyFiveToHundred
  );

  const getBarYAndHeight = (count: number) => {
    const height = Math.max(5, (count / maxCount) * 100);
    const y = 110 - height;
    return { y, height };
  };

  const binKeys = [
    { key: 'fiftyToSixty' as const, label: '50-60%', x: 20, fill: '#3f3f46', opacity: 0.9 },
    { key: 'sixtyToSeventy' as const, label: '60-70%', x: 80, fill: '#2563EB', opacity: 0.6 },
    { key: 'seventyToEighty' as const, label: '70-80%', x: 140, fill: '#2563EB', opacity: 0.8 },
    { key: 'eightyToNinety' as const, label: '80-90%', x: 200, fill: '#2563EB', opacity: 1.0 },
    { key: 'ninetyToNinetyFive' as const, label: '90-95%', x: 260, fill: '#22C55E', opacity: 0.9 },
    { key: 'ninetyFiveToHundred' as const, label: '95-100%', x: 320, fill: '#22C55E', opacity: 1.0 },
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
            {sectorDistribution.map((item, idx) => {
              const bgColors = ['bg-emerald-500', 'bg-primary', 'bg-indigo-500', 'bg-amber-500'];
              const colorClass = bgColors[idx % bgColors.length];
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white truncate max-w-[200px]" title={item.name}>{item.name}</span>
                    <span className="text-text-muted font-mono">{item.count} roles ({item.percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
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
              {binKeys.map((bin) => {
                const count = scoreBins[bin.key];
                const { y, height } = getBarYAndHeight(count);
                return (
                  <g key={bin.key}>
                    <rect
                      x={bin.x}
                      y={y}
                      width="40"
                      height={height}
                      fill={bin.fill}
                      opacity={bin.opacity}
                      rx="3"
                    />
                    <text
                      x={bin.x + 20}
                      y={y - 6}
                      fill="#71717a"
                      fontSize="8"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {count}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Labels */}
            <div className="flex justify-between text-[9px] text-text-muted font-mono mt-2 px-1">
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
