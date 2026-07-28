import React from 'react';
import Link from 'next/link';
import { Compass, FileQuestion, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#09090B] relative py-12 px-4 sm:px-6 lg:px-8 select-none text-center">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-danger/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            InternScope<span className="text-primary font-black">AI</span>
          </span>
        </Link>

        <div className="space-y-2">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-danger shadow-lg shadow-danger/5">
            <FileQuestion className="w-7 h-7 animate-bounce" />
          </div>
          <h1 className="text-3xl font-extrabold font-display text-white tracking-tight mt-4">Page Not Found</h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-sm mx-auto mt-2">
            The path you requested does not exist or has been relocated within our platform updates.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-primary hover:bg-blue-700 text-xs font-semibold text-white rounded-lg transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/10"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
