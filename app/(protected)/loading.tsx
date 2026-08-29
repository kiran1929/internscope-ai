import React from 'react';

export default function ProtectedLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-zinc-800/60 rounded animate-pulse" />
          <div className="h-3 w-64 bg-zinc-850/50 rounded animate-pulse" />
        </div>
        <div className="h-9 w-28 bg-zinc-800/50 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 h-28 flex flex-col justify-between"
          >
            <div className="flex justify-between">
              <div className="w-24 h-3.5 bg-zinc-800/50 rounded animate-pulse" />
              <div className="w-8 h-8 rounded-lg bg-zinc-850/50 animate-pulse" />
            </div>
            <div className="w-12 h-6 bg-zinc-800/50 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2 h-64 space-y-4">
          <div className="w-32 h-4 bg-zinc-800/50 rounded animate-pulse" />
          <div className="w-full h-44 bg-zinc-900/50 rounded-lg animate-pulse" />
        </div>
        <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 h-64 space-y-4">
          <div className="w-28 h-4 bg-zinc-800/50 rounded animate-pulse" />
          <div className="space-y-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-zinc-900/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
