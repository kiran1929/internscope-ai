'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Database,
  CheckCircle,
  AlertTriangle,
  Play,
  Clock,
  Shuffle,
  Terminal,
  Cpu,
  RefreshCw,
  AlertCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { triggerSyncAction, retrySyncAction, triggerEnrichmentAction, getEnrichmentProgressAction } from '@/app/actions/scraper';
import { JobStatus } from '@/lib/generated/prisma/enums';
import type { IngestionJob } from '@/lib/generated/prisma/client';
import { toast } from 'sonner';

interface ProviderInfo {
  name: string;
  token: string;
  status: 'Online' | 'Offline';
  type: string;
  endpoint: string;
  lastSuccessfulSync: string;
  nextScheduledSync: string;
}

interface ValidationErrorItem {
  title: string;
  errors: string[];
}

interface EnrichmentStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  avgLatencyMs: number;
  avgConfidence: number;
  totalTokens: number;
  totalCost: number;
  activeItemTitle?: string | null;
  activeItemCompany?: string | null;
}

interface ScraperDashboardClientProps {
  providers: ProviderInfo[];
  runningJobs: IngestionJob[];
  history: IngestionJob[];
  enrichmentStats: EnrichmentStats;
  confidenceDistribution: {
    '0.90+': number;
    '0.80-0.89': number;
    '0.70-0.79': number;
    '<0.70': number;
  };
  activeAIProvider: {
    name: string;
    model: string;
  };
  scrapingEnabled: boolean;
  catalogBoardCount: number;
  boardCounts: {
    greenhouse: number;
    lever: number;
    ashby: number;
    smartrecruiters: number;
    workday: number;
  };
}

