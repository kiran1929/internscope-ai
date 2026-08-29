import { prisma } from '@/lib/db';
import { isRealClerkUser } from '@/lib/auth/clerk-user';
import { scoreUserAgainstOpportunity } from '@/lib/search/opportunity-matcher';
import { OpportunityNotificationService } from './opportunity-notification-service';

export interface NewOpportunityDispatchResult {
  opportunityId: string;
  eligibleUsers: number;
  sent: number;
  skipped: number;
  failed: number;
}

export class NewOpportunityDispatcher {
  /**
   * Notifies all logged-in Clerk users when a new opportunity is published.
   * Respects email preferences, match threshold, and duplicate protection.
   */
  static async dispatch(opportunityId: string): Promise<NewOpportunityDispatchResult> {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        company: true,
        enrichment: true,
      },
    });

    if (!opportunity || opportunity.isArchived || !opportunity.isActive) {
      console.info(`[NewOpportunityDispatcher] Skipped inactive/archived opportunity: ${opportunityId}`);
      return { opportunityId, eligibleUsers: 0, sent: 0, skipped: 0, failed: 0 };
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        NOT: { clerkId: { startsWith: 'user_clerk_' } },
      },
      include: {
        profile: true,
        emailPreference: true,
        targetCompanies: {
          where: { companyId: opportunity.companyId },
          select: { companyId: true },
        },
      },
    });

    const clerkUsers = users.filter((user) => isRealClerkUser(user.clerkId));

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    console.info(
      `[NewOpportunityDispatcher] Evaluating "${opportunity.title}" at ${opportunity.company.name} for ${clerkUsers.length} Clerk user(s)`,
    );

    for (const user of clerkUsers) {
      const wantsAlerts =
        !user.emailPreference ||
        (user.emailPreference.instantAlerts && user.emailPreference.newOpportunities);

      if (!wantsAlerts) {
        skipped++;
        continue;
      }

      const tracksCompany = user.targetCompanies.length > 0;
      const { score, matchedSkills, matchReasons } = scoreUserAgainstOpportunity(
        {
          profile: user.profile,
          tracksCompany,
        },
        opportunity,
      );

      const result = await OpportunityNotificationService.notifyCandidateIfEligible({
        userId: user.id,
        opportunityId: opportunity.id,
        userName: user.profile?.firstName || user.email.split('@')[0],
        opportunity: {
          id: opportunity.id,
          title: opportunity.title,
          location: opportunity.location,
          remoteType: opportunity.remoteType?.toString(),
          type: opportunity.type?.toString(),
          applicationUrl: opportunity.applicationUrl,
          deadline: opportunity.deadline,
          company: { name: opportunity.company.name },
          enrichment: opportunity.enrichment,
        },
        matchScore: score,
        matchedSkills,
        matchReasons,
      });

      if (result.sent) sent++;
      else if (result.skipped) skipped++;
      else failed++;
    }

    console.info(
      `[NewOpportunityDispatcher] Finished "${opportunity.title}": sent=${sent}, skipped=${skipped}, failed=${failed}`,
    );

    return {
      opportunityId,
      eligibleUsers: clerkUsers.length,
      sent,
      skipped,
      failed,
    };
  }
}

export async function scheduleNewOpportunityNotifications(opportunityId: string): Promise<void> {
  try {
    const { newOpportunityNotificationTask } = await import('@/trigger/notifications');
    await newOpportunityNotificationTask.trigger({ opportunityId });
  } catch (triggerError) {
    console.warn(
      '[NewOpportunityDispatcher] Trigger.dev unavailable, running inline:',
      triggerError instanceof Error ? triggerError.message : triggerError,
    );
    const { runNewOpportunityNotifications } = await import('@/trigger/notifications');
    await runNewOpportunityNotifications({ opportunityId });
  }
}
