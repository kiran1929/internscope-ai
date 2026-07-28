'use client';

import React, { useState } from 'react';
import { Mail, ShieldCheck, Check, BellRing } from 'lucide-react';
import { EmailReportPreference } from '@/types';
import { cn } from '@/lib/utils';

interface DashboardEmailReportsProps {
  preferences: EmailReportPreference[];
  onTogglePreference: (id: string) => void;
}

export const DashboardEmailReports: React.FC<DashboardEmailReportsProps> = ({
  preferences,
  onTogglePreference
}) => {
  const [emailInput, setEmailInput] = useState('kirandeep@university.edu');
  const [emailSaved, setEmailSaved] = useState(false);

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-3xl">
      <div>
        <h2 className="text-base font-bold text-white">Email Alerts & Reports</h2>
        <p className="text-xs text-text-muted">Configure personalized reports and instantaneous application deadline nudges</p>
      </div>

      {/* Target Address Card */}
      <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Alert Destination</h3>
        <form onSubmit={handleSaveEmail} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <Mail className="w-4.5 h-4.5 text-text-muted shrink-0" />
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-white w-full placeholder:text-text-muted/70"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-lg transition-colors shrink-0 flex items-center justify-center gap-1.5"
          >
            {emailSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Update Destination</span>
            )}
          </button>
        </form>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <ShieldCheck className="w-4 h-4 text-success" />
          <span>Double opt-in verification active. We never sell your personal information.</span>
        </div>
      </div>

      {/* Alert Rules Preferences List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Report Subscriptions</h3>
        
        <div className="space-y-3.5">
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className={cn(
                'bg-[#18181B] border rounded-xl p-5 transition-all duration-200 flex items-start justify-between gap-4',
                pref.isActive ? 'border-primary/30 shadow-[0_0_12px_rgba(37,99,235,0.03)]' : 'border-zinc-800/80'
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className={cn('p-1.5 rounded-md', pref.isActive ? 'bg-primary/10 text-primary' : 'bg-zinc-900 text-text-muted')}>
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{pref.name}</h4>
                    <span className="text-[10px] text-text-muted uppercase font-mono font-semibold">{pref.frequency} frequency</span>
                  </div>
                </div>

                <p className="text-xs text-text-muted leading-relaxed">
                  Trigger alerts for: {pref.categories.join(' or ')}. Filtered to tracked companies.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => onTogglePreference(pref.id)}
                className={cn(
                  'w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 relative',
                  pref.isActive ? 'bg-primary' : 'bg-zinc-800'
                )}
                aria-label={`Toggle ${pref.name}`}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transition-transform shadow-md',
                    pref.isActive ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Scraper Status Panel */}
      <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Delivery Performance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850">
            <span className="text-lg font-bold text-white font-display block">100%</span>
            <span className="text-[10px] text-text-muted font-medium uppercase mt-1 block">In-box Deliverability</span>
          </div>
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850">
            <span className="text-lg font-bold text-white font-display block">28,401</span>
            <span className="text-[10px] text-text-muted font-medium uppercase mt-1 block">Alerts Dispatched</span>
          </div>
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850">
            <span className="text-lg font-bold text-white font-display block">6 hours</span>
            <span className="text-[10px] text-text-muted font-medium uppercase mt-1 block">Max Scraper Delay</span>
          </div>
        </div>
      </div>

    </div>
  );
};
export default DashboardEmailReports;
