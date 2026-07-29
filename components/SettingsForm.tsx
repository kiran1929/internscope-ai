'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Settings,
  Globe,
  Mail,
  Cpu,
  Compass,
  Shield,
  Palette,
  Save,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  generalSettingsSchema,
  platformSettingsSchema,
  emailSettingsSchema,
  aiSettingsSchema,
  scraperSettingsSchema,
  securitySettingsSchema,
  appearanceSettingsSchema
} from '@/lib/validation/settings';

type SectionType = 'GENERAL' | 'PLATFORM' | 'EMAIL' | 'AI' | 'SCRAPER' | 'SECURITY' | 'APPEARANCE';

export const SettingsForm: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('GENERAL');

  // 1. General settings form
  const generalForm = useForm({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: { siteName: 'InternScope AI', supportEmail: 'support@internscope.ai' },
  });

  // 2. Platform settings form
  const platformForm = useForm({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: { allowSignups: true, maintenanceMode: false },
  });

  // 3. Email settings form
  const emailForm = useForm({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: { smtpHost: 'smtp.resend.com', smtpPort: 587 },
  });

  // 4. AI settings form
  const aiForm = useForm({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: { modelName: 'gemini-2.0-flash-exp', temperature: 0.7 },
  });

  // 5. Scraper settings form
  const scraperForm = useForm({
    resolver: zodResolver(scraperSettingsSchema),
    defaultValues: { cronInterval: '0 0 * * *', maxConcurrentJobs: 3 },
  });

  // 6. Security settings form
  const securityForm = useForm({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: { requireMfa: false, passwordExpiryDays: 90 },
  });

  // 7. Appearance settings form
  const appearanceForm = useForm({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: { theme: 'dark' as 'light' | 'dark' | 'system', primaryColor: '#7c3aed' },
  });

  const onSave = (data: unknown) => {
    console.log('Saved settings data:', data);
    toast.success('Configuration saved successfully');
  };

  const navItems = [
    { type: 'GENERAL', label: 'General', icon: Settings },
    { type: 'PLATFORM', label: 'Platform Rules', icon: Globe },
    { type: 'EMAIL', label: 'SMTP & Email', icon: Mail, tag: 'Placeholder' },
    { type: 'AI', label: 'AI Engine Integration', icon: Cpu, tag: 'Future Phase' },
    { type: 'SCRAPER', label: 'Crawler & Scrapers', icon: Compass, tag: 'Future Phase' },
    { type: 'SECURITY', label: 'Security & Auth', icon: Shield },
    { type: 'APPEARANCE', label: 'Aesthetics', icon: Palette },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none text-white">
      {/* Sidebar Navigation */}
      <div className="md:col-span-1 bg-[#111113] border border-zinc-800/80 p-3 rounded-xl flex flex-col gap-1 shadow-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.type;
          return (
            <button
              key={item.type}
              onClick={() => setActiveSection(item.type as SectionType)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer border text-left',
                isActive
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-transparent border-transparent text-text-muted hover:text-white'
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              {item.tag && (
                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 shrink-0 tracking-wider">
                  {item.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Forms Area */}
      <div className="md:col-span-3">
        {/* GENERAL */}
        {activeSection === 'GENERAL' && (
          <form
            onSubmit={generalForm.handleSubmit(onSave)}
            className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-5"
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">General Settings</h3>
              <p className="text-[10px] text-text-muted mt-0.5">Basic brand identity configuration.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                  Platform Display Name
                </label>
                <input
                  type="text"
                  {...generalForm.register('siteName')}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60"
                />
                {generalForm.formState.errors.siteName && (
                  <p className="text-[10px] text-red-400 font-bold font-mono">
                    {generalForm.formState.errors.siteName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                  Support Email Address
                </label>
                <input
                  type="email"
                  {...generalForm.register('supportEmail')}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60"
                />
                {generalForm.formState.errors.supportEmail && (
                  <p className="text-[10px] text-red-400 font-bold font-mono">
                    {generalForm.formState.errors.supportEmail.message}
                  </p>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold">
              <Save className="w-4 h-4" /> Save General Settings
            </button>
          </form>
        )}

        {/* PLATFORM */}
        {activeSection === 'PLATFORM' && (
          <form
            onSubmit={platformForm.handleSubmit(onSave)}
            className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-5"
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Platform Control</h3>
              <p className="text-[10px] text-text-muted mt-0.5">Control public signup access policies.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-lg">
                <div>
                  <p className="text-xs font-bold text-white">Allow Public Student Registration</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Allow new candidate signups from Google or Github.</p>
                </div>
                <input
                  type="checkbox"
                  {...platformForm.register('allowSignups')}
                  className="w-4 h-4 rounded border-zinc-800 text-primary accent-primary outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-lg">
                <div>
                  <p className="text-xs font-bold text-white">Maintenance Mode</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Locks public paths, showing a maintenance screen.</p>
                </div>
                <input
                  type="checkbox"
                  {...platformForm.register('maintenanceMode')}
                  className="w-4 h-4 rounded border-zinc-800 text-primary accent-primary outline-none"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold">
              <Save className="w-4 h-4" /> Save Platform Rules
            </button>
          </form>
        )}

        {/* EMAIL (Placeholder) */}
        {activeSection === 'EMAIL' && (
          <div className="space-y-6">
            <form
              onSubmit={emailForm.handleSubmit(onSave)}
              className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-5 relative"
            >
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  SMTP Integration <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 border border-primary/20 bg-primary/10 text-primary rounded">Placeholder</span>
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5">Configure transactional mail server credentials.</p>
              </div>

              <div className="space-y-4 opacity-50 pointer-events-none">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">SMTP Server Host</label>
                  <input type="text" {...emailForm.register('smtpHost')} className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">SMTP Port</label>
                  <input type="number" {...emailForm.register('smtpPort')} className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white" />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold cursor-not-allowed opacity-50" disabled>
                <Save className="w-4 h-4" /> SMTP Settings Saved (Locked)
              </button>
            </form>

            <div className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
              <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">SMTP Configuration Locked</p>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Email transmission interfaces are currently in mock mode for Phase 2. Resend transactional templates integrations will be unlocked in later implementation phases.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI (Placeholder) */}
        {activeSection === 'AI' && (
          <div className="space-y-6">
            <form
              onSubmit={aiForm.handleSubmit(onSave)}
              className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-5 relative"
            >
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  AI Vector Pipeline <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 border border-primary/20 bg-primary/10 text-primary rounded animate-pulse">Future Phase</span>
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5">Configure skill mapping thresholds and model names.</p>
              </div>

              <div className="space-y-4 opacity-50 pointer-events-none">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Target Model Name</label>
                  <input type="text" {...aiForm.register('modelName')} className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Correlation Temperature</label>
                  <input type="number" step="0.1" {...aiForm.register('temperature')} className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white" />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold cursor-not-allowed opacity-50" disabled>
                <Save className="w-4 h-4" /> Save AI Model Properties (Locked)
              </button>
            </form>

            <div className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">AI Vector Vectorizer Idle</p>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  The AI matching matching logic will be implemented in future cycles. It will use the Google Gemini SDK for automated candidate profiling and index matching.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SCRAPER (Placeholder) */}
        {activeSection === 'SCRAPER' && (
          <div className="space-y-6">
            <form
              onSubmit={scraperForm.handleSubmit(onSave)}
              className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-5 relative"
            >
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  Crawler Schedules <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 border border-primary/20 bg-primary/10 text-primary rounded animate-pulse">Future Phase</span>
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5">Control crawler intervals and crawling threads.</p>
              </div>

              <div className="space-y-4 opacity-50 pointer-events-none">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Cron Schedule Interval</label>
                  <input type="text" {...scraperForm.register('cronInterval')} className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Max Concurrency</label>
                  <input type="number" {...scraperForm.register('maxConcurrentJobs')} className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white" />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold cursor-not-allowed opacity-50" disabled>
                <Save className="w-4 h-4" /> Save Scraper Config (Locked)
              </button>
            </form>

            <div className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
              <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">Automated Web Crawler Syncer</p>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Platform opportunities crawler triggers will be connected to serverless cron schedules. Real-time updates from tech company portals are disabled for this preview phase.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY */}
        {activeSection === 'SECURITY' && (
          <form
            onSubmit={securityForm.handleSubmit(onSave)}
            className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-5"
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Platform Security</h3>
              <p className="text-[10px] text-text-muted mt-0.5">Control global password expirations and multi-factor flags.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-lg">
                <div>
                  <p className="text-xs font-bold text-white">Require Multi-Factor (MFA)</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Force all administrative staff accounts to enable TOTP keys.</p>
                </div>
                <input
                  type="checkbox"
                  {...securityForm.register('requireMfa')}
                  className="w-4 h-4 rounded border-zinc-800 text-primary accent-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                  Password Expiry Days
                </label>
                <input
                  type="number"
                  {...securityForm.register('passwordExpiryDays')}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60"
                />
                {securityForm.formState.errors.passwordExpiryDays && (
                  <p className="text-[10px] text-red-400 font-bold font-mono">
                    {securityForm.formState.errors.passwordExpiryDays.message}
                  </p>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold">
              <Save className="w-4 h-4" /> Save Security Policies
            </button>
          </form>
        )}

        {/* APPEARANCE */}
        {activeSection === 'APPEARANCE' && (
          <form
            onSubmit={appearanceForm.handleSubmit(onSave)}
            className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-5"
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Appearance & Branding</h3>
              <p className="text-[10px] text-text-muted mt-0.5">Customize global themes and primary brand colors.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                  Default Platform Theme
                </label>
                <select
                  {...appearanceForm.register('theme')}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white outline-none cursor-pointer focus:border-primary/60"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                  <option value="system">Follow System Defaults</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                  Primary Accent Color (Hex)
                </label>
                <div className="flex gap-2">
                  <div
                    className="w-9 h-9 rounded-lg border border-zinc-800 shrink-0"
                    style={{ backgroundColor: appearanceForm.watch('primaryColor') }}
                  />
                  <input
                    type="text"
                    {...appearanceForm.register('primaryColor')}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-primary/60 font-mono"
                  />
                </div>
                {appearanceForm.formState.errors.primaryColor && (
                  <p className="text-[10px] text-red-400 font-bold font-mono">
                    {appearanceForm.formState.errors.primaryColor.message}
                  </p>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold">
              <Save className="w-4 h-4" /> Save Appearance Settings
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}
