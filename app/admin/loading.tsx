import React from 'react';

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse select-none">
      {/* Title Skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-zinc-800 rounded-md" />
        <div className="h-4 w-72 bg-zinc-850 rounded-md" />
      </div>

      {/* KPI Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-zinc-800 rounded-md" />
              <div className="h-7 w-7 bg-zinc-800 rounded-md" />
            </div>
            <div className="h-8 w-16 bg-zinc-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* Middle Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-48 bg-[#111113] border border-zinc-800/80 rounded-xl p-5 lg:col-span-1" />
        <div className="h-48 bg-[#111113] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2" />
      </div>

      {/* Bottom Lists Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-[#111113] border border-zinc-800/80 rounded-xl p-5" />
        <div className="h-64 bg-[#111113] border border-zinc-800/80 rounded-xl p-5" />
      </div>
    </div>
  );
}
