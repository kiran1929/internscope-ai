import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 min-h-screen bg-[#09090B] flex text-text-muted relative select-none overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Fake Collapsed Sidebar Skeleton */}
      <aside className="w-[70px] border-r border-zinc-800/80 bg-[#111113] p-4 flex flex-col items-center justify-between shrink-0 h-screen hidden sm:flex">
        <div className="space-y-6 w-full flex flex-col items-center">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-zinc-800/60 animate-pulse" />
          {/* Nav Items */}
          <div className="space-y-4 w-full flex flex-col items-center pt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-lg bg-zinc-850/60 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-850/60 animate-pulse" />
      </aside>

      {/* Main Panel Content Skeleton */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Fake Navbar Header */}
        <header className="h-16 border-b border-zinc-800/80 bg-[#09090B] flex items-center justify-between px-6">
          <div className="w-24 h-4 bg-zinc-800/60 rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/60 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-zinc-805/60 animate-pulse" />
          </div>
        </header>

        {/* Fake Workspace Area */}
        <main className="flex-1 p-6 space-y-8 overflow-hidden">
          {/* Row of stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 h-28 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-24 h-3.5 bg-zinc-800/50 rounded animate-pulse" />
                  <div className="w-8 h-8 rounded-lg bg-zinc-850/50 animate-pulse" />
                </div>
                <div className="w-12 h-6 bg-zinc-800/50 rounded animate-pulse mt-2" />
                <div className="w-16 h-3 bg-zinc-850/50 rounded animate-pulse mt-2" />
              </div>
            ))}
          </div>

          {/* Row of chart blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2 h-64 space-y-4">
              <div className="w-32 h-4 bg-zinc-800/50 rounded animate-pulse" />
              <div className="w-full h-44 bg-zinc-900/50 rounded-lg animate-pulse" />
            </div>
            <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 h-64 flex flex-col justify-between">
              <div className="w-28 h-4 bg-zinc-800/50 rounded animate-pulse" />
              <div className="w-32 h-32 rounded-full border-8 border-zinc-850/50 border-t-zinc-800/60 animate-spin mx-auto my-4" />
              <div className="w-full h-3 bg-zinc-850/50 rounded animate-pulse" />
            </div>
          </div>
        </main>
      </div>

      {/* Screen Loader Spinner Overlay */}
      <div className="absolute inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-xs font-semibold text-white tracking-wide">Syncing authentication...</span>
        </div>
      </div>
    </div>
  );
}
