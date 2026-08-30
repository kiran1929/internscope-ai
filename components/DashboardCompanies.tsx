'use client';

import React, { useState } from 'react';
import { Search, Building, Plus, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { Company } from '@/types';
import { CompanyLogo } from './CompanyLogo';
import { cn } from '@/lib/utils';

interface DashboardCompaniesProps {
  companies: Company[];
  onToggleTrack: (id: string) => void;
}

export const DashboardCompanies: React.FC<DashboardCompaniesProps> = ({
  companies,
  onToggleTrack
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tracking' | 'not-tracking'>('all');
  const [selectedShowcaseCompany, setSelectedShowcaseCompany] = useState<Company | null>(null);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.industry.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'tracking') {
      return matchesSearch && company.isTracking;
    }
    if (filterType === 'not-tracking') {
      return matchesSearch && !company.isTracking;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Target Companies</h2>
          <p className="text-xs text-text-muted">Choose which engineering fleets you want our scrapers to monitor</p>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2">
          {(['all', 'tracking', 'not-tracking'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all duration-200',
                filterType === type
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/10'
                  : 'bg-zinc-900 border-zinc-800 text-text-muted hover:text-white'
              )}
            >
              {type.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-800/80 bg-zinc-900/40 max-w-md">
        <Search className="w-4 h-4 text-text-muted shrink-0" />
        <input
          type="text"
          placeholder="Filter by name or industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-text-muted/70"
        />
      </div>

      {/* Grid of Companies */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className={cn(
                'bg-[#18181B] border rounded-xl p-5 flex flex-col justify-between min-h-[13rem] hover:border-zinc-700 transition-all duration-250',
                company.isTracking ? 'border-primary/45 shadow-[0_0_15px_rgba(37,99,235,0.04)]' : 'border-zinc-800/80'
              )}
            >
              <div className="flex items-start justify-between">
                <CompanyLogo logo={company.logo} logoUrl={company.logoUrl} websiteUrl={company.website} name={company.name} size="md" />
                <span className="text-[10px] font-semibold text-text-muted bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-full">
                  {company.industry}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-bold text-white">{company.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  <span className="text-[11px] text-text-muted font-medium">
                    {company.activeOpeningsCount} active roles monitored
                  </span>
                </div>
                {company.name.toLowerCase() === 'razorpay' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShowcaseCompany(company);
                    }}
                    className="mt-2 text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded hover:bg-purple-500/20 font-bold block text-center w-full transition-all"
                  >
                    ✨ Razorpay Showcase Mode
                  </button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between">
                <a
                  href={company.website || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-text-muted hover:text-white font-medium underline"
                >
                  Visit Careers
                </a>
                <button
                  onClick={() => onToggleTrack(company.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200',
                    company.isTracking
                      ? 'bg-zinc-800 hover:bg-zinc-700/80 text-white'
                      : 'bg-primary hover:bg-blue-700 text-white shadow-md shadow-primary/10'
                  )}
                >
                  {company.isTracking ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span>Tracking</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Track</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center max-w-lg mx-auto">
          <Building className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No companies found</h3>
          <p className="text-xs text-text-muted mt-1">Try adjusting your filters or query to find the target firm.</p>
        </div>
      )}

      {/* Razorpay Showcase Modal */}
      {selectedShowcaseCompany && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-zinc-850 rounded-xl max-w-2xl w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 text-white">
            <button
              onClick={() => setSelectedShowcaseCompany(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-zinc-900 pb-4">
              <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-lg text-purple-400">
                R
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Razorpay Target Roadmap</h3>
                <p className="text-xs text-purple-400 mt-0.5">Showcase Mode: How to reach 90% compatibility</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[9px] block">Company hiring stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['React', 'Node.js', 'Redis', 'PHP', 'Go', 'System Design'].map(s => (
                      <span key={s} className="bg-zinc-950 border border-zinc-900 text-zinc-300 px-2.5 py-0.5 rounded text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[9px] block">Identified Gaps</span>
                  <div className="space-y-1.5 text-zinc-400">
                    <div className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                      <span>Missing backend caching expertise (Redis).</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                      <span>No production-grade Go or PHP backend exposure.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950/45 border border-zinc-900 rounded-xl p-4 space-y-4">
                <span className="font-bold text-primary uppercase tracking-wider text-[9px] block">Actionable Prep Roadmap</span>
                
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">1</div>
                    <div>
                      <span className="font-bold text-zinc-200 block">Learn Redis Caching</span>
                      <span className="text-[10px] text-zinc-500 block">Complete the AI Redis roadmap inside the Career tab (estimated 6 hours).</span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">2</div>
                    <div>
                      <span className="font-bold text-zinc-200 block">Tailor Resume for Razorpay</span>
                      <span className="text-[10px] text-zinc-500 block">Use the ATS optimizer inside the job detail page to highlight API scale.</span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">3</div>
                    <div>
                      <span className="font-bold text-zinc-200 block">Run Backend Mock Interview</span>
                      <span className="text-[10px] text-zinc-500 block">Start a Medium difficulty session in Interview page focusing on Redis & Go.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setSelectedShowcaseCompany(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-200"
              >
                Close Target Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCompanies;
