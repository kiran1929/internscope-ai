import { task, schedules } from '@trigger.dev/sdk/v3';
import { NewOpportunityDispatcher } from '../lib/email/new-opportunity-dispatcher';
import { DailyDigestDispatcher } from '../lib/email/daily-digest-dispatcher';
import { SCRAPE_CRON_IST, SCRAPE_TIMEZONE } from '../lib/ingestion/scraper-schedule';

export interface NewOpportunityNotificationPayload {
  opportunityId: string;
}

export async function runNewOpportunityNotifications(payload: NewOpportunityNotificationPayload) {
  return NewOpportunityDispatcher.dispatch(payload.opportunityId);
}

export const newOpportunityNotificationTask = task({
  id: 'new-opportunity-notification',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: NewOpportunityNotificationPayload) => {
    return runNewOpportunityNotifications(payload);
  },
});

export const dailyDigestMailingTask = task({
  id: 'daily-digest-mailing',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async () => {
    return DailyDigestDispatcher.dispatchDigest();
  },
});

// Scheduled Mailing at 9:00 AM & 9:00 PM IST (aligns directly with scraper sync window)
schedules.create({
  task: 'daily-digest-mailing',
  cron: SCRAPE_CRON_IST, // '0 9,21 * * *'
  timezone: SCRAPE_TIMEZONE, // 'Asia/Kolkata'
  deduplicationKey: 'daily-digest-mailing-schedule-ist-9am-9pm',
});
