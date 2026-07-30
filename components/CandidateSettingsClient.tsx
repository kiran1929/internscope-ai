'use client';

import React, { useState, useTransition } from 'react';
import { User, Shield, Check, Sparkles, Mail, Eye, Moon, Sun, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateEmailPreferenceAction } from '@/app/actions/candidate';

interface EmailPreference {
  weeklyDigest: boolean;
  instantAlerts: boolean;
  deadlineReminders: boolean;
}

interface CandidateSettingsClientProps {
  emailPreference: EmailPreference;
}

export default function CandidateSettingsClient({
  emailPreference,
}: CandidateSettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local settings states
  const [weeklyDigest, setWeeklyDigest] = useState(emailPreference.weeklyDigest);
  const [instantAlerts, setInstantAlerts] = useState(emailPreference.instantAlerts);
  const [deadlineReminders, setDeadlineReminders] = useState(emailPreference.deadlineReminders);
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [privacyMode, setPrivacyMode] = useState(true);

  // Submit Handler
  const handlePreferenceSave = () => {
    startTransition(async () => {
      const res = await updateEmailPreferenceAction({
        weeklyDigest,
        instantAlerts,
        deadlineReminders,
      });

      if (res.success) {
        toast.success('Notification settings saved successfully!');
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white max-w-4xl select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">Platform Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">Manage your email alerts, system dashboard theme, and data privacy options.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left/Middle Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Notification Preferences */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Mail className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Email alerts & notifications</h3>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Weekly digest preference */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-200 block">Weekly Digest Newsletter</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Weekly catalog of matching jobs, application tracking updates, and deadline logs.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWeeklyDigest(!weeklyDigest)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 relative ${
                    weeklyDigest ? 'bg-primary' : 'bg-zinc-850'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-md ${
                      weeklyDigest ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Instant Alert preference */}
              <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                <div>
                  <span className="font-semibold text-zinc-200 block">Instant Skill Matches Alerts</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Trigger email alert notifications instantly when a new opportunity is enriched matching your skills.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInstantAlerts(!instantAlerts)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 relative ${
                    instantAlerts ? 'bg-primary' : 'bg-zinc-850'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-md ${
                      instantAlerts ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Deadline reminder preference */}
              <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                <div>
                  <span className="font-semibold text-zinc-200 block">Deadline Closing Reminders</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Receive upcoming warning notifications for saved opportunities closing in 48 hours.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeadlineReminders(!deadlineReminders)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 relative ${
                    deadlineReminders ? 'bg-primary' : 'bg-zinc-850'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-md ${
                      deadlineReminders ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handlePreferenceSave}
                disabled={isPending}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-xs font-bold text-white transition-all disabled:opacity-50 hover:cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interface Appearance settings */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Moon className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Appearance & theme</h3>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-zinc-200 block font-sans">Visual Interface Mode</span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Select the aesthetic styling for your user dashboard layout.</span>
              </div>

              <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                    theme === 'dark' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>Dark Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    toast.info('Light mode is simulated; keeping premium glassmorphism dark theme enabled.');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                    theme === 'light' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>Light Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Controls */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Data privacy & logs</h3>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-zinc-200 block">AI Matching Privacy Mode</span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Anonymize query history log metrics when analyzing match metrics.</span>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 relative ${
                  privacyMode ? 'bg-primary' : 'bg-zinc-850'
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-md ${
                    privacyMode ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Account tier info */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Subscription Tier</h3>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-700/5 border border-amber-500/20 rounded-xl p-4 space-y-3 text-xs">
            <div>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">PRO PLAN ACTIVE</span>
              <span className="text-lg font-black text-white font-mono mt-0.5 block">$8 / month</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Provides tailwind matches, instant SMS summaries, automated resumes upload matching, and unlimited background trackers.
            </p>
            <button
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 font-bold text-zinc-950 rounded-lg text-xs transition-all shadow-md"
              onClick={() => toast.success('Premium Pro subscriber verified.')}
            >
              Subscription Active
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
