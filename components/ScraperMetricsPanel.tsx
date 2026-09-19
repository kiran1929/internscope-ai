'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Clock, Database, Gauge, Timer } from 'lucide-react';
import type { ScraperMetricsDashboard } from '@/lib/ingestion/scraper-metrics-types';
import { formatDurationMs } from '@/lib/ingestion/scraper-metrics';
import { getScraperMetricsAction } from '@/app/actions/scraper';

interface ScraperMetricsPanelProps {
  initialMetrics: ScraperMetricsDashboard;
  isSyncRunning?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  jobvetta: 'JobVetta',
  smartrecruiters: 'SmartRecruiters',
  workday: 'Workday',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
};

function formatProvider(provider: string) {
  return PROVIDER_LABELS[provider] ?? provider;
}

export default function ScraperMetricsPanel({
  initialMetrics,
  isSyncRunning = false,
}: ScraperMetricsPanelProps) {
  const [metrics, setMetrics] = useState(initialMetrics);

  useEffect(() => {
    setMetrics(initialMetrics);
  }, [initialMetrics]);

  useEffect(() => {
    const intervalMs = isSyncRunning ? 5000 : 30000;
    const interval = setInterval(async () => {
      const res = await getScraperMetricsAction();
      if (res.success && res.metrics) {
        setMetrics(res.metrics);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isSyncRunning]);
  const nextRun = new Date(metrics.schedule.nextRunAt).toLocaleString('en-IN', {
    timeZone: metrics.schedule.timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Ingestion Performance Metrics
          </h3>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          Updated {new Date(metrics.generatedAt).toLocaleTimeString('en-IN')}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          icon={<Timer className="w-3.5 h-3.5" />}
          label="Last full sync"
          value={formatDurationMs(metrics.overview.lastFullSyncDurationMs)}
          hint={
            metrics.overview.lastFullSyncFinishedAt
              ? new Date(metrics.overview.lastFullSyncFinishedAt).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'No completed run yet'
          }
        />
        <MetricCard
          icon={<Gauge className="w-3.5 h-3.5" />}
          label="Avg full sync"
          value={formatDurationMs(metrics.overview.avgFullSyncDurationMs)}
          hint="Across recent full-sync runs"
        />
        <MetricCard
          icon={<Database className="w-3.5 h-3.5" />}
          label="Jobs scanned (30 runs)"
          value={String(metrics.overview.totalFetchedLast30Runs)}
          hint={`${metrics.overview.totalPersistedLast30Runs} new persisted`}
        />
        <MetricCard
          icon={<Clock className="w-3.5 h-3.5" />}
          label="AI enrichment latency"
          value={formatDurationMs(metrics.overview.enrichmentAvgLatencyMs)}
          hint="Avg per opportunity"
        />
        <MetricCard
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Next scheduled sync"
          value="9 AM / 9 PM IST"
          hint={nextRun}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="p-3 font-semibold">Provider</th>
              <th className="p-3 font-semibold">Boards</th>
              <th className="p-3 font-semibold">Board p50</th>
              <th className="p-3 font-semibold">Board p95</th>
              <th className="p-3 font-semibold">ms/job p50</th>
              <th className="p-3 font-semibold">ms/job p95</th>
              <th className="p-3 font-semibold">Avg fetched</th>
              <th className="p-3 font-semibold">Avg saved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {metrics.byProvider.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-zinc-500 text-center">
                  No per-board metrics yet. Run a full sync to populate p50/p95 timings.
                </td>
              </tr>
            ) : (
              metrics.byProvider.map((row) => (
                <tr key={row.provider} className="hover:bg-zinc-900/40">
                  <td className="p-3 font-semibold text-zinc-100">{formatProvider(row.provider)}</td>
                  <td className="p-3 text-zinc-300">{row.boardCount}</td>
                  <td className="p-3 font-mono text-zinc-300">{formatDurationMs(row.boardDurationP50Ms)}</td>
                  <td className="p-3 font-mono text-zinc-300">{formatDurationMs(row.boardDurationP95Ms)}</td>
                  <td className="p-3 font-mono text-emerald-400">{row.msPerJobP50 || '—'} ms</td>
                  <td className="p-3 font-mono text-amber-400">{row.msPerJobP95 || '—'} ms</td>
                  <td className="p-3 text-zinc-300">{row.avgFetchedPerRun}</td>
                  <td className="p-3 text-zinc-300">{row.avgPersistedPerRun}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="p-3 font-semibold">Recent run</th>
              <th className="p-3 font-semibold">Provider</th>
              <th className="p-3 font-semibold">Duration</th>
              <th className="p-3 font-semibold">Fetched</th>
              <th className="p-3 font-semibold">Saved</th>
              <th className="p-3 font-semibold">ms/job</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {metrics.recentRuns.map((run) => (
              <tr key={run.id} className="hover:bg-zinc-900/40">
                <td className="p-3 text-zinc-400 font-mono">
                  {new Date(run.startedAt).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-3 font-semibold text-zinc-100">{formatProvider(run.provider)}</td>
                <td className="p-3 font-mono text-zinc-300">{formatDurationMs(run.durationMs)}</td>
                <td className="p-3 text-zinc-300">{run.fetched}</td>
                <td className="p-3 text-zinc-300">{run.persisted}</td>
                <td className="p-3 font-mono text-zinc-300">
                  {run.msPerJob != null ? `${run.msPerJob} ms` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-zinc-500 leading-relaxed">
        Per-board p50/p95 are computed from structured metrics saved on each sync run. ms/job =
        board scrape duration ÷ jobs fetched (network + pipeline). After a 9 AM IST cron, listings
        appear in the app as each provider finishes (SR/Workday first, Ashby last).
      </p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-zinc-500">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] text-zinc-500">{hint}</p>
    </div>
  );
}
