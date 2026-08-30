import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PricingPage() {
  return (
    <div className="preserve-dark-theme flex-1 flex flex-col min-h-screen bg-[#09090B] text-white">
      <Header onViewDemo={() => {}} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-12 text-xs leading-relaxed font-sans ">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Beta Pricing Options</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">Simple Beta Access Plans</h1>
          <p className="text-[13px] text-zinc-400 max-w-xl mx-auto leading-normal">
            No credit card required during public beta testing phase.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto bg-[#111113] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
          <span className="absolute top-4 right-4 text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase">Active Beta</span>
          
          <div className="space-y-1.5 pb-4 border-b border-zinc-900">
            <h3 className="font-extrabold text-white text-base">Standard Beta Tier</h3>
            <p className="text-[11px] text-zinc-550">For candidate student developers tracking software roles.</p>
            <div className="pt-3">
              <span className="text-3xl font-black font-display text-white">$0</span>
              <span className="text-zinc-500 font-mono text-[10px]"> / free access</span>
            </div>
          </div>

          <ul className="space-y-3.5 pt-2 text-[11px] text-zinc-350">
            {[
              'Track up to 25 target tech companies',
              'Ingestion scans every 6 hours',
              'ATS score scan checks & bullet rewriter',
              'Tailor style cover letters versions',
              'AI Career Copilot chat query assistance',
              'Weekly progression reports & reminders',
            ].map(f => (
              <li key={f} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

        </div>

      </main>

      <Footer />
    </div>
  );
}
