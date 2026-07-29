'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Admin Layout Error Logged:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center select-none animate-fade-in">
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-8 max-w-md w-full shadow-lg space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold font-display text-white tracking-tight">
            CMS System Error
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">
            An unexpected error occurred while loading the admin overview module. This is typically due to network timeouts or database limits.
          </p>
        </div>

        {error.message && (
          <div className="bg-zinc-950/80 border border-zinc-900 px-3 py-2 rounded-lg text-left text-[10px] font-mono text-zinc-400 max-h-32 overflow-y-auto">
            {error.message}
          </div>
        )}

        <button
          onClick={reset}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reload CMS Page
        </button>
      </div>
    </div>
  );
}
