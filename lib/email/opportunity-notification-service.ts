import { prisma } from '@/lib/db';
import { smtpTransport } from './smtp-transport';
import { EmailTemplateRenderer, OpportunityEmailData } from './template-renderer';
import { isDirectApplicationUrl } from './application-url-utils';
import { NotificationStatus } from '@/lib/generated/prisma/client';

export interface OpportunityNotificationParams {
  userId: string;
  opportunityId?: string;
  recipientEmail?: string;
  userName?: string;
  opportunity: {
    id?: string;
    title: string;
    location?: string;
    remoteType?: string;
    type?: string;
    applicationUrl: string;
    deadline?: Date | string | null;
    company: {
      name: string;
    };
    enrichment?: {
      skills?: string[];
      experienceLevel?: string | null;
      salaryMin?: number | null;
      salaryMax?: number | null;
      salaryCurrency?: string | null;
    } | null;
  };
  matchScore: number;
  matchedSkills?: string[];
  matchReasons?: string[];
  forceSend?: boolean; // For testing bypass
}

export interface NotificationResult {
  sent: boolean;
  skipped?: boolean;
  skipReason?: string;
  messageId?: string;
  error?: string;
  notificationId?: string;
}

export class OpportunityNotificationService {
  /**
   * Configurable threshold from environment variable or default 80%.
   */
  public static getThreshold(): number {
    const raw = process.env.OPPORTUNITY_EMAIL_THRESHOLD;
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
    return 80; // Default: 80% Match Score
  }

  public static isEnabled(): boolean {
    return process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false';
  }

