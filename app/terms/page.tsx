import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="preserve-dark-theme flex-1 flex flex-col min-h-screen bg-[#09090B] text-white">
      <Header onViewDemo={() => {}} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-8 text-xs leading-relaxed font-sans">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">
            Legal
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">
            Terms of Service
          </h1>
          <p className="text-[13px] text-zinc-400 max-w-xl mx-auto leading-normal">
            Last updated: September 5, 2026
          </p>
        </div>

        <div className="space-y-6 text-zinc-300 text-[12px] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Agreement</h2>
            <p>
              By accessing InternScope AI at{' '}
              <a href="https://internscope.ai" className="text-primary underline underline-offset-2">
                internscope.ai
              </a>
              , you agree to these Terms. If you do not agree, do not use the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">The service</h2>
            <p>
              InternScope aggregates internship listings from public career boards and ATS APIs,
              and provides tools for tracking applications, resume analysis, mock interviews, and
              related career preparation. Listings, match scores, and AI outputs are informational
              only — we do not guarantee interviews, offers, or hiring outcomes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Accounts</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate account information and keep credentials secure</li>
              <li>You are responsible for activity under your account</li>
              <li>We may suspend accounts that abuse the platform, scrape beyond fair use, or violate law</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Acceptable use</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use AI tools for personal educational and career preparation purposes</li>
              <li>Do not upload malware, others&apos; private data without rights, or illegal content</li>
              <li>Do not attempt to bypass authentication, rate limits, or admin controls</li>
              <li>Do not redistribute scraped listing data as a competing commercial feed without permission</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Paid plans</h2>
            <p>
              Paid features (if enabled) are billed via Razorpay. Fees are described on the pricing
              page. Unless required by law, payments are non-refundable once a billing period starts.
              Plan access ends when the subscription expires or is cancelled.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Intellectual property</h2>
            <p>
              The InternScope product, branding, and software remain our property. You retain rights
              to content you upload (resumes, answers). You grant us a limited license to process that
              content solely to provide the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Disclaimer &amp; liability</h2>
            <p>
              The service is provided &quot;as is&quot; without warranties of any kind. To the fullest extent
              permitted by law, InternScope is not liable for indirect, incidental, or consequential
              damages arising from use of the service, third-party job boards, or AI-generated content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Contact</h2>
            <p>
              Questions about these Terms:{' '}
              <a href="mailto:support@internscope.ai" className="text-primary underline underline-offset-2">
                support@internscope.ai
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
