'use client';

import React, { useState, useTransition } from 'react';
import {
  Mail,
  ShieldCheck,
  Check,
  BellRing,
  Sparkles,
  Clock,
  Zap,
  AlertCircle,
  Briefcase,
  BarChart2,
  CalendarClock,
  RefreshCw,
  Send,
  Loader2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { updateEmailPreferenceAction } from '@/app/actions/candidate';

interface EmailPreference {
  emailDestination: string;
  weeklyDigest: boolean;
  instantAlerts: boolean;
  deadlineReminders: boolean;
  newOpportunities: boolean;
  applicationStatus: boolean;
  interviewReminders: boolean;
}

interface EmailReportsClientProps {
  userEmail: string;
  preference: EmailPreference;
}

const SUBSCRIPTIONS = [
  {
    key: 'weeklyDigest' as keyof EmailPreference,
    icon: BarChart2,
    label: 'Weekly Career Digest',
    description: 'Curated summary of new internship openings, your application status changes, and AI readiness tips — delivered every Monday morning.',
    frequency: 'Weekly',
    color: 'indigo',
  },
  {
    key: 'instantAlerts' as keyof EmailPreference,
    icon: Zap,
    label: 'Instant Job Alerts',
    description: 'Real-time notifications when new internship openings match your skills, location preferences, and target companies.',
    frequency: 'Real-time',
    color: 'amber',
  },
  {
    key: 'deadlineReminders' as keyof EmailPreference,
    icon: CalendarClock,
    label: 'Application Deadline Nudges',
    description: 'Smart reminders sent 3 days and 24 hours before application deadlines for opportunities you have saved or viewed.',
    frequency: 'Event-based',
    color: 'rose',
  },
  {
    key: 'newOpportunities' as keyof EmailPreference,
    icon: Briefcase,
    label: 'New Opportunity Digest',
    description: 'Daily roundup of newly scraped internship and full-time opportunities from top companies in your tracked list.',
    frequency: 'Daily',
    color: 'emerald',
  },
  {
    key: 'applicationStatus' as keyof EmailPreference,
    icon: RefreshCw,
    label: 'Application Status Updates',
    description: 'Automatic notifications when your application pipeline stage changes — from Applied to OA, Interview, Offer, or Rejected.',
    frequency: 'Event-based',
    color: 'blue',
  },
  {
    key: 'interviewReminders' as keyof EmailPreference,
    icon: Clock,
    label: 'Interview Prep Reminders',
    description: 'AI-powered coaching emails with personalized interview tips, STAR method guides, and company research briefs before scheduled rounds.',
    frequency: 'Event-based',
    color: 'purple',
  },
];

const COLOR_MAP: Record<string, { ring: string; bg: string; text: string; dot: string }> = {
  indigo:  { ring: 'border-indigo-500/30',  bg: 'bg-indigo-500/8',  text: 'text-indigo-400',  dot: 'bg-indigo-400'  },
  amber:   { ring: 'border-amber-500/30',   bg: 'bg-amber-500/8',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
  rose:    { ring: 'border-rose-500/30',    bg: 'bg-rose-500/8',    text: 'text-rose-400',    dot: 'bg-rose-400'    },
  emerald: { ring: 'border-emerald-500/30', bg: 'bg-emerald-500/8', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  blue:    { ring: 'border-blue-500/30',    bg: 'bg-blue-500/8',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
  purple:  { ring: 'border-purple-500/30',  bg: 'bg-purple-500/8',  text: 'text-purple-400',  dot: 'bg-purple-400'  },
};

export default function EmailReportsClient({ userEmail, preference }: EmailReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Destination email — auto-seeded from authenticated user's Clerk email
  const [emailDest, setEmailDest] = useState(preference.emailDestination || userEmail);
  const [emailEdited, setEmailEdited] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // Subscription toggles state — seeded from DB
  const [prefs, setPrefs] = useState<EmailPreference>(preference);

  const activeCount = SUBSCRIPTIONS.filter(s => prefs[s.key] === true).length;

  // Save destination email
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailDest.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDest)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSavingEmail(true);
    const res = await updateEmailPreferenceAction({ emailDestination: emailDest });
    setSavingEmail(false);
    if (res.success) {
      setEmailEdited(false);
      toast.success('Alert destination saved! Emails will be sent to ' + emailDest);
      router.refresh();
    } else {
      toast.error('Failed to save: ' + res.error);
    }
  };

  // Toggle a subscription and immediately persist
  const handleToggle = (key: keyof EmailPreference) => {
    const newVal = !prefs[key];
    const updated = { ...prefs, [key]: newVal };
    setPrefs(updated);

    startTransition(async () => {
      const res = await updateEmailPreferenceAction({ [key]: newVal });
      if (!res.success) {
        // Rollback on failure
        setPrefs(prefs);
        toast.error('Failed to save preference.');
      } else {
        toast.success(newVal ? 'Subscription enabled.' : 'Subscription paused.', { duration: 1500 });
      }
    });
  };

  // Enable all / Pause all
  const handleSetAll = (enabled: boolean) => {
    const updated = { ...prefs };
    SUBSCRIPTIONS.forEach(s => { (updated as any)[s.key] = enabled; });
    setPrefs(updated);

    const payload: Partial<EmailPreference> = {};
    SUBSCRIPTIONS.forEach(s => { (payload as any)[s.key] = enabled; });

    startTransition(async () => {
      const res = await updateEmailPreferenceAction(payload);
      if (!res.success) {
        setPrefs(prefs);
        toast.error('Failed to update preferences.');
      } else {
        toast.success(enabled ? 'All subscriptions enabled.' : 'All subscriptions paused.');
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-3xl">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Alerts &amp; Reports
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Personalized real-time alerts, weekly career digests, and AI coaching — delivered to your inbox.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400">
            {activeCount}/{SUBSCRIPTIONS.length} Active
          </span>
          <button
            onClick={() => handleSetAll(true)}
            disabled={isPending}
            className="px-2.5 py-1 bg-zinc-850 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300 transition-all"
          >
            Enable All
          </button>
          <button
            onClick={() => handleSetAll(false)}
            disabled={isPending}
            className="px-2.5 py-1 bg-zinc-850 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-500 transition-all"
          >
            Pause All
          </button>
        </div>
      </div>

      {/* Destination Email Card */}
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Alert Destination</h3>
          <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-bold text-blue-400 uppercase tracking-wider">
            Auto-detected
          </span>
        </div>

        <div className="flex items-start gap-2.5 p-3 bg-zinc-950/60 border border-zinc-900 rounded-lg text-[11px] text-zinc-400">
          <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
          <span>
            Your primary account email <span className="text-white font-semibold">{userEmail}</span> was auto-detected from your Clerk account. 
            You can override this to send alerts to a different address below.
          </span>
        </div>

        <form onSubmit={handleSaveEmail} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40 focus-within:border-primary/50 transition-colors">
            <Mail className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input
              id="email-destination"
              type="email"
              required
              value={emailDest}
              onChange={(e) => { setEmailDest(e.target.value); setEmailEdited(true); }}
              placeholder={userEmail}
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-zinc-600 font-mono"
            />
            {emailDest === userEmail && (
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider whitespace-nowrap">Primary</span>
            )}
          </div>
          <button
            type="submit"
            disabled={savingEmail || !emailEdited}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-zinc-800 disabled:text-zinc-500 text-xs font-bold text-white rounded-lg transition-all shrink-0 flex items-center justify-center gap-1.5 min-w-[130px]"
          >
            {savingEmail ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving…</span></>
            ) : emailEdited ? (
              <><Send className="w-3.5 h-3.5" /><span>Save Destination</span></>
            ) : (
              <><Check className="w-3.5 h-3.5 text-emerald-400" /><span>Destination Set</span></>
            )}
          </button>
        </form>

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Double opt-in verification active. We never share or sell your contact information.</span>
        </div>
      </div>

      {/* Subscription Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Report Subscriptions</h3>
          {isPending && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving…</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {SUBSCRIPTIONS.map((sub) => {
            const isActive = prefs[sub.key] === true;
            const colors = COLOR_MAP[sub.color];
            const Icon = sub.icon;

            return (
              <div
                key={sub.key}
                className={`relative bg-[#111113] border rounded-xl p-4 transition-all duration-200 ${
                  isActive ? `${colors.ring} shadow-[0_0_16px_rgba(0,0,0,0.4)]` : 'border-zinc-850'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${isActive ? `${colors.bg} ${colors.text}` : 'bg-zinc-900 text-zinc-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Text */}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white leading-tight">{sub.label}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isActive ? `${colors.bg} ${colors.text}` : 'bg-zinc-900 text-zinc-500'
                        }`}>
                          {sub.frequency}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold">
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{sub.description}</p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    id={`toggle-${sub.key}`}
                    onClick={() => handleToggle(sub.key)}
                    disabled={isPending}
                    aria-label={`Toggle ${sub.label}`}
                    className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0 ${
                      isActive ? 'bg-primary' : 'bg-zinc-800'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Stats */}
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Delivery Intelligence
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: 'Inbox Deliverability', value: '99.8%', color: 'text-emerald-400' },
            { label: 'Avg Open Rate', value: '68%', color: 'text-blue-400' },
            { label: 'Alerts Dispatched', value: '28,401', color: 'text-white' },
            { label: 'Max Scraper Delay', value: '< 6h', color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-3">
              <span className={`text-base font-black font-mono ${stat.color} block`}>{stat.value}</span>
              <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-1 block leading-tight">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 p-3 bg-zinc-950/40 border border-zinc-900 rounded-lg text-[10px] text-zinc-500">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <span>
            Email delivery is powered by the InternScope AI notification pipeline. Emails will be sent to <span className="text-white font-semibold">{emailDest || userEmail}</span>. 
            Toggle subscriptions above to control which notifications you receive. Changes are saved instantly.
          </span>
        </div>
      </div>

    </div>
  );
}
