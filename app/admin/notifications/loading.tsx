import React from 'react';

export default function NotificationsLoading() {
  return (
    <div className="space-y-6 animate-pulse ">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-zinc-800 rounded-md" />
        <div className="h-4 w-72 bg-zinc-850 rounded-md" />
      </div>

      <div className="bg-[#111113] border border-zinc-800/80 h-14 rounded-xl" />

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#111113] border border-zinc-850 h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
