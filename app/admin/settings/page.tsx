import React from 'react';
import { AlertCircle, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          System Settings
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Configure scrapers, synchronization thresholds, and backend CMS rules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scraper Panel */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 md:col-span-2 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Scraper Sync Interval</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Control the cron cycle of automated company scraping bots.</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-zinc-900 bg-zinc-900/10">
              <div>
                <p className="text-xs font-semibold text-white">Automated Daily Sync</p>
                <p className="text-[10px] text-text-muted mt-0.5">Trigger scraping processes once every 24 hours at 00:00 UTC.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-primary font-semibold">ON (Default)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-zinc-900 bg-zinc-900/10">
              <div>
                <p className="text-xs font-semibold text-white">AI Matching Weight</p>
                <p className="text-[10px] text-text-muted mt-0.5">Control importance multiplier for candidate skills correlation checks.</p>
              </div>
              <select className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded p-1" disabled>
                <option>0.8 (Highly Balanced)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-not-allowed opacity-50" disabled>
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </div>

        {/* Database & Pool Stats */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">DB Health Metrics</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Neon database limits and sync status.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-text-muted">Target Provider</span>
              <span className="text-white font-semibold">Neon (AWS us-east-1)</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-text-muted">Connection Pooler</span>
              <span className="text-emerald-400 font-semibold">Enabled</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-text-muted">SSL Mode</span>
              <span className="text-white font-mono">require</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Active Connections</span>
              <span className="text-white font-semibold">1 (Cached)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-white">CMS Restrictions Active</p>
          <p className="text-[10px] text-text-muted leading-relaxed">
            In compliance with current product phases, CMS create, update, and delete actions are locked down. You can view all records directly synced from our Neon database instance.
          </p>
        </div>
      </div>
    </div>
  );
}
