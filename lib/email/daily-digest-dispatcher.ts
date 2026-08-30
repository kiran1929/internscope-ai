import { prisma } from '@/lib/db';
import { isRealClerkUser } from '@/lib/auth/clerk-user';
import { scoreUserAgainstOpportunity } from '@/lib/search/opportunity-matcher';
import { OpportunityNotificationService } from './opportunity-notification-service';

export interface DailyDigestDispatchResult {
  eligibleUsers: number;
  emailsSent: number;
  emailsSkipped: number;
  emailsFailed: number;
}

export class DailyDigestDispatcher {
  /**
   * Dispatches the 9:00 AM & 9:00 PM IST Digest to all registered Clerk users.
   * Finds top relevant active opportunities and sends personalized high-match alerts.
   */
  static async dispatchDigest(): Promise<DailyDigestDispatchResult> {
    console.info('[DailyDigestDispatcher] Starting 9 AM / 9 PM IST Digest batch dispatch...');

    // 1. Fetch active, non-archived opportunities
    const now = new Date();
    const opportunities = await prisma.opportunity.findMany({
      where: {
        isActive: true,
        isArchived: false,
        OR: [
          { deadline: null },
          { deadline: { gte: now } },
        ],
      },
      include: {
        company: true,
        enrichment: true,
      },
      orderBy: [
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 60,
    });

    if (opportunities.length === 0) {
      console.info('[DailyDigestDispatcher] No active opportunities to notify.');
      return { eligibleUsers: 0, emailsSent: 0, emailsSkipped: 0, emailsFailed: 0 };
    }

    // 2. Fetch all active Clerk candidates
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        NOT: { clerkId: { startsWith: 'user_clerk_' } },
      },
      include: {
        profile: true,
        emailPreference: true,
        targetCompanies: {
          select: { companyId: true },
        },
      },
    });

    const clerkUsers = users.filter((u) => isRealClerkUser(u.clerkId));
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    console.info(
      `[DailyDigestDispatcher] Evaluating ${opportunities.length} opportunities for ${clerkUsers.length} candidate(s)...`
    );

    for (const user of clerkUsers) {
      const wantsDigest = !user.emailPreference || user.emailPreference.weeklyDigest || user.emailPreference.newOpportunities;
      if (!wantsDigest) {
        skipped++;
        continue;
      }

      const trackedCompanyIds = new Set(user.targetCompanies.map((t) => t.companyId));

      // Rank opportunities for this user
      const scoredOpps = opportunities.map((opp) => {
        const tracksCompany = trackedCompanyIds.has(opp.companyId);
        const match = scoreUserAgainstOpportunity(
          {
            profile: user.profile,
            tracksCompany,
          },
          opp
        );
        return {
          opp,
          matchScore: match.score,
          matchedSkills: match.matchedSkills,
          matchReasons: match.matchReasons,
        };
      });

      // Sort by best match score descending
      scoredOpps.sort((a, b) => b.matchScore - a.matchScore);

      // Select the top eligible opportunity for digest (top 1-2)
      const topOpportunity = scoredOpps[0];

      if (!topOpportunity || topOpportunity.matchScore < OpportunityNotificationService.getThreshold()) {
        skipped++;
        continue;
      }

      try {
        const result = await OpportunityNotificationService.notifyCandidateIfEligible({
          userId: user.id,
          opportunityId: topOpportunity.opp.id,
          userName: user.profile?.firstName || user.email.split('@')[0],
          opportunity: {
            id: topOpportunity.opp.id,
            title: topOpportunity.opp.title,
            location: topOpportunity.opp.location,
            remoteType: topOpportunity.opp.remoteType?.toString(),
            type: topOpportunity.opp.type?.toString(),
            applicationUrl: topOpportunity.opp.applicationUrl,
            deadline: topOpportunity.opp.deadline,
            company: { name: topOpportunity.opp.company.name },
            enrichment: topOpportunity.opp.enrichment,
          },
          matchScore: topOpportunity.matchScore,
          matchedSkills: topOpportunity.matchedSkills,
          matchReasons: topOpportunity.matchReasons,
        });

        if (result.sent) sent++;
        else if (result.skipped) skipped++;
        else failed++;
      } catch (err) {
        console.error(`[DailyDigestDispatcher] Error notifying user ${user.id}:`, err);
        failed++;
      }
    }

    console.info(
      `[DailyDigestDispatcher] Digest run complete: sent=${sent}, skipped=${skipped}, failed=${failed}`
    );

    return {
      eligibleUsers: clerkUsers.length,
      emailsSent: sent,
      emailsSkipped: skipped,
      emailsFailed: failed,
    };
  }
}