export default function ScraperDashboardClient({
  providers,
  runningJobs,
  history,
  enrichmentStats: initialEnrichmentStats,
  confidenceDistribution,
  activeAIProvider,
  scrapingEnabled,
  catalogBoardCount,
  boardCounts,
}: ScraperDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedJob, setSelectedJob] = useState<IngestionJob | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enrichStats, setEnrichStats] = useState<EnrichmentStats>(initialEnrichmentStats);
  const [isEnrichingManual, setIsEnrichingManual] = useState(false);

  // Sync initial stats when server props change
  useEffect(() => {
    setEnrichStats(initialEnrichmentStats);
  }, [initialEnrichmentStats]);

  // Is enrichment currently running (either in DB state or initiated by client)
  const isEnrichmentActive = enrichStats.running > 0 || isEnrichingManual;

  // Real-time polling for AI Enrichment progress
  useEffect(() => {
    if (!isEnrichmentActive && enrichStats.pending === 0) return;

    // If active or pending, poll every 2 seconds for live progress
    const interval = setInterval(async () => {
      try {
        const res = await getEnrichmentProgressAction();
        if (res.success && res.stats) {
          setEnrichStats(res.stats);
          if (!res.isRunning && res.stats.pending === 0 && isEnrichingManual) {
            setIsEnrichingManual(false);
            toast.success('AI Enrichment pipeline finished processing all listings.');
            router.refresh();
          }
        }
      } catch {
        // Silent catch for background polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isEnrichmentActive, enrichStats.pending, isEnrichingManual, router]);

  // Automatically poll and refresh dashboard every 4s while any scraper job is active
  useEffect(() => {
    if (runningJobs.length === 0) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 4000);

    return () => clearInterval(interval);
  }, [runningJobs.length, router]);

  const handleEnrich = () => {
    setIsEnrichingManual(true);
    startTransition(async () => {
      const res = await triggerEnrichmentAction();
      if (res.success) {
        toast.success('AI Data Enrichment pipeline started successfully.');
        // Immediate poll
        const progressRes = await getEnrichmentProgressAction();
        if (progressRes.success && progressRes.stats) {
          setEnrichStats(progressRes.stats);
        }
      } else {
        setIsEnrichingManual(false);
        toast.error(`Failed to start enrichment: ${res.error}`);
      }
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    try {
      const progressRes = await getEnrichmentProgressAction();
      if (progressRes.success && progressRes.stats) {
        setEnrichStats(progressRes.stats);
      }
    } catch {
      // Ignore
    }
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Dashboard data refreshed');
    }, 600);
  };

  const handleTrigger = (provider: string) => {
    startTransition(async () => {
      const res = await triggerSyncAction(provider);
      if (res.success) {
        toast.success(`Ingestion started for: ${provider}`);
        router.refresh();
      } else {
        toast.error(`Failed to start ingestion: ${res.error}`);
      }
    });
  };

  const handleRetry = (jobId: string) => {
    startTransition(async () => {
      const res = await retrySyncAction(jobId);
      if (res.success) {
        toast.success(`Job retried. New Job ID: ${res.jobId}`);
        router.refresh();
      } else {
        toast.error(`Failed to retry: ${res.error}`);
      }
    });
  };

  const isScrapingActive = runningJobs.length > 0;

  // Calculate enrichment progress percentage
  const totalEnrich = enrichStats.total || 0;
  const completedEnrich = enrichStats.completed || 0;
  const pendingEnrich = enrichStats.pending || 0;
  const runningEnrich = enrichStats.running || 0;
  const failedEnrich = enrichStats.failed || 0;
  const progressPercent =
    totalEnrich > 0 ? Math.min(100, Math.round((completedEnrich / totalEnrich) * 100)) : 100;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              Ingestion Crawler Pipeline
            </h2>
            {/* Live Scraping Status Indicator */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                isScrapingActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isScrapingActive ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600"></span>
                )}
              </span>
              <span>{isScrapingActive ? 'Scraping Active' : 'Scraping Idle'}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {isScrapingActive
              ? `Currently ingesting and processing ${runningJobs.length} active job stream${runningJobs.length > 1 ? 's' : ''}...`
              : 'Crawler is currently idle. Next sync runs automatically at 9:00 AM & 9:00 PM IST or on-demand below.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isPending}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Manual Sync Control Panel */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Manual Ingestion Console</h3>
          <span className="text-[10px] bg-zinc-800/40 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800/80 font-mono">
            Trigger.dev Agent: Online (Fallback mode: Enabled)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleTrigger('greenhouse')}
            disabled={isPending}
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-primary/40 hover:bg-zinc-900/20 text-left transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200">Greenhouse Sync</p>
              <p className="text-[10px] text-zinc-500">{boardCounts.greenhouse} Indian Greenhouse boards</p>
            </div>
            {isPending ? <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" /> : <Play className="w-3.5 h-3.5 text-zinc-400" />}
          </button>

          <button
            onClick={() => handleTrigger('lever')}
            disabled={isPending}
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-primary/40 hover:bg-zinc-900/20 text-left transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200">Lever Sync</p>
              <p className="text-[10px] text-zinc-500">{boardCounts.lever} Indian Lever boards</p>
            </div>
            {isPending ? <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" /> : <Play className="w-3.5 h-3.5 text-zinc-400" />}
          </button>

          <button
            onClick={() => handleTrigger('ashby')}
            disabled={isPending}
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-primary/40 hover:bg-zinc-900/20 text-left transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200">Ashby Sync</p>
              <p className="text-[10px] text-zinc-500">{boardCounts.ashby} Indian Ashby boards</p>
            </div>
            {isPending ? <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" /> : <Play className="w-3.5 h-3.5 text-zinc-400" />}
          </button>

          <button
            onClick={() => handleTrigger('jobvetta')}
            disabled={isPending}
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-primary/40 hover:bg-zinc-900/20 text-left transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200">JobVetta Sync</p>
              <p className="text-[10px] text-zinc-500">India internship index (API)</p>
            </div>
            {isPending ? <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" /> : <Play className="w-3.5 h-3.5 text-zinc-400" />}
          </button>

          <button
            onClick={() => handleTrigger('all')}
            disabled={isPending}
            className="flex items-center justify-between p-3.5 rounded-lg border border-primary/30 bg-primary/10 hover:border-primary/60 hover:bg-primary/20 text-left transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary">Full Platform Sync</p>
              <p className="text-[10px] text-zinc-400">All {catalogBoardCount} ATS boards + JobVetta</p>
            </div>
            {isPending ? <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" /> : <Shuffle className="w-3.5 h-3.5 text-primary" />}
          </button>
        </div>
      </div>

      {/* Provider Endpoint Health */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-900 bg-zinc-950/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Registered Job Board Connectors</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Real-time status checker for API endpoints.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-400 font-semibold bg-zinc-950/40">
                <th className="p-4">Provider</th>
                <th className="p-4">Target Token</th>
                <th className="p-4">Endpoint Status</th>
                <th className="p-4">Last Sync Completed</th>
                <th className="p-4 text-right">Next Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60">
              {providers.map((prov) => (
                <tr key={prov.name} className="hover:bg-zinc-950/10 transition-colors">
                  <td className="p-4 font-semibold text-zinc-100">
                    <span className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      <span>{prov.name}</span>
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[10px] text-zinc-400">
                    {prov.token}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      prov.status === 'Online'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {prov.status === 'Online' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {prov.status}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-300 font-mono text-[11px]">
                    {prov.lastSuccessfulSync}
                  </td>
                  <td className="p-4 text-right text-zinc-400 font-mono text-[11px]">
                    {prov.nextScheduledSync}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Career Intelligence Enrichment Monitor, Progress Bar & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Stats, Progress Bar and Distribution */}
        <div className="lg:col-span-2 bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Opportunity Enrichment</h3>
                {/* Live Enrichment Status Indicator */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isEnrichmentActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse'
                      : completedEnrich === totalEnrich && totalEnrich > 0
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                  }`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {isEnrichmentActive ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-500"></span>
                    )}
                  </span>
                  <span>
                    {isEnrichmentActive
                      ? 'Enrichment Running'
                      : completedEnrich === totalEnrich && totalEnrich > 0
                      ? '100% Enriched'
                      : 'Enrichment Idle'}
                  </span>
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">Enrich raw listings with skills, tech stacks, salaries, and classifications.</p>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase self-start sm:self-auto">
              Model: {activeAIProvider.name} ({activeAIProvider.model})
            </span>
          </div>

          {/* AI Enrichment Overall Progress Bar Card */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Cpu className={`w-4 h-4 ${isEnrichmentActive ? 'text-emerald-400 animate-spin' : 'text-primary'}`} />
                  <span className="text-xs font-bold text-zinc-200">
                    Enrichment Progress: {progressPercent}%
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    ({completedEnrich} of {totalEnrich} opportunities processed)
                  </span>
                </div>
                {isEnrichmentActive && enrichStats.activeItemTitle && (
                  <p className="text-[11px] text-emerald-400 font-medium animate-pulse flex items-center gap-1.5 pl-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Currently enriching: &ldquo;{enrichStats.activeItemTitle}&rdquo; {enrichStats.activeItemCompany ? `@ ${enrichStats.activeItemCompany}` : ''}</span>
                  </p>
                )}
              </div>

              <span className="text-xs font-mono font-extrabold text-foreground px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
                {completedEnrich} / {totalEnrich}
              </span>
            </div>

            {/* Glowing Interactive Progress Track */}
            <div className="w-full bg-zinc-900/90 rounded-full h-3 overflow-hidden border border-zinc-800/80 p-0.5 relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                  isEnrichmentActive
                    ? 'bg-gradient-to-r from-primary via-emerald-400 to-teal-300 shadow-sm shadow-emerald-500/20'
                    : progressPercent === 100
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : 'bg-gradient-to-r from-primary to-emerald-500'
                }`}
                style={{ width: `${Math.max(progressPercent, totalEnrich === 0 ? 0 : 2)}%` }}
              >
                {/* Animated shimmer overlay during active processing */}
                {isEnrichmentActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite] -skew-x-12" />
                )}
              </div>
            </div>

            {/* Subtext Stats Line */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400 font-mono pt-0.5">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Completed: <strong className="text-zinc-200">{completedEnrich}</strong>
                </span>
                {runningEnrich > 0 && (
                  <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Running: <strong className="text-cyan-300">{runningEnrich}</strong>
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Pending: <strong className="text-zinc-200">{pendingEnrich}</strong>
                </span>
                {failedEnrich > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    Failed: <strong className="text-red-300">{failedEnrich}</strong>
                  </span>
                )}
              </div>

              <span>
                {isEnrichmentActive
                  ? '⚡ Auto-syncing live progress...'
                  : pendingEnrich > 0
                  ? `${pendingEnrich} listings waiting for AI classification`
                  : '✓ All database listings fully enriched'}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Enriched Count</span>
              <p className="text-lg font-extrabold text-emerald-400">{completedEnrich} / {totalEnrich}</p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Pending Enrichment</span>
              <p className="text-lg font-extrabold text-amber-500">{pendingEnrich}</p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Failed Enrichment</span>
              <p className="text-lg font-extrabold text-red-500">{failedEnrich}</p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Avg Enrichment Time</span>
              <p className="text-lg font-extrabold text-zinc-200">
                {enrichStats.avgLatencyMs ? `${(enrichStats.avgLatencyMs / 1000).toFixed(1)}s` : '---'}
              </p>
            </div>
          </div>

          {/* Tokens & Cost */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div className="text-center">
              <span className="text-[8px] uppercase font-bold text-zinc-500 block">Total Tokens Used</span>
              <span className="text-xs font-semibold text-zinc-300 font-mono">{enrichStats.totalTokens.toLocaleString()}</span>
            </div>
            <div className="text-center border-x border-zinc-900">
              <span className="text-[8px] uppercase font-bold text-zinc-500 block">Estimated AI Cost</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">${enrichStats.totalCost.toFixed(4)}</span>
            </div>
            <div className="text-center">
              <span className="text-[8px] uppercase font-bold text-zinc-500 block">Avg Confidence</span>
              <span className="text-xs font-bold text-zinc-300 font-mono">{(enrichStats.avgConfidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Control panel / Confidence Bins */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-5">
          <div className="border-b border-zinc-900 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Confidence Distribution</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Classification score bins.</p>
          </div>

          {/* Progress Bins */}
          <div className="space-y-2 text-[10px]">
            {Object.entries(confidenceDistribution).map(([bin, count]) => {
              const total = Object.values(confidenceDistribution).reduce((acc, c) => acc + c, 0) || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <div key={bin} className="space-y-1">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>{bin}</span>
                    <span>{count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-900">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trigger Enrichment controls */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleEnrich}
              disabled={isPending || isEnrichmentActive || pendingEnrich === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition-all disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed shadow-xs shadow-primary/10"
            >
              {isEnrichmentActive ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span className="text-emerald-400">Processing AI Pipeline ({pendingEnrich} queued)...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>
                    {pendingEnrich === 0
                      ? '✓ All Opportunities Enriched'
                      : `Run AI Enrichment Pipeline (${pendingEnrich} pending)`}
                  </span>
                </>
              )}
            </button>

            {isEnrichmentActive && (
              <p className="text-[10px] text-center text-zinc-400 font-mono">
                Throttling at ~13 req/min to respect Gemini AI rate limits.
              </p>
            )}
          </div>
        </div>
      </div>



      {/* Running/Active Tasks */}
      {runningJobs.length > 0 && (
        <div className="bg-[#111113] border border-amber-500/10 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Active Sync Tasks</h3>
          </div>
          <div className="divide-y divide-zinc-900/60">
            {runningJobs.map((job) => (
              <div key={job.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200 uppercase">{job.provider} Sync</span>
                    <span className="font-mono text-[10px] text-zinc-500">ID: {job.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Started: {new Date(job.startedAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/5 uppercase animate-pulse">
                  Running
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Job History */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-900 bg-zinc-950/20 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Ingestion History Logs</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Historical records of scheduled and manual executions.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 space-y-2">
              <Database className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs">No scraper executions found. Trigger a manual sync to start.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-400 font-semibold bg-zinc-950/40">
                  <th className="p-4">Provider</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Run Duration</th>
                  <th className="p-4 text-center">Fetched</th>
                  <th className="p-4 text-center">Imported</th>
                  <th className="p-4 text-center">Duplicates</th>
                  <th className="p-4 text-center">Errors</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {history.map((job) => (
                  <tr key={job.id} className="hover:bg-zinc-950/10 transition-colors">
                    <td className="p-4 font-semibold text-zinc-100 uppercase">
                      {job.provider}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        job.status === JobStatus.COMPLETED
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : job.status === JobStatus.FAILED
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : job.status === JobStatus.RUNNING
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 font-mono text-[11px]">
                      {job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '---'}
                    </td>
                    <td className="p-4 text-center font-mono text-zinc-300">
                      {job.fetchedCount}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-emerald-400">
                      {job.importedCount}
                    </td>
                    <td className="p-4 text-center font-mono text-zinc-500">
                      {job.duplicateCount}
                    </td>
                    <td className="p-4 text-center font-mono text-red-400">
                      {job.failedCount}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 font-semibold border border-zinc-850"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Logs</span>
                      </button>
                      {job.status === JobStatus.FAILED && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 text-[10px] font-semibold"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Inspector Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span>Job Run Logs: {selectedJob.provider}</span>
                </h4>
                <p className="text-[10px] text-zinc-500 font-mono">Job ID: {selectedJob.id}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 font-mono text-[11px] text-zinc-300">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#111113] p-3 rounded-lg border border-zinc-900">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Status</span>
                  <span className={`font-bold ${
                    selectedJob.status === JobStatus.COMPLETED ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {selectedJob.status}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Duration</span>
                  <span className="text-zinc-200">
                    {selectedJob.durationMs ? `${(selectedJob.durationMs / 1000).toFixed(2)}s` : '---'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Yield</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedJob.importedCount} / {selectedJob.fetchedCount}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Trigger ID</span>
                  <span className="text-zinc-400 truncate block">
                    {selectedJob.triggerId || 'Manual/Fallback'}
                  </span>
                </div>
              </div>

              {/* Console Logs */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-zinc-200 uppercase">Run Execution Trace</p>
                <div className="bg-[#111113] border border-zinc-900 rounded-lg p-4 max-h-[30vh] overflow-y-auto space-y-1 text-zinc-400">
                  {selectedJob.logs && Array.isArray(selectedJob.logs) ? (
                    (selectedJob.logs as string[]).map((log, index) => (
                      <p key={index} className="leading-relaxed border-l-2 border-zinc-800 pl-2 hover:border-primary transition-colors">
                        {log}
                      </p>
                    ))
                  ) : (
                    <p className="text-zinc-600 italic">No execution trace logs recorded.</p>
                  )}
                </div>
              </div>

              {/* Exception Details if failed */}
              {selectedJob.error && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-red-400 uppercase flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Exception Stacktrace</span>
                  </p>
                  <pre className="bg-red-950/10 border border-red-900/20 text-red-400 p-4 rounded-lg overflow-x-auto text-[10px]">
                    {selectedJob.error}
                  </pre>
                </div>
              )}

              {/* Validation Failures detail */}
              {selectedJob.validationErrors && Array.isArray(selectedJob.validationErrors) && (selectedJob.validationErrors as unknown as ValidationErrorItem[]).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pipeline Validation Failures</span>
                  </p>
                  <div className="space-y-2 max-h-[25vh] overflow-y-auto">
                    {(selectedJob.validationErrors as unknown as ValidationErrorItem[]).map((fail, i) => (
                      <div key={i} className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg space-y-1">
                        <p className="font-bold text-zinc-200 text-[10px]">{fail.title}</p>
                        <ul className="list-disc list-inside text-zinc-500 pl-1 text-[9px] space-y-0.5">
                          {(fail.errors as string[]).map((err, j) => (
                            <li key={j}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-900/20 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
