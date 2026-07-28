'use client';

import React, { useState } from 'react';
import { Search, Building, Plus, Check } from 'lucide-react';
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
                'bg-[#18181B] border rounded-xl p-5 flex flex-col justify-between h-44 hover:border-zinc-700 transition-all duration-250',
                company.isTracking ? 'border-primary/45 shadow-[0_0_15px_rgba(37,99,235,0.04)]' : 'border-zinc-800/80'
              )}
            >
              <div className="flex items-start justify-between">
                <CompanyLogo logo={company.logo} name={company.name} size="md" />
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
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between">
                <a
                  href={company.website}
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
    </div>
  );
};
export default DashboardCompanies;
