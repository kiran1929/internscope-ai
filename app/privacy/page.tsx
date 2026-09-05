import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return (
    <div className="preserve-dark-theme flex-1 flex flex-col min-h-screen bg-[#09090B] text-white">
      <Header onViewDemo={() => {}} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-8 text-xs leading-relaxed font-sans">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">
            Legal
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-[13px] text-zinc-400 max-w-xl mx-auto leading-normal">
            Last updated: September 5, 2026
          </p>
        </div>

        <div className="space-y-6 text-zinc-300 text-[12px] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Who we are</h2>
            <p>
              InternScope AI (&quot;InternScope&quot;, &quot;we&quot;, &quot;us&quot;) provides internship discovery,
              application tracking, and AI career tools at{' '}
              <a href="https://internscope.ai" className="text-primary underline underline-offset-2">
                internscope.ai
              </a>
              . Contact:{' '}
              <a href="mailto:support@internscope.ai" className="text-primary underline underline-offset-2">
                support@internscope.ai
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Information we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account data from our auth provider (Clerk): name, email, profile image</li>
              <li>Profile details you provide: education, skills, preferences, links</li>
              <li>Uploaded resumes and documents you choose to analyze</li>
              <li>Application pipeline activity, saved jobs, and in-app preferences</li>
              <li>Usage and diagnostic logs needed to operate and secure the service</li>
              <li>Payment metadata if you purchase a plan (processed by Razorpay; we do not store full card numbers)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">How we use information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Match you to internship opportunities and send optional email digests</li>
              <li>Power AI features (resume analysis, interview practice, cover letters) using LLM providers</li>
              <li>Operate authentication, billing, abuse prevention, and product improvement</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Processors &amp; subprocessors</h2>
            <p>
              We use trusted processors including Clerk (auth), Neon/PostgreSQL (database),
              Vercel (hosting), Google Gemini / Groq (AI), Nodemailer/SMTP (email), and Razorpay (payments).
              Job listings are aggregated from public career / ATS sources.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Retention &amp; your rights</h2>
            <p>
              We retain account and application data while your account is active. You may request
              access, correction, or deletion of your personal data by emailing{' '}
              <a href="mailto:support@internscope.ai" className="text-primary underline underline-offset-2">
                support@internscope.ai
              </a>
              . We will respond within a reasonable period.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Security</h2>
            <p>
              We apply access controls, encrypted transport (HTTPS), and least-privilege admin
              practices. No method of transmission or storage is 100% secure; use a strong unique
              password and review connected OAuth accounts regularly.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Changes</h2>
            <p>
              We may update this policy as the product evolves. Material changes will be reflected
              by updating the date above. Continued use of the service after changes constitutes
              acceptance of the revised policy.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
