import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function ContactPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#09090B] text-white">
      <Header onViewDemo={() => {}} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-8 text-xs leading-relaxed font-sans ">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">Get In Touch</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">Contact Support</h1>
          <p className="text-[13px] text-zinc-400 max-w-xl mx-auto leading-normal">
            For questions about account settings, data deletion, or beta invitations.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 text-center leading-relaxed">
          <span className="font-bold text-white block">Email Support</span>
          <p className="text-zinc-400 text-[11px]">Send an email to support@internscope.ai for immediate beta account assistance.</p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
