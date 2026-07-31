import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function AboutPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#09090B] text-white">
      <Header onViewDemo={() => {}} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-8 text-xs leading-relaxed font-sans select-none">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">Our Vision</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">About InternScope AI</h1>
          <p className="text-[13px] text-zinc-400 max-w-xl mx-auto leading-normal">
            Automating candidate search and discovery pipelines.
          </p>
        </div>

        <div className="space-y-4 text-zinc-300 leading-relaxed text-[11px]">
          <p>
            InternScope AI was founded with a clear mission: to eliminate the repetitive, tedious tasks of scrolling through career portals and job aggregates.
          </p>
          <p>
            By combining multi-source crawler integrations (Greenhouse, Lever, Ashby) with generative AI matching evaluations, we help student developers spend less time tracking down open positions and more time polishing technical prep and behavioral stories.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
