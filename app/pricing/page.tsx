import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CheckCircle, Zap, Sparkles, ShieldCheck } from 'lucide-react';
import { RazorpayCheckoutButton } from '@/components/RazorpayCheckoutButton';
import { auth } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const { userId: clerkId } = await auth();
  let currentPlan = 'FREE';

  if (clerkId) {
    const user = await UserRepository.findByClerkId(clerkId);
    if (user && user.planTier) {
      currentPlan = user.planTier;
    }
  }

  const freeFeatures = [
    'Track up to 25 target tech companies',
    'Ingestion scans every 6 hours',
    'Basic ATS resume scan & formatting',
    'Standard Cover Letter Generator',
    '5 AI Career Copilot queries / day',
    'Weekly career digest notifications',
  ];

  const proFeatures = [
    'Unlimited target company tracking',
    'Real-time ingestion & instant job match alerts',
    'Unlimited ATS Score Scans & AI Bullet Rewriter',
    'Tailored Cover Letter & Recruiter Outreach Writer',
    'Unlimited RAG AI Career Copilot & Mock Interviewer',
    'GitHub & Portfolio website automated auditors',
    'Priority customer support',
  ];

  return (
    <div className="preserve-dark-theme flex-1 flex flex-col min-h-screen bg-[#09090B] text-white">
      <Header onViewDemo={() => {}} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-16 text-xs leading-relaxed font-sans">
        
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Razorpay Secure Payments
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">
            Flexible Plans for Future Engineers
          </h1>
          <p className="text-[13px] text-zinc-400 leading-normal">
            Supercharge your tech internship search with automated scanners, AI mock interviews, and personalized resume tailoring.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* 1. Free Beta Tier */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between relative shadow-xl">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-white text-base">Standard Beta</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">For students exploring opportunities.</p>
                </div>
                <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded uppercase">
                  Free
                </span>
              </div>

              <div className="pt-2 pb-4 border-b border-zinc-800/60">
                <span className="text-3xl font-black font-display text-white">₹0</span>
                <span className="text-zinc-500 font-mono text-[10px]"> / month</span>
              </div>

              <ul className="space-y-3 text-[11px] text-zinc-300">
                {freeFeatures.map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-zinc-800/60">
              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 cursor-default text-center"
              >
                {currentPlan === 'FREE' ? 'Current Active Tier' : 'Free Basic Plan'}
              </button>
            </div>
          </div>

          {/* 2. Pro Monthly Tier */}
          <div className="bg-[#111113] border border-amber-500/40 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between relative shadow-2xl shadow-amber-500/5">
            <span className="absolute -top-3 right-6 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Popular Choice
            </span>

            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-white text-base">Pro Monthly</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Full access to AI Copilot & ATS tools.</p>
                </div>
                <Zap className="w-5 h-5 text-amber-400" />
              </div>

              <div className="pt-2 pb-4 border-b border-zinc-800/60">
                <span className="text-3xl font-black font-display text-white">₹499</span>
                <span className="text-zinc-500 font-mono text-[10px]"> / month</span>
              </div>

              <ul className="space-y-3 text-[11px] text-zinc-300">
                {proFeatures.map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-zinc-800/60">
              <RazorpayCheckoutButton
                planTier="PRO_MONTHLY"
                planTitle="Pro Monthly"
                amountText="₹499/mo"
                isCurrentPlan={currentPlan === 'PRO_MONTHLY'}
              />
            </div>
          </div>

          {/* 3. Pro Annual Tier */}
          <div className="bg-gradient-to-b from-[#16141c] to-[#111113] border border-purple-500/40 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between relative shadow-2xl shadow-purple-500/5">
            <span className="absolute -top-3 right-6 text-[9px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Save 33%
            </span>

            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-white text-base">Pro Annual</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Best value for full placement seasons.</p>
                </div>
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>

              <div className="pt-2 pb-4 border-b border-zinc-800/60">
                <span className="text-3xl font-black font-display text-white">₹3,999</span>
                <span className="text-zinc-500 font-mono text-[10px]"> / year</span>
              </div>

              <ul className="space-y-3 text-[11px] text-zinc-300">
                {[
                  ...proFeatures,
                  'Save ₹1,989 compared to monthly billing',
                  'Priority access to future AI beta features',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-zinc-800/60">
              <RazorpayCheckoutButton
                planTier="PRO_ANNUAL"
                planTitle="Pro Annual"
                amountText="₹3,999/yr"
                isCurrentPlan={currentPlan === 'PRO_ANNUAL'}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white border-none"
              />
            </div>
          </div>

        </div>

        {/* Security & Support Note */}
        <div className="text-center pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-center gap-6 text-zinc-500 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-bit SSL Encrypted Payments via Razorpay</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div>UPI, Cards, NetBanking, and Wallets Supported</div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
