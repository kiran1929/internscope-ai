import type { IngestionJob } from '../generated/prisma/client';
import { JobStatus } from '../generated/prisma/enums';
import {
  SCRAPE_CRON_IST,
  SCRAPE_TIMEZONE,
  getNextScheduledScrapeTime,
} from './scraper-schedule';
import type {
  BoardScrapeMetric,
  IngestionRunMetrics,
  ProviderDashboardStats,
  ProviderMetricsRollup,
  ScraperMetricsDashboard,
  MetricsProvider,
} from './scraper-metrics-types';

const PROVIDERS: MetricsProvider[] = [
  'jobvetta',
  'smartrecruiters',
  'workday',
  'greenhouse',
  'lever',
  'ashby',
];

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

export function buildProviderRollups(
  boardMetrics: BoardScrapeMetric[]
): ProviderMetricsRollup[] {
  const byProvider = new Map<MetricsProvider, BoardScrapeMetric[]>();

  for (const metric of boardMetrics) {
    const list = byProvider.get(metric.provider) ?? [];
    list.push(metric);
    byProvider.set(metric.provider, list);
  }

  return PROVIDERS.filter((p) => byProvider.has(p)).map((provider) => {
    const boards = byProvider.get(provider) ?? [];
    const durations = boards.map((b) => b.durationMs).sort((a, b) => a - b);
    const msPerJob = boards.map((b) => b.msPerJob).filter((v) => v > 0).sort((a, b) => a - b);

    return {
      provider,
      boardCount: boards.length,
      durationMs: boards.reduce((sum, b) => sum + b.durationMs, 0),
      fetched: boards.reduce((sum, b) => sum + b.fetched, 0),
      persisted: boards.reduce((sum, b) => sum + b.persisted, 0),
      duplicates: boards.reduce((sum, b) => sum + b.duplicates, 0),
      failed: boards.reduce((sum, b) => sum + b.failed, 0),
      boardDurationP50Ms: percentile(durations, 50),
      boardDurationP95Ms: percentile(durations, 95),
      msPerJobP50: percentile(msPerJob, 50),
      msPerJobP95: percentile(msPerJob, 95),
    };
  });
}

export function parseIngestionRunMetrics(job: IngestionJob): IngestionRunMetrics | null {
  if (!job.metrics || typeof job.metrics !== 'object') return null;
  const metrics = job.metrics as unknown as IngestionRunMetrics;
  if (metrics.version !== 1 || !Array.isArray(metrics.boardMetrics)) return null;
  return metrics;
}

function msPerJobFromJob(job: IngestionJob): number | null {
  if (!job.durationMs || job.fetchedCount <= 0) return null;
  return Math.round(job.durationMs / job.fetchedCount);
}

