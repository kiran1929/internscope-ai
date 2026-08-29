import { task } from '@trigger.dev/sdk/v3';
import { NewOpportunityDispatcher } from '../lib/email/new-opportunity-dispatcher';

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
