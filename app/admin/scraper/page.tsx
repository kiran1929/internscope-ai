import React from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import { JobRepository } from '@/lib/repositories/job';
import { EnrichmentRepository } from '@/lib/repositories/enrichment';
import { AIProviderFactory } from '@/lib/ai/providers';
import ScraperDashboardClient from '@/components/ScraperDashboardClient';
import ScraperMetricsPanel from '@/components/ScraperMetricsPanel';
import { isScrapingEnabled } from '@/lib/ingestion/scraper-config';
import { getCatalogCompanyCount, getCatalogBoardsByProvider } from '@/lib/ingestion/company-catalog';
import {
  formatNextScrapeTimeIST,
  getNextScheduledScrapeTime,
} from '@/lib/ingestion/scraper-schedule';
import { buildScraperMetricsDashboard } from '@/lib/ingestion/scraper-metrics';

export const dynamic = 'force-dynamic';

async function getAdminUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const dbUser = await UserRepository.findByClerkId(clerkUser.id);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    redirect('/403');
  }
  return dbUser;
}

// Live connection checker helper
async function checkProviderStatus(url: string): Promise<'Online' | 'Offline'> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'InternScope-Health-Check/1.0',
      },
    });

    clearTimeout(id);
    return res.status >= 200 && res.status < 500 ? 'Online' : 'Offline';
  } catch {
    return 'Offline';
  }
}

export default async function ScraperDashboardPage() {
  await getAdminUser();

  // Perform parallel live connection health checks, database history lookups, and enrichment analytics
  const [
    greenhouseStatus,
    leverStatus,
    ashbyStatus,
    runningJobs,
    history,
    metricsHistory,
    lastGreenhouseSuccess,
    lastLeverSuccess,
    lastAshbySuccess,
    lastJobvettaSuccess,
    enrichmentStats,
    confidenceDistribution,
  ] = await Promise.all([
    checkProviderStatus('https://boards-api.greenhouse.io/v1/boards/razorpay/jobs'),
    checkProviderStatus('https://api.lever.co/v0/postings/cred?mode=json'),
    checkProviderStatus('https://api.ashbyhq.com/posting-api/job-board/devfolio'),
    JobRepository.findRunning(),
    JobRepository.getHistory(30),
    JobRepository.getMetricsHistory(50),
    JobRepository.getLastSuccessfulSync('greenhouse'),
    JobRepository.getLastSuccessfulSync('lever'),
    JobRepository.getLastSuccessfulSync('ashby'),
    JobRepository.getLastSuccessfulSync('jobvetta'),
    EnrichmentRepository.getEnrichmentStats(),
    EnrichmentRepository.getConfidenceDistribution(),
  ]);

  const activeProvider = AIProviderFactory.getProvider();
  const activeAIProvider = {
    name: activeProvider.name,
    model: activeProvider.modelName,
  };

  const formatLastSyncString = (finishedAt: Date | null) => {
    if (!finishedAt) return 'Never synced';
    return new Date(finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const nextSync = getNextScheduledScrapeTime();
  const nextSyncLabel = formatNextScrapeTimeIST(nextSync);

  const catalogBoardCount = getCatalogCompanyCount();
  const scraperMetrics = buildScraperMetricsDashboard(metricsHistory, enrichmentStats.avgLatencyMs);

  const boardCounts = {
    greenhouse: getCatalogBoardsByProvider('greenhouse').length,
    lever: getCatalogBoardsByProvider('lever').length,
    ashby: getCatalogBoardsByProvider('ashby').length,
    smartrecruiters: getCatalogBoardsByProvider('smartrecruiters').length,
    workday: getCatalogBoardsByProvider('workday').length,
  };

  const jobvettaConfigured = Boolean(process.env.JOBVETTA_API_KEY?.trim());

  const providers = [
    {
      name: 'Greenhouse Job Boards',
      token: 'razorpay',
      status: greenhouseStatus,
      type: 'greenhouse',
      endpoint: 'https://boards-api.greenhouse.io/v1/boards/razorpay/jobs',
      lastSuccessfulSync: formatLastSyncString(lastGreenhouseSuccess?.finishedAt || null),
      nextScheduledSync: nextSyncLabel,
    },
    {
      name: 'Lever Job Boards',
      token: 'cred',
      status: leverStatus,
      type: 'lever',
      endpoint: 'https://api.lever.co/v0/postings/cred?mode=json',
      lastSuccessfulSync: formatLastSyncString(lastLeverSuccess?.finishedAt || null),
      nextScheduledSync: nextSyncLabel,
    },
    {
      name: 'Ashby Careers Pages',
      token: 'devfolio',
      status: ashbyStatus,
      type: 'ashby',
      endpoint: 'https://api.ashbyhq.com/posting-api/job-board/devfolio',
      lastSuccessfulSync: formatLastSyncString(lastAshbySuccess?.finishedAt || null),
      nextScheduledSync: nextSyncLabel,
    },
    {
      name: 'JobVetta India Index',
      token: jobvettaConfigured ? 'api-key-set' : 'missing-key',
      status: jobvettaConfigured ? ('Online' as const) : ('Offline' as const),
      type: 'jobvetta',
      endpoint: 'https://api.jobvetta.com/v1/jobs',
      lastSuccessfulSync: formatLastSyncString(lastJobvettaSuccess?.finishedAt || null),
      nextScheduledSync: nextSyncLabel,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-white">
      <ScraperMetricsPanel
        initialMetrics={scraperMetrics}
        isSyncRunning={runningJobs.length > 0}
      />
      <ScraperDashboardClient
        providers={providers}
        runningJobs={runningJobs}
        history={history}
        enrichmentStats={enrichmentStats}
        confidenceDistribution={confidenceDistribution}
        activeAIProvider={activeAIProvider}
        scrapingEnabled={isScrapingEnabled()}
        catalogBoardCount={catalogBoardCount}
        boardCounts={boardCounts}
      />
    </div>
  );
}
