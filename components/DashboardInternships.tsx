'use client';

import React, { useState } from 'react';
import { Search, Compass, MapPin, Calendar, Sparkles, Plus, Check, Bookmark, ArrowUpRight, Eye } from 'lucide-react';
import { Internship } from '@/types';
import { CompanyLogo } from './CompanyLogo';
import { cn } from '@/lib/utils';

interface DashboardInternshipsProps {
  internships: Internship[];
  savedIds: string[];
  appliedIds: string[];
  onToggleSave: (id: string) => void;
  onTrackInternship: (internship: Internship) => void;
}

export const DashboardInternships: React.FC<DashboardInternshipsProps> = ({
  internships,
  savedIds,
  appliedIds,
  onToggleSave,
  onTrackInternship
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [minMatch, setMinMatch] = useState<number>(0);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(internships.flatMap((item) => item.tags))
  ).slice(0, 10);

  const filteredInternships = internships.filter((item) => {
    const matchesSearch =
      item.role.toLowerCase().includes(search.toLowerCase()) ||
      item.companyName.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());

    const matchesTag = selectedTag ? item.tags.includes(selectedTag) : true;
    const matchesScore = item.matchScore >= minMatch;

    return matchesSearch && matchesTag && matchesScore;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* Search and Filters */}
      <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <Search className="w-4.5 h-4.5 text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search by role, company, location, or tech..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-text-muted/70"
            />
          </div>

          {/* Match Score Threshold Slider */}
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-text-muted flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Min Match Score</span>
              </span>
              <span className="text-white font-mono">{minMatch}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900 text-xs">
          <span className="text-text-muted font-medium mr-1">Popular Filters:</span>
          <button
            onClick={() => setSelectedTag(null)}
            className={cn(
              'px-2.5 py-1 rounded-md transition-colors',
              !selectedTag ? 'bg-primary/20 text-primary font-bold' : 'bg-zinc-900 text-text-muted hover:bg-zinc-850 hover:text-white'
            )}
          >
            All Tech
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all duration-150',
                tag === selectedTag
                  ? 'bg-primary text-white font-semibold'
                  : 'bg-zinc-900 text-text-muted hover:bg-zinc-850 hover:text-white'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Internships List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold">
            <span>Found {filteredInternships.length} active opportunities</span>
            <span>Sorted by highest match</span>
          </div>

          {filteredInternships.length > 0 ? (
            <div className="space-y-3.5">
              {filteredInternships.map((role) => {
                const isSaved = savedIds.includes(role.id);
                const isApplied = appliedIds.includes(role.id);

                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedInternship(role)}
                    className={cn(
                      'bg-[#18181B] border rounded-xl p-5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-4',
                      selectedInternship?.id === role.id ? 'border-primary shadow-[0_0_15px_rgba(37,99,235,0.06)]' : 'border-zinc-800/80 hover:border-zinc-700'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <CompanyLogo logo={role.companyLogo} name={role.companyName} size="md" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                            {role.role}
                          </h3>
                          <span className="text-[10px] font-bold bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-white uppercase">
                            {role.companyName}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {role.location}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="w-3.5 h-3.5" />
                            {role.deadline}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          {role.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] font-semibold font-mono text-zinc-400 bg-zinc-900/80 border border-zinc-850 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right column: Match score meter and quick actions */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-zinc-900 pt-3 sm:pt-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-mono font-black text-xs px-2 py-0.5 rounded shadow-sm',
                          role.matchScore >= 90 ? 'text-success bg-success/10 border border-success/15' :
                          role.matchScore >= 80 ? 'text-primary bg-primary/10 border border-primary/15' :
                          'text-amber-500 bg-amber-500/10 border border-amber-500/15'
                        )}>
                          {role.matchScore}% Match
                        </span>
                      </div>

                      <div className="flex items-center gap-2 select-none" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleSave(role.id)}
                          className={cn(
                            'p-2 rounded-lg border transition-all duration-200',
                            isSaved
                              ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-text-muted hover:text-white'
                          )}
                          title={isSaved ? 'Remove from Saved' : 'Save Position'}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onTrackInternship(role)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200',
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
                              <span>Track</span>
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
            <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
              <Compass className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">No internships found</h3>
              <p className="text-xs text-text-muted mt-1">Try resetting your filters or adjusting the search term.</p>
            </div>
          )}
        </div>

        {/* Internship Details Sticky Preview */}
        <div className="lg:col-span-1 bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 sticky top-[80px] space-y-5">
          {selectedInternship ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-start gap-4">
                <CompanyLogo logo={selectedInternship.companyLogo} name={selectedInternship.companyName} size="md" />
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">{selectedInternship.role}</h3>
                  <span className="text-xs text-primary font-semibold block mt-0.5">{selectedInternship.companyName}</span>
                </div>
              </div>

              <div className="space-y-2.5 py-4 border-t border-b border-zinc-900 text-xs text-text-muted">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-semibold text-white">{selectedInternship.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deadline:</span>
                  <span className="font-semibold text-white font-mono">{selectedInternship.deadline}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold text-success capitalize">{selectedInternship.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Profile Match:</span>
                  <span className="font-mono font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {selectedInternship.matchScore}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white">Role Description</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  {selectedInternship.description}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-white">Key Requirements</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedInternship.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => onToggleSave(selectedInternship.id)}
                  className="py-2.5 rounded-lg border border-zinc-800 text-xs font-semibold text-white bg-zinc-900/50 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Bookmark className={cn('w-4 h-4', savedIds.includes(selectedInternship.id) && 'fill-current text-amber-500')} />
                  <span>{savedIds.includes(selectedInternship.id) ? 'Saved' : 'Save'}</span>
                </button>
                <a
                  href={selectedInternship.url}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 rounded-lg bg-primary hover:bg-blue-700 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/10"
                >
                  <span>Apply Now</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <Eye className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-xs text-text-muted">Select an internship role to view full requirements, descriptions, and direct apply portals.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default DashboardInternships;
