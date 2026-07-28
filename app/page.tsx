'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Mail,
  Building,
  Sparkles,
  FileText,
  Bell,
  ChevronDown,
  Play,
  HelpCircle
} from 'lucide-react';

// Data constants
import {
  COMPANIES as INITIAL_COMPANIES,
  INTERNSHIPS as INITIAL_INTERNSHIPS,
  APPLICATIONS as INITIAL_APPLICATIONS,
  ACTIVITIES as INITIAL_ACTIVITIES,
  EMAIL_PREFERENCES as INITIAL_EMAIL_PREFERENCES,
  FAQS,
  TESTIMONIALS,
  FEATURES
} from '@/constants';

// Reusable Components
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Sidebar, DashboardTab } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { CompanyLogo } from '@/components/CompanyLogo';
import { cn } from '@/lib/utils';

// Dashboard Sub-Views
import { DashboardOverview } from '@/components/DashboardOverview';
import { DashboardCompanies } from '@/components/DashboardCompanies';
import { DashboardInternships } from '@/components/DashboardInternships';
import { DashboardSaved } from '@/components/DashboardSaved';
import { DashboardApplications } from '@/components/DashboardApplications';
import { DashboardEmailReports } from '@/components/DashboardEmailReports';
import { DashboardAnalytics } from '@/components/DashboardAnalytics';
import { DashboardSettings } from '@/components/DashboardSettings';

import { Company, Internship, Application, Activity, EmailReportPreference, ApplicationStatus } from '@/types';

