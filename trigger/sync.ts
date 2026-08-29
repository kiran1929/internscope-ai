import { task, schedules } from '@trigger.dev/sdk/v3';
import { IngestionQueue } from '../lib/ingestion/queue';

export const greenhouseSync = task({
  id: 'greenhouse-sync',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload?: { triggerId?: string }) => {
    return IngestionQueue.runJob('greenhouse', payload?.triggerId);
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
    return IngestionQueue.runJob('lever', payload?.triggerId);
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
    return IngestionQueue.runJob('ashby', payload?.triggerId);
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
    return IngestionQueue.runJob('all', payload?.triggerId);
  },
});

// Full catalog sync twice daily at 9:00 AM & 9:00 PM IST (03:30 & 15:30 UTC).
// Post-ingestion enrichment drains the full pending queue with throttled Gemini calls.
schedules.create({
  task: 'full-sync',
  cron: '30 3,15 * * *',
  deduplicationKey: 'full-sync-schedule',
});
