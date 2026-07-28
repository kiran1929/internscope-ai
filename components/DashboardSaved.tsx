'use client';

import React, { useState } from 'react';
import { Bookmark, Search, Trash2, Plus, ArrowUpRight, Check } from 'lucide-react';
import { Internship } from '@/types';
import { CompanyLogo } from './CompanyLogo';
import { cn } from '@/lib/utils';

interface DashboardSavedProps {
  internships: Internship[];
  savedIds: string[];
  appliedIds: string[];
  onRemoveSave: (id: string) => void;
  onTrackInternship: (internship: Internship) => void;
}

export const DashboardSaved: React.FC<DashboardSavedProps> = ({
  internships,
  savedIds,
  appliedIds,
  onRemoveSave,
  onTrackInternship
}) => {
  const [search, setSearch] = useState('');

  const savedInternships = internships.filter((item) =>
    savedIds.includes(item.id) &&
    (item.role.toLowerCase().includes(search.toLowerCase()) ||
      item.companyName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="text-base font-bold text-white">Saved Positions</h2>
        <p className="text-xs text-text-muted">Review positions you marked to apply for later</p>
      </div>

      {/* Search and stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40 w-full sm:max-w-md">
          <Search className="w-4.5 h-4.5 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search saved roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-text-muted/70"
          />
        </div>
        <span className="text-xs font-semibold text-text-muted select-none">
          Bookmarked: {savedInternships.length} roles
        </span>
      </div>

      {/* List */}
      {savedInternships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedInternships.map((role) => {
            const isApplied = appliedIds.includes(role.id);

            return (
              <div
                key={role.id}
                className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CompanyLogo logo={role.companyLogo} name={role.companyName} size="sm" />
                      <div>
                        <h3 className="text-sm font-bold text-white truncate max-w-[180px]" title={role.role}>
                          {role.role}
                        </h3>
                        <span className="text-[10px] text-text-muted">{role.companyName} &bull; {role.location}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">
                      {role.matchScore}% Match
                    </span>
                  </div>

                  <p className="text-xs text-text-muted mt-3 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between">
                  <button
                    onClick={() => onRemoveSave(role.id)}
                    className="p-1.5 rounded-lg border border-zinc-850 hover:border-danger/30 hover:bg-danger/10 text-text-muted hover:text-danger transition-colors flex items-center gap-1 text-[11px] font-semibold"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={role.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-semibold text-white bg-zinc-900/50 hover:bg-zinc-800 transition-colors flex items-center gap-1"
                    >
                      <span>Apply</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => onTrackInternship(role)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all duration-200',
                        isApplied
                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-800 cursor-not-allowed'
                          : 'bg-primary hover:bg-blue-700 text-white shadow-md shadow-primary/10'
                      )}
                      disabled={isApplied}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-success" />
                          <span>Tracked</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Track App</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center max-w-lg mx-auto">
          <Bookmark className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No bookmarked positions</h3>
          <p className="text-xs text-text-muted mt-1">Explore internships and mark jobs to save them here.</p>
        </div>
      )}
    </div>
  );
};
export default DashboardSaved;
