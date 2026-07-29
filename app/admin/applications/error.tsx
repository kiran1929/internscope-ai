'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ApplicationsError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center select-none">
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-8 max-w-sm w-full space-y-4">
        <div className="flex flex-col items-center gap-2">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Failed to Load Applications</h3>
          <p className="text-[11px] text-text-muted">Could not query the application datasets from Neon. Please check database status.</p>
        </div>
        <button onClick={reset} className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs">
          <RotateCcw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    </div>
  );
}
