import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#09090B] text-white">
      <Header onViewDemo={() => {}} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-8 text-xs leading-relaxed font-sans select-none">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">Legal</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">Privacy Policy</h1>
          <p className="text-[13px] text-zinc-400 max-w-xl mx-auto leading-normal">
            Last Updated: July 31, 2026
          </p>
        </div>

        <div className="space-y-4 text-zinc-300 text-[11px] leading-relaxed">
          <p>
            At InternScope AI, we value your privacy. We collect profile details (including resumes, email addresses, goals, and matching selections) solely to improve job recommendations and deliver automated notifications.
          </p>
          <p>
            Candidates have the right to request full data deletion or profile export requests at any time by contacting support.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
