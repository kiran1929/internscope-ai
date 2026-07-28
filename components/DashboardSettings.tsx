'use client';

import React, { useState } from 'react';
import { User, Shield, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardSettings: React.FC = () => {
  const [profileSaved, setProfileSaved] = useState(false);
  const [scraperSaved, setScraperSaved] = useState(false);

  const [name, setName] = useState('Kirandeep Gudepu');
  const [email, setEmail] = useState('kirandeep@university.edu');
  const [university, setUniversity] = useState('State University');
  const [gradYear, setGradYear] = useState('2027');
  const [targetRole, setTargetRole] = useState('Backend Engineer');

  const [interval, setInterval] = useState('6h');
  const [autoArchive, setAutoArchive] = useState(true);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleScraperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScraperSaved(true);
    setTimeout(() => setScraperSaved(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-white">Platform Settings</h2>
        <p className="text-xs text-text-muted">Manage your profile, scraper schedules, and account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left/Middle Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Form */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-white">Profile Details</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-text-muted">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-text-muted">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-text-muted">University</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-text-muted">Graduation Year</label>
                  <input
                    type="text"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-muted">Target Focus / Desired Roles</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Frontend Engineer, ML Researcher"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="btn-secondary focus-ring py-2 text-xs"
                >
                  {profileSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span>Details Saved</span>
                    </>
                  ) : (
                    <span>Save Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Scraper Configuration Form */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-white">Scraper Preferences</h3>
            </div>

            <form onSubmit={handleScraperSubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-text-muted">Scraping Interval Schedule</label>
                <div className="grid grid-cols-3 gap-3">
                  {['6h', '12h', '24h'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setInterval(val)}
                      className={cn(
                        'py-2 border rounded-lg font-semibold text-center transition-all focus-ring',
                        interval === val
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-zinc-800 bg-zinc-900/40 text-text-muted hover:text-white'
                      )}
                    >
                      Every {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-zinc-900/60 pt-3">
                <div>
                  <span className="font-semibold text-white block">Auto-archive Closed Positions</span>
                  <span className="text-[10px] text-text-muted mt-0.5 block">Hide applications if our system detects the opening is closed.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoArchive(!autoArchive)}
                  className={cn(
                    'w-10 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none focus-ring shrink-0 relative',
                    autoArchive ? 'bg-primary' : 'bg-zinc-800'
                  )}
                  aria-label="Toggle auto-archive closed positions"
                >
                  <div
                    className={cn(
                      'w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-md',
                      autoArchive ? 'translate-x-4.5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="btn-secondary focus-ring py-2 text-xs"
                >
                  {scraperSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span>Preferences Saved</span>
                    </>
                  ) : (
                    <span>Update Preferences</span>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: Account tier info */}
        <div className="bg-[#18181B] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-white">Subscription Tier</h3>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-700/5 border border-amber-500/25 rounded-xl p-4 space-y-3.5 text-xs">
            <div>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">PRO PLAN</span>
              <span className="text-lg font-black text-white font-display mt-0.5 block">$8 / month</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Unlock automated resume tailoring, unlimited scrapers, integration webhooks, and SMS deadline push alerts.
            </p>
            <button
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-zinc-950 rounded-lg text-xs transition-colors shadow-lg shadow-amber-500/10"
              onClick={() => alert('Subscription integration coming soon in the next phase.')}
            >
              Upgrade to Pro (Demo)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default DashboardSettings;
