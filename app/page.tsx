'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Mail,
  Building,
  Sparkles,
  FileText,
  Bell,
  Play,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

// Data constants
import {
  COMPANIES as INITIAL_COMPANIES,
  FAQS,
  TESTIMONIALS,
  FEATURES
} from '@/constants';
import { getCatalogCompanyCount } from '@/lib/ingestion/company-catalog';

// Reusable Components
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Counter } from '@/components/Counter';
import { cn } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const catalogCompanyCount = getCatalogCompanyCount();

  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleNavigateToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="preserve-dark-theme flex-1 flex flex-col min-h-screen text-foreground relative overflow-hidden bg-[#09090B]">
      
      {/* Absolute ambient grid glow overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-gradient-to-b from-primary/10 to-transparent rounded-full filter blur-[140px] pointer-events-none z-0" />

      <div className="flex-1 flex flex-col relative z-10">
        <Header onViewDemo={handleNavigateToDashboard} />

        {/* HERO SECTION */}
        <section className="relative pt-36 pb-16 sm:pt-44 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-white leading-[1.05]"
          >
            Never Miss Your Dream <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Tech Internship
            </span>{' '}
            Again.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="text-sm sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed"
          >
            InternScope AI actively monitors career pages from {catalogCompanyCount}+ top tech companies, calculates your resume match score, and sends personalized alerts before applications close.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto sm:max-w-none"
          >
            <button
              onClick={handleNavigateToDashboard}
              className="w-full sm:w-auto relative group overflow-hidden px-6 py-3 rounded-lg bg-primary hover:bg-blue-700 text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 hover:shadow-primary/35 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={handleNavigateToDashboard}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-semibold text-white hover:text-primary hover:bg-zinc-850 transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-zinc-700 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none"
            >
              <span>View Demo</span>
            </button>
          </motion.div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 sm:p-8 rounded-2xl bg-[#111113]/40 border border-zinc-850 backdrop-blur-md relative overflow-hidden text-center shadow-2xl"
          >
            {/* Ambient card glows */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-primary/5 rounded-full filter blur-xl pointer-events-none" />

            {[
              { label: 'Companies Tracked', value: catalogCompanyCount, suffix: '+' },
              { label: 'Active Internships', value: 1450, suffix: '+' },
              { label: 'Daily Updates', value: 24, suffix: '/7' },
              { label: 'Match Accuracy', value: 98, suffix: '%' }
            ].map((stat, idx) => (
              <div key={idx} className="space-y-1 relative z-10 ">
                <div className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
                  <Counter value={stat.value} />
                  <span className="text-primary font-bold">{stat.suffix}</span>
                </div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* DASHBOARD PREVIEW SCREENSHOT */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          id="demo"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28 "
        >
          <div
            className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 shadow-2xl shadow-black/80 overflow-hidden cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            onClick={handleNavigateToDashboard}
            tabIndex={0}
            aria-label="Launch interactive demo dashboard app preview"
            onKeyDown={(e) => e.key === 'Enter' && handleNavigateToDashboard()}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent z-20" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-xs transition-opacity z-30">
              <div className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-850 font-bold text-white text-xs flex items-center gap-2 shadow-2xl">
                <Play className="w-3.5 h-3.5 fill-current text-primary" />
                <span>Launch Interactive Demo App</span>
              </div>
            </div>
            
            {/* Visual Fake Dashboard Window Header */}
            <div className="h-6 flex items-center gap-1.5 px-3 border-b border-zinc-850 bg-zinc-900/60 rounded-t-xl text-[10px] text-text-muted">
              <span className="w-2 h-2 rounded-full bg-danger/60" />
              <span className="w-2 h-2 rounded-full bg-warning/60" />
              <span className="w-2 h-2 rounded-full bg-success/60" />
              <span className="ml-4 font-mono font-medium opacity-65">https://app.internscope.ai/dashboard</span>
            </div>

            <div className="opacity-80 scale-[0.99] origin-top bg-background p-4 min-h-[300px] pointer-events-none">
              {/* Miniature dashboard mockup layout */}
              <div className="flex gap-4">
                <div className="w-[120px] h-[250px] border border-zinc-800 rounded-lg p-2 space-y-3">
                  <div className="w-12 h-3 bg-zinc-800 rounded" />
                  <div className="space-y-1">
                    <div className="w-full h-5 bg-zinc-850 rounded" />
                    <div className="w-full h-5 bg-zinc-900 rounded" />
                    <div className="w-full h-5 bg-zinc-900 rounded" />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-14 border border-zinc-800 rounded-lg p-2" />
                    <div className="h-14 border border-zinc-800 rounded-lg p-2" />
                    <div className="h-14 border border-zinc-800 rounded-lg p-2" />
                  </div>
                  <div className="h-28 border border-zinc-800 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* TARGET COMPANIES SCROLLER */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          id="companies"
          className="border-t border-b border-zinc-900 py-16 bg-[#111113]/30"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 ">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              Deeply monitoring pipelines from top technology hubs
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 justify-items-center opacity-70">
              {INITIAL_COMPANIES.map((company) => (
                <div
                  key={company.id}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 hover:bg-zinc-900/20 transition-all duration-300"
                  title={company.name}
                >
                  <CompanyLogo logo={company.logo} name={company.name} size="sm" />
                  <span className="text-[10px] text-text-muted font-bold font-mono">{company.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FEATURES SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          id="features"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 space-y-12 animate-fade-in"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Core Capabilities</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Engineered for Ambitious Candidates</h2>
            <p className="text-xs sm:text-sm text-text-muted">
              Everything you need to automate internship scouting and speed up your interview prep.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const icons: Record<string, React.ComponentType<{ className?: string }>> = { Brain, Mail, Buildings: Building, Sparkles, FileText, Bell };
              const Icon = icons[feature.icon] || Sparkles;

              return (
                <div
                  key={feature.title}
                  className="bg-[#18181B] border border-zinc-850 hover:border-zinc-700 rounded-xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative overflow-hidden group flex flex-col justify-between"
                >
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="space-y-4 relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* HOW IT WORKS SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          id="how-it-works"
          className="border-t border-zinc-900 bg-zinc-950/20 py-20 sm:py-28"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Workflow</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Three Steps to Placement</h2>
              <p className="text-xs sm:text-sm text-text-muted">How we automate your internship sourcing process</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Upload & Profile', desc: 'Sync your resume to extract key frameworks, skills, and target job levels.' },
                { step: '02', title: 'Target Selection', desc: 'Toggle the companies you want to track. We scan career APIs every 6 hours.' },
                { step: '03', title: 'Apply & Excel', desc: 'Receive real-time match alerts and tailored interview questions for high-scoring positions.' },
              ].map((item) => (
                <div key={item.step} className="bg-[#18181B] border border-zinc-850 rounded-xl p-6 relative hover:border-zinc-750 transition-colors duration-300 shadow-sm">
                  <span className="absolute top-4 right-4 text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Step {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-4">{item.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed mt-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* TESTIMONIALS */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          id="testimonials"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 space-y-12 "
        >
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Reviews</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Loved by Student Builders</h2>
            <p className="text-xs sm:text-sm text-text-muted">Hear from students who used our scraper alert integrations to secure offers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-[#18181B] border border-zinc-850 rounded-xl p-6 flex flex-col justify-between h-48 hover:border-zinc-750 transition-all duration-350 shadow-md">
                <p className="text-xs text-text-muted leading-relaxed italic">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-900/60">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{t.name}</h4>
                    <span className="text-[10px] text-text-muted">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* FAQ SECTION */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          id="faq"
          className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-10 sm:pb-14 space-y-8"
        >
          <div className="text-center space-y-3">
            <HelpCircle className="w-6 h-6 text-primary mx-auto" />
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaqIndex === index;
              return (
                <div key={faq.question} className="py-4">
                  <button
                    onClick={() => setExpandedFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left py-2 focus-visible:text-primary focus-visible:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs sm:text-sm font-semibold text-zinc-100 hover:text-white transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform duration-200', isOpen && 'rotate-180')} />
                  </button>
                  
                  {isOpen && (
                    <div className="mt-2 text-xs text-text-muted leading-relaxed py-1 pr-6 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* PRICING (COMING SOON) CALL-TO-ACTION */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          id="pricing"
          className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 text-center"
        >
          <div className="landing-cta-card bg-gradient-to-tr from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8 sm:p-12 space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full filter blur-[60px]" />
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              PRICING & INTERVIEWS &bull; COMING SOON
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Automate Your Internship Hunt?
            </h2>
            <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
              Join hundreds of CS, Data Science, and Product Management candidates utilizing scraper tracking to skip tedious job boards.
            </p>
            <div className="pt-2">
              <button
                onClick={handleNavigateToDashboard}
                className="mx-auto px-6 py-3 rounded-lg bg-primary hover:bg-blue-700 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/15 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none"
              >
                <span>Launch Free Live Demo</span>
                <Play className="w-3.5 h-3.5 fill-current text-white" />
              </button>
            </div>
          </div>
        </motion.section>

        <Footer />
      </div>
    </div>
  );
}
