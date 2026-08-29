'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ScraperError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Scraper page route error boundary:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] border border-zinc-800 bg-[#111113] rounded-xl p-8 text-center">
      <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      
      <h3 className="text-sm font-bold text-white mb-2">Something went wrong!</h3>
      <p className="text-xs text-text-muted max-w-sm mb-6 leading-relaxed">
        An error occurred while running the live provider health checks. Try refreshing the page.
      </p>

      <button
        onClick={reset}
        className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}
