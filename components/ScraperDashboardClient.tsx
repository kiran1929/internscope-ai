'use client';

import React, { useState, useTransition } from 'react';
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
import { triggerSyncAction, retrySyncAction, triggerEnrichmentAction } from '@/app/actions/scraper';
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
}

export default function ScraperDashboardClient({
  providers,
  runningJobs,
  history,
  enrichmentStats,
  confidenceDistribution,
  activeAIProvider,
}: ScraperDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedJob, setSelectedJob] = useState<IngestionJob | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleEnrich = () => {
    startTransition(async () => {
      const res = await triggerEnrichmentAction();
      if (res.success) {
        toast.success('AI Data Enrichment pipeline started successfully.');
        router.refresh();
      } else {
        toast.error(`Failed to start enrichment: ${res.error}`);
      }
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Dashboard data refreshed');
    }, 800);
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

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Ingestion Crawler Pipeline
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage background tasks, schedules, and monitor job ingestion history in real-time.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isPending}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
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
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-primary/40 hover:bg-zinc-900/20 text-left transition-all"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200">Greenhouse Sync</p>
              <p className="text-[10px] text-zinc-500">Seed targets: Stripe</p>
            </div>
            <Play className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            onClick={() => handleTrigger('lever')}
            disabled={isPending}
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-primary/40 hover:bg-zinc-900/20 text-left transition-all"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200">Lever Sync</p>
              <p className="text-[10px] text-zinc-500">Seed targets: Spotify</p>
            </div>
            <Play className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            onClick={() => handleTrigger('ashby')}
            disabled={isPending}
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-primary/40 hover:bg-zinc-900/20 text-left transition-all"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200">Ashby Sync</p>
              <p className="text-[10px] text-zinc-500">Seed targets: Linear</p>
            </div>
            <Play className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            onClick={() => handleTrigger('all')}
            disabled={isPending}
            className="flex items-center justify-between p-3.5 rounded-lg border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 text-left transition-all"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary">Full Platform Sync</p>
              <p className="text-[10px] text-zinc-400">Sync all 3 sequentially</p>
            </div>
            <Shuffle className="w-3.5 h-3.5 text-primary" />
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

      {/* AI Career Intelligence Enrichment Monitor & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Stats and Distribution */}
        <div className="lg:col-span-2 bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Opportunity Enrichment</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Enrich raw listings with skills, tech stacks, salaries, and classifications.</p>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase">
              Model: {activeAIProvider.name} ({activeAIProvider.model})
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Enriched Count</span>
              <p className="text-lg font-extrabold text-emerald-400">{enrichmentStats.completed} / {enrichmentStats.total}</p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Pending Enrichment</span>
              <p className="text-lg font-extrabold text-amber-500">{enrichmentStats.pending}</p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Failed Enrichment</span>
              <p className="text-lg font-extrabold text-red-500">{enrichmentStats.failed}</p>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900 space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Avg Enrichment Time</span>
              <p className="text-lg font-extrabold text-zinc-200">
                {enrichmentStats.avgLatencyMs ? `${(enrichmentStats.avgLatencyMs / 1000).toFixed(1)}s` : '---'}
              </p>
            </div>
          </div>

          {/* Tokens & Cost */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div className="text-center">
              <span className="text-[8px] uppercase font-bold text-zinc-500 block">Total Tokens Used</span>
              <span className="text-xs font-semibold text-zinc-300 font-mono">{enrichmentStats.totalTokens.toLocaleString()}</span>
            </div>
            <div className="text-center border-x border-zinc-900">
              <span className="text-[8px] uppercase font-bold text-zinc-500 block">Estimated AI Cost</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">${enrichmentStats.totalCost.toFixed(4)}</span>
            </div>
            <div className="text-center">
              <span className="text-[8px] uppercase font-bold text-zinc-500 block">Avg Confidence</span>
              <span className="text-xs font-bold text-zinc-300 font-mono">{(enrichmentStats.avgConfidence * 100).toFixed(1)}%</span>
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
          <div className="pt-2">
            <button
              onClick={handleEnrich}
              disabled={isPending || enrichmentStats.pending === 0}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary transition-all disabled:opacity-50 hover:cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Run AI Enrichment Pipeline ({enrichmentStats.pending} pending)</span>
            </button>
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
