import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function FAQPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#09090B] text-white">
      <Header onViewDemo={() => {}} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-12 text-xs leading-relaxed font-sans select-none">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">Help Center</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">Frequently Asked Questions</h1>
          <p className="text-[13px] text-zinc-400 max-w-xl mx-auto leading-normal">
            Quick guides about integration frequencies, pricing, and resume indexing.
          </p>
        </div>

        {/* FAQs */}
        <div className="space-y-6 pt-4 text-[11px] text-zinc-300">
          {[
            { q: 'How often does InternScope update tracked opportunities?', a: 'Our Multi-source connectors query career pages from Greenhouse, Lever, and Ashby every 6 hours automatically using background worker pipelines.' },
            { q: 'Is there a limit to mock interview prep practices?', a: 'During our public beta rollout phase, students can generate unlimited practice mock rooms and technical evaluations.' },
            { q: 'Does the AI Career Copilot share my data?', a: 'No. The Context Engine utilizes strict query bounds to ensure candidate parsed resume information remains secure.' },
          ].map(f => (
            <div key={f.q} className="border border-zinc-850 bg-[#111113]/40 rounded-xl p-4 space-y-2 leading-relaxed">
              <span className="font-bold text-white block">{f.q}</span>
              <p className="text-zinc-400 leading-normal">{f.a}</p>
            </div>
          ))}
        </div>

      </main>

      <Footer />
    </div>
  );
}
