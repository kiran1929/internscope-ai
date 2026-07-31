import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Sparkles, Brain, Compass, Mail, Bell, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function FeaturesPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#09090B] text-white">
      <Header onViewDemo={() => {}} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-12 text-xs leading-relaxed font-sans select-none">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">Core Technology</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">Platform Core Capabilities</h1>
          <p className="text-[13px] text-zinc-400 max-w-xl mx-auto leading-normal">
            Automating target internship discovery, profile mapping metrics, and STAR mock interview reviews.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {[
            { title: 'Ingestion pipeline', desc: 'Queries career API pages from major tech companies every 6 hours.', icon: Compass },
            { title: 'Resume intelligence', desc: 'Parses resume skills, frameworks, and job tier alignments.', icon: FileText },
            { title: 'ATS Keyword scanning', desc: 'Identifies missing keywords and suggestions to improve match scores.', icon: Sparkles },
            { title: 'AI Interview preparation', desc: 'Tailors behavioral mock sessions and STAR grading metrics.', icon: Brain },
            { title: 'AI Career copilot', desc: 'RAG conversational agent answers questions grounded in candidate profile metrics.', icon: Bell },
            { title: 'Weekly digests', desc: 'Sends weekly career summary report digests and deadline alerts.', icon: Mail },
          ].map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 hover:border-zinc-700 transition-colors duration-300 shadow-md">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-white text-xs">{f.title}</h3>
                <p className="text-[11px] text-zinc-550 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

      </main>

      <Footer />
    </div>
  );
}