export default function Home() {
  // Navigation State
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Sidebar collapsing
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Data States (for interactive mockup)
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [internships] = useState<Internship[]>(INITIAL_INTERNSHIPS);
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [emailPreferences, setEmailPreferences] = useState<EmailReportPreference[]>(INITIAL_EMAIL_PREFERENCES);
  
  const [savedIds, setSavedIds] = useState<string[]>(['int_5', 'int_7']);
  const [appliedIds, setAppliedIds] = useState<string[]>(['int_3', 'int_1', 'int_6']);

  // FAQ Expand state
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Handler functions for mock actions
  const handleToggleCompanyTrack = (id: string) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isTracking: !c.isTracking } : c))
    );
    // Add activity logging
    const target = companies.find((c) => c.id === id);
    if (target) {
      const isTrackingNow = !target.isTracking;
      const newAct: Activity = {
        id: `act_${Date.now()}`,
        type: 'system',
        message: `${isTrackingNow ? 'Started' : 'Stopped'} tracking openings for ${target.name}`,
        timestamp: 'Just now'
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  };

  const handleToggleSaveInternship = (id: string) => {
    setSavedIds((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((x) => x !== id) : [...prev, id];
      
      const target = internships.find((r) => r.id === id);
      if (target) {
        const newAct: Activity = {
          id: `act_${Date.now()}`,
          type: 'match',
          message: `${exists ? 'Removed' : 'Saved'} position: ${target.role} at ${target.companyName}`,
          timestamp: 'Just now',
          internshipId: id
        };
        setActivities((actPrev) => [newAct, ...actPrev]);
      }
      return updated;
    });
  };

  const handleTrackApplication = (role: Internship) => {
    // Check if already tracked
    if (appliedIds.includes(role.id)) return;

    // Add to applications list
    const newApp: Application = {
      id: `app_${Date.now()}`,
      internshipId: role.id,
      companyName: role.companyName,
      companyLogo: role.companyLogo,
      role: role.role,
      status: 'applied',
      appliedDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: 'Promoted from saved internships search.',
      nextStep: 'Resume Screen'
    };

    setApplications((prev) => [newApp, ...prev]);
    setAppliedIds((prev) => [...prev, role.id]);

    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: 'applied',
      message: `Started tracking application for ${role.role} at ${role.companyName}`,
      timestamp: 'Just now',
      internshipId: role.id
    };
    setActivities((prev) => [newAct, ...prev]);

    // Go to applications tab
    setActiveTab('applications');
  };

  const handleUpdateApplicationStatus = (id: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] } : app))
    );

    const target = applications.find((app) => app.id === id);
    if (target) {
      const newAct: Activity = {
        id: `act_${Date.now()}`,
        type: newStatus === 'interviewing' ? 'interview' : 'system',
        message: `Updated application stage for ${target.companyName} (${target.role}) to: ${newStatus}`,
        timestamp: 'Just now'
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  };

  const handleDeleteApplication = (id: string) => {
    const target = applications.find((app) => app.id === id);
    if (target) {
      setAppliedIds((prev) => prev.filter((x) => x !== target.internshipId));
    }
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const handleAddCustomApplication = (app: Omit<Application, 'id' | 'lastUpdated'>) => {
    const newApp: Application = {
      ...app,
      id: `app_${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setApplications((prev) => [newApp, ...prev]);

    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: 'applied',
      message: `Added custom application: ${app.role} at ${app.companyName}`,
      timestamp: 'Just now'
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleTogglePreference = (id: string) => {
    setEmailPreferences((prev) =>
      prev.map((pref) => (pref.id === id ? { ...pref, isActive: !pref.isActive } : pref))
    );
  };

  const renderActiveDashboardTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <DashboardOverview
            companies={companies}
            internships={internships}
            applications={applications}
            activities={activities}
            onNavigate={(tab) => setActiveTab(tab)}
            onTrackInternship={handleTrackApplication}
          />
        );
      case 'companies':
        return (
          <DashboardCompanies
            companies={companies}
            onToggleTrack={handleToggleCompanyTrack}
          />
        );
      case 'internships':
        return (
          <DashboardInternships
            internships={internships}
            savedIds={savedIds}
            appliedIds={appliedIds}
            onToggleSave={handleToggleSaveInternship}
            onTrackInternship={handleTrackApplication}
          />
        );
      case 'saved':
        return (
          <DashboardSaved
            internships={internships}
            savedIds={savedIds}
            appliedIds={appliedIds}
            onRemoveSave={handleToggleSaveInternship}
            onTrackInternship={handleTrackApplication}
          />
        );
      case 'applications':
        return (
          <DashboardApplications
            applications={applications}
            onUpdateStatus={handleUpdateApplicationStatus}
            onDeleteApplication={handleDeleteApplication}
            onAddApplication={handleAddCustomApplication}
          />
        );
      case 'email-reports':
        return (
          <DashboardEmailReports
            preferences={emailPreferences}
            onTogglePreference={handleTogglePreference}
          />
        );
      case 'analytics':
        return <DashboardAnalytics />;
      case 'settings':
        return <DashboardSettings />;
      default:
        return <div className="text-white">Under Construction</div>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen text-foreground relative overflow-hidden bg-[#09090B]">
      
      {/* Absolute ambient grid glow overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-gradient-to-b from-primary/10 to-transparent rounded-full filter blur-[140px] pointer-events-none z-0" />

      <AnimatePresence mode="wait">
        
        {/* LANDING PAGE ROUTE VIEW */}
        {viewMode === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col relative z-10"
          >
            <Header onViewDemo={() => setViewMode('dashboard')} />

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] sm:text-xs font-bold text-text-muted hover:border-zinc-700 transition-colors cursor-pointer select-none"
                onClick={() => setViewMode('dashboard')}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span>Introducing InternScope 1.0 Demo Dashboard</span>
                <Play className="w-2.5 h-2.5 text-text-muted fill-current" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-white leading-[1.05]"
              >
                Never Miss Your Dream <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                  Tech Internship
                </span>{' '}
                Again.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-sm sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed"
              >
                InternScope AI actively monitors career pages from 100+ top tech companies, calculates your resume match score, and sends personalized alerts before applications close.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="w-full sm:w-auto relative group overflow-hidden px-6 py-3 rounded-lg bg-primary hover:bg-blue-700 text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 hover:shadow-primary/35"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-semibold text-white hover:text-primary hover:bg-zinc-850 transition-colors flex items-center justify-center gap-2"
                >
                  <span>View Demo</span>
                </button>
              </motion.div>
            </section>

            {/* DASHBOARD PREVIEW SCREENSHOT */}
            <section id="demo" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 select-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 shadow-2xl shadow-black/80 overflow-hidden cursor-pointer group"
                onClick={() => setViewMode('dashboard')}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent z-20" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-xs transition-opacity z-30">
                  <div className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-850 font-bold text-white text-xs flex items-center gap-2 shadow-2xl">
                    <Play className="w-3.5 h-3.5 fill-current text-primary" />
                    <span>Launch Interactive Demo App</span>
                  </div>
                </div>
                
                {/* Visual Fake Dashboard Window Header */}
                <div className="h-6 flex items-center gap-1.5 px-3 border-b border-zinc-800/80 bg-zinc-900/60 rounded-t-xl text-[10px] text-text-muted">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
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
              </motion.div>
            </section>

            {/* TARGET COMPANIES SCROLLER */}
            <section id="companies" className="border-t border-b border-zinc-900 py-16 bg-[#111113]/30">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 select-none">
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Deeply monitoring pipelines from top technology hubs
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 justify-items-center opacity-70">
                  {INITIAL_COMPANIES.map((company) => (
                    <div
                      key={company.id}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition-colors"
                      title={company.name}
                    >
                      <CompanyLogo logo={company.logo} name={company.name} size="sm" />
                      <span className="text-[10px] text-text-muted font-bold font-mono">{company.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 space-y-12">
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
                      className="bg-[#18181B] border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5 group shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
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
            </section>

            {/* HOW IT WORKS SECTION */}
            <section id="how-it-works" className="border-t border-zinc-900 bg-zinc-950/20 py-20 sm:py-28">
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
                    <div key={item.step} className="bg-[#18181B] border border-zinc-900 rounded-xl p-6 relative">
                      <span className="absolute top-4 right-4 text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                        Step {item.step}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-4">{item.title}</h3>
                      <p className="text-xs text-text-muted leading-relaxed mt-2">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* TESTIMONIALS */}
            <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 space-y-12 select-none">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Reviews</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Loved by Student Builders</h2>
                <p className="text-xs sm:text-sm text-text-muted">Hear from students who used our scraper alert integrations to secure offers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} className="bg-[#18181B] border border-zinc-850 rounded-xl p-6 flex flex-col justify-between h-48">
                    <p className="text-xs text-text-muted leading-relaxed italic">
                      &ldquo;{t.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
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
            </section>

            {/* FAQ SECTION */}
            <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 space-y-8 select-none">
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
                        className="w-full flex items-center justify-between text-left focus:outline-none py-2"
                      >
                        <span className="text-xs sm:text-sm font-semibold text-zinc-100 hover:text-white transition-colors">
                          {faq.question}
                        </span>
                        <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform', isOpen && 'rotate-180')} />
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
            </section>

            {/* PRICING (COMING SOON) CALL-TO-ACTION */}
            <section id="pricing" className="max-w-4xl mx-auto px-4 sm:px-6 pb-28 text-center select-none">
              <div className="bg-gradient-to-tr from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8 sm:p-12 space-y-6 relative overflow-hidden">
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
                    onClick={() => setViewMode('dashboard')}
                    className="mx-auto px-6 py-3 rounded-lg bg-primary hover:bg-blue-700 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/15"
                  >
                    <span>Launch Free Live Demo</span>
                    <Play className="w-3.5 h-3.5 fill-current text-white" />
                  </button>
                </div>
              </div>
            </section>

            <Footer />
          </motion.div>
        )}

        {/* DASHBOARD ROUTE VIEW */}
        {viewMode === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex"
          >
            {/* Collapsible Sidebar */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              isCollapsed={sidebarCollapsed}
              setIsCollapsed={setSidebarCollapsed}
              onExitDemo={() => setViewMode('landing')}
            />

            {/* Mobile Drawer Overlay */}
            {mobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
            )}

            {/* Mobile Slid-in Sidebar Wrapper */}
            <div
              className={cn(
                'fixed top-0 bottom-0 left-0 z-40 md:hidden transition-transform duration-300 transform',
                mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setMobileSidebarOpen(false);
                }}
                isCollapsed={false}
                setIsCollapsed={() => {}}
                onExitDemo={() => setViewMode('landing')}
              />
            </div>

            {/* Main Page Workspace */}
            <div
              className={cn(
                'flex-1 flex flex-col min-h-screen transition-all duration-300',
                sidebarCollapsed ? 'md:ml-[70px]' : 'md:ml-[240px]'
              )}
            >
              {/* Top Navigation */}
              <Navbar
                onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                title={activeTab}
              />

              {/* Central Dynamic View Area */}
              <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#09090B] overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                  {renderActiveDashboardTab()}
                </div>
              </main>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
