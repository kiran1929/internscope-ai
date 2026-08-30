'use client';

import React, { useState, useTransition } from 'react';
import { User, Shield, Check, Sparkles, Mail, Eye, Moon, Sun, Loader2, Download, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateEmailPreferenceAction } from '@/app/actions/candidate';
import { exportAccountDataAction, requestDataDeletionAction } from '@/app/actions/compliance';
import CandidateFeedbackClient from './CandidateFeedbackClient';
import { useTheme } from '@/providers/ThemeProvider';

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
  const { theme, setTheme } = useTheme();
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

  const handleExportData = () => {
    startTransition(async () => {
      const res = await exportAccountDataAction();
      if (res.success && res.dataString) {
        const blob = new Blob([res.dataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'internscope-account-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Account data exported successfully.');
      } else {
        toast.error(`Export failed: ${res.error}`);
      }
    });
  };

  const handleDeleteAccount = () => {
    if (!confirm('CAUTION: Are you sure you want to permanently delete your InternScope AI account and all stored data? This action is irreversible.')) {
      return;
    }
    startTransition(async () => {
      const res = await requestDataDeletionAction();
      if (res.success) {
        toast.success('Your account and associated data have been permanently deleted.');
        router.push('/');
      } else {
        toast.error(`Deletion failed: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">Platform Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">Manage your email alerts, system dashboard theme, and data privacy options.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        
        {/* Left Column (70%): Forms & Preferences */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Notification Preferences */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xs">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <Mail className="w-4.5 h-4.5 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Email alerts & notifications</h3>
            </div>

            <div className="space-y-5 text-xs sm:text-sm">
              
              {/* Weekly digest preference */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-foreground block text-sm">Weekly Digest Newsletter</span>
                  <span className="text-xs text-text-muted mt-1 block">Weekly catalog of matching jobs, application tracking updates, and deadline logs.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWeeklyDigest(!weeklyDigest)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 relative cursor-pointer ${
                    weeklyDigest ? 'bg-primary' : 'bg-surface-muted border border-border-subtle'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                      weeklyDigest ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Instant Alert preference */}
              <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-5">
                <div>
                  <span className="font-bold text-foreground block text-sm">Instant Skill Matches Alerts</span>
                  <span className="text-xs text-text-muted mt-1 block">Trigger email alert notifications instantly when a new opportunity is enriched matching your skills.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInstantAlerts(!instantAlerts)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 relative cursor-pointer ${
                    instantAlerts ? 'bg-primary' : 'bg-surface-muted border border-border-subtle'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                      instantAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Deadline reminder preference */}
              <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-5">
                <div>
                  <span className="font-bold text-foreground block text-sm">Deadline Closing Reminders</span>
                  <span className="text-xs text-text-muted mt-1 block">Receive upcoming warning notifications for saved opportunities closing in 48 hours.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeadlineReminders(!deadlineReminders)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 relative cursor-pointer ${
                    deadlineReminders ? 'bg-primary' : 'bg-surface-muted border border-border-subtle'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                      deadlineReminders ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>

            <div className="pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    const { sendTestOpportunityEmailAction } = await import('@/app/actions/candidate');
                    toast.info('Sending test opportunity email via SMTP...');
                    const res = await sendTestOpportunityEmailAction();
                    if (res.success) {
                      toast.success(`Test email sent to ${res.recipient}! (MsgID: ${res.messageId || 'Success'})`);
                    } else {
                      toast.error(`Email delivery failed: ${res.error}`);
                    }
                  });
                }}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-subtle bg-surface-muted hover:bg-surface-elevated text-xs font-semibold text-foreground transition-all hover:cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Send Test Opportunity Email (SMTP)</span>
              </button>

              <button
                type="button"
                onClick={handlePreferenceSave}
                disabled={isPending}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-all shadow-md shadow-primary/20 hover:cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interface Appearance settings */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xs">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <Moon className="w-4.5 h-4.5 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Appearance & theme</h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
              <div>
                <span className="font-bold text-foreground block text-sm">Visual Interface Mode</span>
                <span className="text-xs text-text-muted mt-1 block">Select the aesthetic styling for your user dashboard layout.</span>
              </div>

              <div className="flex bg-input-bg border border-border-subtle p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-card-bg text-primary shadow-2xs' : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light' ? 'bg-card-bg text-primary shadow-2xs' : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Compliance Controls */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xs">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <Shield className="w-4.5 h-4.5 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Data privacy & logs</h3>
            </div>

            <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-subtle">
              <div>
                <span className="font-bold text-foreground block text-sm">AI Matching Privacy Mode</span>
                <span className="text-xs text-text-muted mt-1 block">Anonymize query history log metrics when analyzing match metrics.</span>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 relative cursor-pointer ${
                  privacyMode ? 'bg-primary' : 'bg-surface-muted border border-border-subtle'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                    privacyMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* GDPR Exports & Deletions */}
            <div className="space-y-3.5 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">GDPR & CCPA Rights Workspace</span>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-input-bg border border-border-subtle hover:bg-surface-muted rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-text-muted" />
                  <span>Export Account Data (JSON)</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Delete Profile Permanently</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (30%): Account tier info + Beta Feedback */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <Sparkles className="w-4.5 h-4.5 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Subscription Tier</h3>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-amber-700/5 border border-amber-500/20 rounded-xl p-5 space-y-3.5 text-xs">
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">PRO PLAN ACTIVE</span>
                <span className="text-xl font-extrabold text-foreground font-mono mt-1 block">$8 / month</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Provides tailwind matches, instant SMS summaries, automated resumes upload matching, and unlimited background trackers.
              </p>
              <button
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-zinc-950 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                onClick={() => toast.success('Premium Pro subscriber verified.')}
              >
                Subscription Active
              </button>
            </div>
          </div>

          <CandidateFeedbackClient />

        </div>

      </div>
    </div>
  );
}
