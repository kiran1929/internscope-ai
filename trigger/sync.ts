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

// Define configurable Trigger.dev schedules with required deduplication keys
schedules.create({
  task: 'greenhouse-sync',
  cron: '0 */6 * * *', // Every 6 hours
  deduplicationKey: 'greenhouse-sync-schedule',
});

schedules.create({
  task: 'lever-sync',
  cron: '0 */6 * * *', // Every 6 hours
  deduplicationKey: 'lever-sync-schedule',
});

schedules.create({
  task: 'ashby-sync',
  cron: '0 */6 * * *', // Every 6 hours
  deduplicationKey: 'ashby-sync-schedule',
});

schedules.create({
  task: 'full-sync',
  cron: '0 0 * * *', // Daily at midnight
  deduplicationKey: 'full-sync-schedule',
});
