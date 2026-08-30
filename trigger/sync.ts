import { task, schedules } from '@trigger.dev/sdk/v3';
import { IngestionQueue } from '../lib/ingestion/queue';
import { isScrapingEnabled } from '../lib/ingestion/scraper-config';
import { SCRAPE_CRON_IST, SCRAPE_TIMEZONE } from '../lib/ingestion/scraper-schedule';

async function runIfEnabled(provider: string, triggerId?: string) {
  if (!isScrapingEnabled()) {
    console.log(`[${provider}] Skipped — SCRAPING_ENABLED is not true`);
    return { skipped: true, reason: 'SCRAPING_ENABLED is not true' };
  }
  return IngestionQueue.runJob(provider, triggerId);
}

export const greenhouseSync = task({
  id: 'greenhouse-sync',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload?: { triggerId?: string }) => {
    return runIfEnabled('greenhouse', payload?.triggerId);
  },
});

export const leverSync = task({
  id: 'lever-sync',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload?: { triggerId?: string }) => {
    return runIfEnabled('lever', payload?.triggerId);
  },
});

export const ashbySync = task({
  id: 'ashby-sync',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload?: { triggerId?: string }) => {
    return runIfEnabled('ashby', payload?.triggerId);
  },
});

export const fullSync = task({
  id: 'full-sync',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload?: { triggerId?: string }) => {
    return runIfEnabled('all', payload?.triggerId);
  },
});

// Full catalog sync twice daily at 9:00 AM & 9:00 PM IST.
// Register schedule always; task no-ops while SCRAPING_ENABLED=false.
schedules.create({
  task: 'full-sync',
  cron: SCRAPE_CRON_IST,
  timezone: SCRAPE_TIMEZONE,
  deduplicationKey: 'full-sync-schedule-ist-9am-9pm',
});