  /**
   * Evaluates eligibility and delivers a personalized opportunity notification via SMTP.
   * Enforces duplicate protection and records delivery status.
   */
  static async notifyCandidateIfEligible(params: OpportunityNotificationParams): Promise<NotificationResult> {
    const threshold = this.getThreshold();

    // 1. Check Global Feature Switch
    if (!this.isEnabled() && !params.forceSend) {
      console.info(`[NotificationService] Email notifications globally disabled (EMAIL_NOTIFICATIONS_ENABLED=false)`);
      return { sent: false, skipped: true, skipReason: 'EMAIL_NOTIFICATIONS_DISABLED' };
    }

    // 2. Check Match Score Threshold
    if (params.matchScore < threshold && !params.forceSend) {
      console.info(`[NotificationService] Match score (${params.matchScore}%) below threshold (${threshold}%). Skipped.`);
      return { sent: false, skipped: true, skipReason: `SCORE_BELOW_THRESHOLD (${params.matchScore} < ${threshold})` };
    }

    // 3. Fetch User & Email Preferences
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        profile: true,
        emailPreference: true,
      },
    });

    if (!user) {
      console.warn(`[NotificationService] User not found with ID: ${params.userId}`);
      return { sent: false, error: 'User record not found' };
    }

    // 4. Resolve Recipient Email strictly from authenticated user entity or user preference
    const recipientEmail = params.recipientEmail || user.emailPreference?.emailDestination || user.email;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(`[NotificationService] No valid destination email configured for user ID: ${params.userId}`);
      return { sent: false, skipped: true, skipReason: 'NO_VALID_RECIPIENT_EMAIL' };
    }

    // 5. Check User's Email Preference Flag (instantAlerts / newOpportunities)
    if (user.emailPreference && !params.forceSend) {
      const wantsAlerts = user.emailPreference.instantAlerts && user.emailPreference.newOpportunities;
      if (!wantsAlerts) {
        console.info(`[NotificationService] User ${user.email} has disabled instant opportunity alerts in settings.`);
        return { sent: false, skipped: true, skipReason: 'USER_PREFERENCE_DISABLED' };
      }
    }

    // 6. Duplicate Protection: Check if this user was already notified for this exact opportunity
    const oppId = params.opportunityId || params.opportunity.id;

    if (oppId && !params.forceSend) {
      const existingSent = await prisma.emailNotification.findFirst({
        where: {
          userId: user.id,
          opportunityId: oppId,
          status: NotificationStatus.SENT,
        },
      });

      if (existingSent) {
        console.info(`[NotificationService] Duplicate prevention: User ${user.id} already received email for opportunity ${oppId}`);
        return { sent: false, skipped: true, skipReason: 'DUPLICATE_NOTIFICATION_PREVENTED' };
      }
    }

    // 7. Format details & match reasons dynamically
    const userName = params.userName || user.profile?.firstName || user.email.split('@')[0] || 'Candidate';
    const opp = params.opportunity;

    const matchedSkills = params.matchedSkills || (opp.enrichment?.skills ? opp.enrichment.skills.slice(0, 5) : ['Software Engineering']);

    const matchReasons = params.matchReasons || [
      `High compatibility with your skills profile (${params.matchScore}% Match)`,
      `Opportunity matches your preferred ${opp.remoteType ? opp.remoteType.toLowerCase() : 'remote'} work mode`,
      `Target company ${opp.company.name} in technology sector`,
    ];

    let stipendFormatted = 'Competitive';
    if (opp.enrichment?.salaryMin) {
      const currency = opp.enrichment.salaryCurrency || '$';
      stipendFormatted = `${currency}${Math.round(opp.enrichment.salaryMin).toLocaleString()} / month`;
    }

    let deadlineFormatted = 'Open until filled';
    if (opp.deadline) {
      try {
        deadlineFormatted = new Date(opp.deadline).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        deadlineFormatted = String(opp.deadline);
      }
    }

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Direct link to the specific job application posting (external)
    let normalizedAppUrl = opp.applicationUrl ? opp.applicationUrl.trim() : '';
    if (!normalizedAppUrl) {
      normalizedAppUrl = oppId ? `${appBaseUrl}/jobs/${oppId}` : `${appBaseUrl}/internships`;
    } else if (!normalizedAppUrl.startsWith('http://') && !normalizedAppUrl.startsWith('https://')) {
      if (normalizedAppUrl.startsWith('/')) {
        normalizedAppUrl = `${appBaseUrl}${normalizedAppUrl}`;
      } else {
        normalizedAppUrl = `https://${normalizedAppUrl}`;
      }
    }

    const opportunityUrl = normalizedAppUrl;

    if (!isDirectApplicationUrl(normalizedAppUrl)) {
      console.warn(
        `[NotificationService] Generic application URL for "${opp.title}" (${opp.company.name}): ${normalizedAppUrl}`,
      );
    }

    // Dynamic Timeline / Duration derivation based on opportunity type, title, and program length
    let durationFormatted = 'Summer 2027 (10–12 Weeks)';
    const titleLower = opp.title.toLowerCase();
    const typeStr = (opp.type || '').toUpperCase();

    if (typeStr === 'FELLOWSHIP' || titleLower.includes('fellowship') || titleLower.includes('phd')) {
      durationFormatted = 'Academic Year (9–12 Months)';
    } else if (typeStr === 'HACKATHON' || titleLower.includes('hackathon')) {
      durationFormatted = 'Weekend Sprint (48 Hours)';
    } else if (typeStr === 'RESEARCH' || titleLower.includes('summer of code') || titleLower.includes('gsoc')) {
      durationFormatted = 'Summer Term (12–16 Weeks)';
    } else if (typeStr === 'SCHOLARSHIP' || titleLower.includes('scholarship')) {
      durationFormatted = 'Annual Award';
    } else if (typeStr === 'NEW_GRAD' || titleLower.includes('new grad') || titleLower.includes('full-time') || titleLower.includes('sde')) {
      durationFormatted = 'Full-Time Permanent (Starting 2027)';
    } else if (titleLower.includes('step') || titleLower.includes('explore') || titleLower.includes('university')) {
      durationFormatted = 'Summer 2027 (12 Weeks)';
    } else if (titleLower.includes('fall') || titleLower.includes('winter') || titleLower.includes('spring')) {
      durationFormatted = 'Semester Co-op (16 Weeks)';
    }

    const emailData: OpportunityEmailData = {
      userName,
      recipientEmail,
      opportunityTitle: opp.title,
      companyName: opp.company.name,
      location: opp.location || 'Remote',
      workMode: opp.remoteType ? opp.remoteType.charAt(0).toUpperCase() + opp.remoteType.slice(1).toLowerCase() : 'Remote',
      duration: durationFormatted,
      stipend: stipendFormatted,
      deadline: deadlineFormatted,
      matchScore: params.matchScore,
      matchedSkills,
      matchReasons,
      opportunityUrl,
      applicationUrl: normalizedAppUrl,
      dashboardUrl: appBaseUrl,
    };

    // 8. Render HTML Template
    const { html, subject } = EmailTemplateRenderer.renderOpportunityNotification(emailData);

    // 9. Create PENDING Log in EmailNotification table
    let notificationRecord = null;
    try {
      notificationRecord = await prisma.emailNotification.create({
        data: {
          userId: user.id,
          opportunityId: oppId || null,
          recipientEmail,
          subject,
          matchScore: params.matchScore,
          status: NotificationStatus.PENDING,
        },
      });
    } catch (dbErr) {
      console.warn('[NotificationService] Failed to create pending EmailNotification log:', dbErr);
    }

    // 10. Send through SMTP Transport
    const sendResult = await smtpTransport.sendMail({
      to: recipientEmail,
      subject,
      html,
    });

    // 11. Update Notification Record Status
    if (notificationRecord) {
      try {
        await prisma.emailNotification.update({
          where: { id: notificationRecord.id },
          data: {
            status: sendResult.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
            sentAt: sendResult.success ? new Date() : null,
            messageId: sendResult.messageId || null,
            errorMessage: sendResult.error || null,
          },
        });
      } catch (updateErr) {
        console.error('[NotificationService] Failed to update EmailNotification status:', updateErr);
      }
    }

    if (!sendResult.success) {
      return {
        sent: false,
        error: sendResult.error,
        notificationId: notificationRecord?.id,
      };
    }

    return {
      sent: true,
      messageId: sendResult.messageId,
      notificationId: notificationRecord?.id,
    };
  }
}
