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

// Data constants
import {
  COMPANIES as INITIAL_COMPANIES,
  FAQS,
  TESTIMONIALS,
  FEATURES
} from '@/constants';

// Reusable Components
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Counter } from '@/components/Counter';
import { cn } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

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
            InternScope AI actively monitors career pages from 100+ top tech companies, calculates your resume match score, and sends personalized alerts before applications close.
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
              { label: 'Companies Tracked', value: 120, suffix: '+' },
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

            <div className="bg-zinc-950 p-4 sm:p-6 min-h-[360px] pointer-events-none select-none">
              {/* High-fidelity interactive dashboard mockup preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left">
                {/* Sidebar Mockup */}
                <div className="hidden md:block md:col-span-3 space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/60">
                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      ⚡
                    </div>
                    <span className="text-xs font-bold text-white">Live Pipeline</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {[
                      { label: 'Active Opportunities', count: '142', active: true },
                      { label: 'Resume Match (90%+)', count: '28', active: false },
                      { label: 'Saved Roles', count: '16', active: false },
                      { label: 'Applications', count: '9', active: false },
                    ].map((nav, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                          nav.active ? 'bg-primary/15 text-primary border border-primary/25' : 'text-zinc-400 bg-zinc-900/30'
                        )}
                      >
                        <span>{nav.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                          {nav.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Content Feed Preview */}
                <div className="md:col-span-9 space-y-4">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Tracked Target Hubs', val: '120+' },
                      { label: 'New Roles (24h)', val: '+14' },
                      { label: 'Avg Match Score', val: '94%' },
                    ].map((stat, i) => (
                      <div key={i} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">{stat.label}</span>
                        <span className="text-lg font-extrabold text-white mt-0.5 block">{stat.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Sample Role Cards */}
                  <div className="space-y-2.5">
                    {[
                      { company: 'Stripe', logo: 'STRIPE', role: 'Software Engineering Intern (Backend)', match: '96%', location: 'San Francisco, CA', time: '2h ago' },
                      { company: 'Google', logo: 'GOOG', role: 'STEP Intern 2026', match: '94%', location: 'Mountain View, CA', time: '5h ago' },
                      { company: 'OpenAI', logo: 'OPENAI', role: 'Research Engineer Intern (ML)', match: '91%', location: 'San Francisco, CA', time: '8h ago' },
                    ].map((role, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/70 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <CompanyLogo logo={role.logo} name={role.company} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white truncate">{role.role}</h4>
                              <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                                {role.match} Match
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{role.company} &bull; {role.location}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap hidden sm:block">{role.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* TARGET COMPANIES SCROLLER - Dual Direction High Performance Freeform Marquee */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          id="companies"
          className="py-16 bg-transparent relative overflow-hidden space-y-6"
        >
          {/* Subtle gradient side fades for smooth entry/exit */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Deeply monitoring pipelines from top technology hubs
            </h2>
          </div>

          {/* ROW 1: Moving RIGHT */}
          <div className="relative flex overflow-x-hidden py-2">
            <motion.div
              className="flex items-center gap-6 sm:gap-8 shrink-0"
              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
              animate={{ x: ['-50%', '0%'] }}
              transition={{
                repeat: Infinity,
                ease: 'linear',
                duration: 28,
              }}
            >
              {[...INITIAL_COMPANIES.slice(0, 8), ...INITIAL_COMPANIES.slice(0, 8), ...INITIAL_COMPANIES.slice(0, 8)].map((company, index) => (
                <div
                  key={`top-${company.id}-${index}`}
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850/80 backdrop-blur-md transition-all duration-300 group cursor-pointer hover:scale-105 hover:-translate-y-1 shadow-lg shadow-black/20"
                  title={company.name}
                  onClick={handleNavigateToDashboard}
                >
                  <CompanyLogo logo={company.logo} websiteUrl={company.website} name={company.name} size="xl" />
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-white font-sans tracking-tight whitespace-nowrap group-hover:text-primary transition-colors">
                      {company.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                      {company.industry}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ROW 2: Moving LEFT */}
          <div className="relative flex overflow-x-hidden py-2">
            <motion.div
              className="flex items-center gap-6 sm:gap-8 shrink-0"
              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                repeat: Infinity,
                ease: 'linear',
                duration: 32,
              }}
            >
              {[...INITIAL_COMPANIES.slice(8), ...INITIAL_COMPANIES.slice(8), ...INITIAL_COMPANIES.slice(8)].map((company, index) => (
                <div
                  key={`bottom-${company.id}-${index}`}
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850/80 backdrop-blur-md transition-all duration-300 group cursor-pointer hover:scale-105 hover:-translate-y-1 shadow-lg shadow-black/20"
                  title={company.name}
                  onClick={handleNavigateToDashboard}
                >
                  <CompanyLogo logo={company.logo} websiteUrl={company.website} name={company.name} size="xl" />
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-white font-sans tracking-tight whitespace-nowrap group-hover:text-primary transition-colors">
                      {company.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                      {company.industry}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* FEATURES SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          id="features"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8 animate-fade-in"
        >
          <div className="text-center max-w-2xl mx-auto space-y-2">
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
                  className="relative group rounded-2xl p-7 bg-zinc-900/40 border border-zinc-800/80 hover:border-primary/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(59,130,246,0.12)] overflow-hidden flex flex-col justify-between"
                >
                  {/* Subtle top gradient line highlight */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Soft background ambient glow */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />

                  <div className="space-y-5 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900/90 border border-zinc-750 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:scale-110 transition-all duration-300 shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t border-zinc-800/40 flex items-center justify-between text-[11px] font-semibold text-zinc-500 group-hover:text-primary transition-colors">
                    <span>Explore capability</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
          className="border-t border-zinc-900 bg-zinc-950/20 py-12 sm:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Workflow</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Three Steps to Placement</h2>
              <p className="text-xs sm:text-sm text-text-muted">How we automate your internship sourcing process</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Upload & Profile', desc: 'Sync your resume to extract key frameworks, skills, and target job levels.', icon: FileText },
                { step: '02', title: 'Target Selection', desc: 'Toggle the companies you want to track. We scan career APIs every 6 hours.', icon: Building },
                { step: '03', title: 'Apply & Excel', desc: 'Receive real-time match alerts and tailored interview questions for high-scoring positions.', icon: Sparkles },
              ].map((item) => {
                const StepIcon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="relative group rounded-2xl p-7 bg-zinc-900/40 border border-zinc-800/80 hover:border-primary/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(59,130,246,0.12)] overflow-hidden flex flex-col justify-between"
                  >
                    {/* Top ambient highlight line */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Ambient corner glow */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />

                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-zinc-900/90 border border-zinc-750 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:scale-110 transition-all duration-300 shadow-md">
                          <StepIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-extrabold font-mono text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full shadow-sm">
                          STEP {item.step}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10 space-y-8"
        >
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Reviews</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Loved by Student Builders</h2>
            <p className="text-xs sm:text-sm text-text-muted">Hear from students who used our scraper alert integrations to secure offers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => {
              const companyCodeMap: Record<string, string> = {
                'Sarah Chen': 'STRIPE',
                'David Kojo': 'GOOG',
                'Alex Rivera': 'OPENAI',
              };
              const logoCode = companyCodeMap[t.name] || 'MSFT';

              return (
                <div
                  key={t.name}
                  className="relative group rounded-2xl p-7 bg-zinc-900/50 border border-zinc-800/80 hover:border-primary/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(59,130,246,0.14)] flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle top gradient line highlight */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Background ambient glow */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/25 transition-colors pointer-events-none" />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-xs">★</span>
                        ))}
                        <span className="text-[10px] font-bold ml-1 text-amber-300">5.0</span>
                      </div>
                      <CompanyLogo logo={logoCode} name={t.name} size="sm" />
                    </div>

                    <p className="text-xs text-zinc-200 leading-relaxed font-normal italic relative pt-2">
                      <span className="text-primary text-base font-serif font-black mr-1 select-none">&ldquo;</span>
                      {t.content}
                      <span className="text-primary text-base font-serif font-black ml-1 select-none">&rdquo;</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3.5 pt-5 mt-6 border-t border-zinc-800/50 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[1px] shadow-md group-hover:scale-105 transition-transform duration-300">
                      <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center font-bold text-white text-xs">
                        {t.avatar}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors leading-tight">
                        {t.name}
                      </h4>
                      <span className="text-xs text-zinc-400 font-medium mt-0.5">{t.role}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* FAQ SECTION */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          id="faq"
          className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-sm">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-zinc-400">Everything you need to know about InternScope automated scouting.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = expandedFaqIndex === index;
              return (
                <div
                  key={faq.question}
                  className={cn(
                    'group rounded-2xl border transition-all duration-300 overflow-hidden backdrop-blur-xl',
                    isOpen
                      ? 'bg-zinc-900/70 border-primary/50 shadow-[0_8px_30px_rgba(59,130,246,0.12)]'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                  )}
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left p-5 focus-visible:outline-none cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className={cn('text-xs sm:text-sm font-bold transition-colors pr-4', isOpen ? 'text-primary' : 'text-zinc-200 group-hover:text-white')}>
                      {faq.question}
                    </span>
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300', isOpen ? 'bg-primary text-white' : 'bg-zinc-800/60 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-white')}>
                      <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', isOpen && 'rotate-180')} />
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/40 mt-1 pt-3 animate-in fade-in duration-200">
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
          className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 text-center"
        >
          <div className="relative group rounded-3xl p-8 sm:p-14 bg-zinc-900/40 border border-zinc-800/80 hover:border-primary/50 backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_20px_60px_rgba(59,130,246,0.18)] overflow-hidden text-center space-y-6">
            {/* Top ambient highlight line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Soft background ambient radial glows */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-bold uppercase tracking-wider shadow-sm relative z-10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PRICING & INTERVIEWS &bull; COMING SOON</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto relative z-10">
              Ready to Automate Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-300">
                Internship Scouting?
              </span>
            </h2>

            <p className="text-xs sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed font-normal relative z-10">
              Join hundreds of CS, Data Science, and Product Management candidates utilizing scraper tracking to skip tedious job boards.
            </p>

            <div className="pt-4 relative z-10">
              <button
                onClick={handleNavigateToDashboard}
                className="mx-auto px-8 py-4 rounded-xl bg-primary hover:bg-blue-600 text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none cursor-pointer"
              >
                <span>Launch Free Live Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.section>

        <Footer />
      </div>
    </div>
  );
}
