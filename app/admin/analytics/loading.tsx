import React from 'react';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse ">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-zinc-800 rounded-md" />
        <div className="h-4 w-72 bg-zinc-850 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#111113] border border-zinc-800/80 rounded-xl h-28" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl h-60" />
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl lg:col-span-2 h-60" />
      </div>
    </div>
  );
}
