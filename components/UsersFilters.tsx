'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

export const UsersFilters: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load from searchParams
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  const initialRender = useRef(true);

  const updateFilters = useCallback((updatedFields: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // reset page

    Object.entries(updatedFields).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      updateFilters({ search });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, updateFilters]);

  const handleSelectChange = (key: string, val: string) => {
    if (key === 'role') setRole(val);
    if (key === 'status') setStatus(val);
    if (key === 'sortBy') setSortBy(val);

    updateFilters({ [key]: val });
  };

  const handleReset = () => {
    setSearch('');
    setRole('');
    setStatus('');
    setSortBy('newest');
    router.push(pathname);
  };

  const hasActiveFilters = search || role || status || sortBy !== 'newest';

  return (
    <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-4 space-y-4 shadow-sm text-white">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search users by name, email, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 transition-all"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                updateFilters({ search: null });
              }}
              className="absolute right-3 top-2.5 text-text-muted hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider shrink-0">
            Sort By
          </span>
          <select
            value={sortBy}
            onChange={(e) => handleSelectChange('sortBy', e.target.value)}
            className="bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2.5 py-2 outline-none focus:border-primary/60 transition-all cursor-pointer min-w-[120px]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Alphabetical</option>
            <option value="recently_updated">Recently Active</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-zinc-900 pt-3 max-w-md">
        {/* Role */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            User Role
          </label>
          <select
            value={role}
            onChange={(e) => handleSelectChange('role', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-primary" /> Active filters configured
          </span>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset filters
          </button>
        </div>
      )}
    </div>
  );
};