export function buildScraperMetricsDashboard(
  jobs: IngestionJob[],
  enrichmentAvgLatencyMs = 0
): ScraperMetricsDashboard {
  const completed = jobs.filter((j) => j.status === JobStatus.COMPLETED && j.durationMs);
  const fullSyncRuns = completed.filter((j) => j.provider === 'all');
  const lastFull = fullSyncRuns[0] ?? null;

  const fullDurations = fullSyncRuns
    .map((j) => j.durationMs)
    .filter((v): v is number => typeof v === 'number')
    .sort((a, b) => a - b);

  const recentCompleted = completed.slice(0, 30);
  const providerJobs = new Map<string, IngestionJob[]>();

  for (const job of recentCompleted) {
    const key = job.provider;
    const list = providerJobs.get(key) ?? [];
    list.push(job);
    providerJobs.set(key, list);
  }

  const boardMetricsFromRuns: BoardScrapeMetric[] = [];
  for (const job of recentCompleted) {
    const parsed = parseIngestionRunMetrics(job);
    if (parsed) boardMetricsFromRuns.push(...parsed.boardMetrics);
  }

  const rollupByProvider = new Map<MetricsProvider, ProviderMetricsRollup>();
  for (const rollup of buildProviderRollups(boardMetricsFromRuns)) {
    rollupByProvider.set(rollup.provider, rollup);
  }

  const byProvider: ProviderDashboardStats[] = PROVIDERS.map((provider) => {
    const rollup = rollupByProvider.get(provider);
    const runs = recentCompleted.filter(
      (j) => j.provider === provider || (j.provider === 'all' && rollup)
    );
    const providerOnlyRuns = recentCompleted.filter((j) => j.provider === provider);
    const durations = providerOnlyRuns
      .map((j) => j.durationMs)
      .filter((v): v is number => typeof v === 'number')
      .sort((a, b) => a - b);

    const fetchedRuns = providerOnlyRuns.length
      ? providerOnlyRuns
      : rollup
        ? fullSyncRuns.slice(0, 5)
        : [];

    return {
      provider,
      runCount: providerOnlyRuns.length || (rollup ? fullSyncRuns.length : 0),
      boardCount: rollup?.boardCount ?? 0,
      durationMs: rollup?.durationMs ?? 0,
      fetched: rollup?.fetched ?? providerOnlyRuns.reduce((s, j) => s + j.fetchedCount, 0),
      persisted: rollup?.persisted ?? providerOnlyRuns.reduce((s, j) => s + j.importedCount, 0),
      duplicates: rollup?.duplicates ?? 0,
      failed: rollup?.failed ?? 0,
      boardDurationP50Ms: rollup?.boardDurationP50Ms ?? percentile(durations, 50),
      boardDurationP95Ms: rollup?.boardDurationP95Ms ?? percentile(durations, 95),
      msPerJobP50: rollup?.msPerJobP50 ?? 0,
      msPerJobP95: rollup?.msPerJobP95 ?? 0,
      syncDurationP50Ms: percentile(durations, 50),
      syncDurationP95Ms: percentile(durations, 95),
      avgFetchedPerRun:
        fetchedRuns.length > 0
          ? Math.round(
              fetchedRuns.reduce((s, j) => s + j.fetchedCount, 0) / fetchedRuns.length
            )
          : 0,
      avgPersistedPerRun:
        fetchedRuns.length > 0
          ? Math.round(
              fetchedRuns.reduce((s, j) => s + j.importedCount, 0) / fetchedRuns.length
            )
          : 0,
    };
  }).filter((p) => p.runCount > 0 || p.boardCount > 0);

  const nextRun = getNextScheduledScrapeTime();

  return {
    generatedAt: new Date().toISOString(),
    schedule: {
      cron: SCRAPE_CRON_IST,
      timezone: SCRAPE_TIMEZONE,
      nextRunAt: nextRun.toISOString(),
    },
    overview: {
      completedRuns: completed.length,
      lastFullSyncDurationMs: lastFull?.durationMs ?? null,
      lastFullSyncFinishedAt: lastFull?.finishedAt?.toISOString() ?? null,
      totalFetchedLast30Runs: recentCompleted.reduce((s, j) => s + j.fetchedCount, 0),
      totalPersistedLast30Runs: recentCompleted.reduce((s, j) => s + j.importedCount, 0),
      avgFullSyncDurationMs:
        fullDurations.length > 0
          ? Math.round(fullDurations.reduce((a, b) => a + b, 0) / fullDurations.length)
          : 0,
      enrichmentAvgLatencyMs,
    },
    byProvider,
    recentRuns: completed.slice(0, 12).map((job) => ({
      id: job.id,
      provider: job.provider,
      status: job.status,
      startedAt: job.startedAt.toISOString(),
      finishedAt: job.finishedAt?.toISOString() ?? null,
      durationMs: job.durationMs,
      fetched: job.fetchedCount,
      persisted: job.importedCount,
      msPerJob: msPerJobFromJob(job),
    })),
  };
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '—';
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}
