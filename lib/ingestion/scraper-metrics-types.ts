import type { ScrapeProvider } from './company-catalog';

/** Providers that appear in scraper performance dashboards. */
export type MetricsProvider = ScrapeProvider | 'jobvetta';

export interface BoardScrapeMetric {
  board: string;
  provider: MetricsProvider;
  boardToken: string;
  durationMs: number;
  fetched: number;
  persisted: number;
  duplicates: number;
  failed: number;
  msPerJob: number;
  success: boolean;
  error?: string;
}

export interface ProviderMetricsRollup {
  provider: MetricsProvider;
  boardCount: number;
  durationMs: number;
  fetched: number;
  persisted: number;
  duplicates: number;
  failed: number;
  /** p50/p95 of per-board scrape duration */
  boardDurationP50Ms: number;
  boardDurationP95Ms: number;
  /** p50/p95 of ms per fetched job (network + pipeline amortized) */
  msPerJobP50: number;
  msPerJobP95: number;
}

export interface IngestionRunMetrics {
  version: 1;
  boardsSucceeded: number;
  boardsFailed: number;
  catalogSyncMs?: number;
  purgeExpiredCount?: number;
  boardMetrics: BoardScrapeMetric[];
  providerRollups: ProviderMetricsRollup[];
}

export interface ProviderDashboardStats extends ProviderMetricsRollup {
  runCount: number;
  syncDurationP50Ms: number;
  syncDurationP95Ms: number;
  avgFetchedPerRun: number;
  avgPersistedPerRun: number;
}

export interface ScraperMetricsDashboard {
  generatedAt: string;
  schedule: {
    cron: string;
    timezone: string;
    nextRunAt: string;
  };
  overview: {
    completedRuns: number;
    lastFullSyncDurationMs: number | null;
    lastFullSyncFinishedAt: string | null;
    totalFetchedLast30Runs: number;
    totalPersistedLast30Runs: number;
    avgFullSyncDurationMs: number;
    enrichmentAvgLatencyMs: number;
  };
  byProvider: ProviderDashboardStats[];
  recentRuns: Array<{
    id: string;
    provider: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    durationMs: number | null;
    fetched: number;
    persisted: number;
    msPerJob: number | null;
  }>;
}
