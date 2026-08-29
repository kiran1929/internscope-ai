import React from 'react';

export default function ApplicationsLoading() {
  return (
    <div className="space-y-6 animate-pulse ">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-zinc-800 rounded-md" />
        <div className="h-4 w-72 bg-zinc-850 rounded-md" />
      </div>

      <div className="h-96 bg-[#111113] border border-zinc-800/80 rounded-xl" />
    </div>
  );
}
