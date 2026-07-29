'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface UsersPaginationProps {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const UsersPagination: React.FC<UsersPaginationProps> = ({ meta }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const updateLimit = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', newLimit.toString());
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const startRecord = (meta.page - 1) * meta.limit + 1;
  const endRecord = Math.min(meta.total, meta.page * meta.limit);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#111113]/30 border border-zinc-800/80 rounded-xl select-none text-xs text-text-muted">
      <div>
        {meta.total === 0 ? (
          <span>Showing 0 records</span>
        ) : (
          <span>
            Showing <strong className="text-zinc-300 font-semibold">{startRecord}</strong> to{' '}
            <strong className="text-zinc-300 font-semibold">{endRecord}</strong> of{' '}
            <strong className="text-zinc-300 font-semibold">{meta.total}</strong> results
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={meta.limit}
            onChange={(e) => updateLimit(Number(e.target.value))}
            className="bg-zinc-950 border border-zinc-850 rounded p-1.5 focus:border-primary/60 outline-none transition-all cursor-pointer"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Page <strong className="text-zinc-300 font-semibold">{meta.page}</strong> of{' '}
            <strong className="text-zinc-300 font-semibold">{meta.totalPages || 1}</strong>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updatePage(meta.page - 1)}
              disabled={!meta.hasPrevPage}
              className="p-1.5 rounded bg-zinc-900 border border-zinc-850 hover:border-zinc-800 disabled:opacity-35 disabled:cursor-not-allowed text-white transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => updatePage(meta.page + 1)}
              disabled={!meta.hasNextPage}
              className="p-1.5 rounded bg-zinc-900 border border-zinc-850 hover:border-zinc-800 disabled:opacity-35 disabled:cursor-not-allowed text-white transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
