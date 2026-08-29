import fs from 'fs';
import path from 'path';

export interface OpportunityEmailData {
  userName: string;
  recipientEmail: string;
  opportunityTitle: string;
  companyName: string;
  location: string;
  workMode: string;
  duration?: string;
  stipend?: string;
  deadline?: string;
  matchScore: number;
  matchedSkills: string[];
  matchReasons: string[];
  applicationUrl: string;
  dashboardUrl?: string;
}

export class EmailTemplateRenderer {
  private static cachedTemplate: string | null = null;

  /**
   * Sanitizes input to prevent HTML injection into email templates.
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Loads the HTML template from disk.
   */
  private static getTemplate(): string {
    const templatePath = path.join(process.cwd(), 'lib/email/templates/opportunity-notification.html');
    return fs.readFileSync(templatePath, 'utf8');
  }

  /**
   * Renders the complete HTML email with sanitized variables.
   */
  static renderOpportunityNotification(data: OpportunityEmailData): { html: string; subject: string } {
    const rawTemplate = this.getTemplate();
    const safeUserName = this.escapeHtml(data.userName || 'Candidate');
    const safeRole = this.escapeHtml(data.opportunityTitle);
    const safeCompany = this.escapeHtml(data.companyName);
    const safeLocation = this.escapeHtml(data.location || 'Remote');
    const safeWorkMode = this.escapeHtml(data.workMode || 'Remote');
    const safeDuration = this.escapeHtml(data.duration || '3–6 Months');
    const safeStipend = this.escapeHtml(data.stipend || 'Competitive');
    const safeDeadline = this.escapeHtml(data.deadline || 'Open until filled');
    const safeAppUrl = data.applicationUrl;
    const safeDashboardUrl = data.dashboardUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://internscope.ai';

    const matchBadge = data.matchScore >= 90 ? 'High Match' : 'Recommended';

    // Render bullet points for match reasons
    const matchReasonsList = (data.matchReasons && data.matchReasons.length > 0 ? data.matchReasons : [
      `High compatibility with your skills profile (${data.matchScore}% Match)`,
      `Relevant technology stack aligned with your background`,
    ])
      .map(
        (reason) => `
      <tr>
        <td width="20" valign="top" style="color: #34d399; font-size: 14px; line-height: 22px;">&#10003;</td>
        <td style="font-size: 13px; line-height: 22px; color: #cbd5e1; padding-bottom: 6px;">
          ${this.escapeHtml(reason)}
        </td>
      </tr>`
      )
      .join('');

    // Render skill badges
    const skillPills = (data.matchedSkills && data.matchedSkills.length > 0 ? data.matchedSkills.slice(0, 6) : ['Technology'])
      .map(
        (skill) =>
          `<span style="display: inline-block; font-size: 10px; font-weight: 700; color: #93c5fd; background: #162033; border: 1px solid #223250; padding: 2px 8px; border-radius: 6px; margin-right: 4px; margin-bottom: 4px;">${this.escapeHtml(
            skill
          )}</span>`
      )
      .join('');

    let rendered = rawTemplate
      .replace(/{{userName}}/g, safeUserName)
      .replace(/{{opportunityTitle}}/g, safeRole)
      .replace(/{{companyName}}/g, safeCompany)
      .replace(/{{location}}/g, safeLocation)
      .replace(/{{workMode}}/g, safeWorkMode)
      .replace(/{{duration}}/g, safeDuration)
      .replace(/{{stipend}}/g, safeStipend)
      .replace(/{{deadline}}/g, safeDeadline)
      .replace(/{{matchScore}}/g, String(data.matchScore))
      .replace(/{{matchBadge}}/g, matchBadge)
      .replace(/{{applicationUrl}}/g, safeAppUrl)
      .replace(/{{dashboardUrl}}/g, safeDashboardUrl)
      .replace(/{{matchReasonsList}}/g, matchReasonsList)
      .replace(/{{skillPills}}/g, skillPills)
      .replace(/{{currentYear}}/g, String(new Date().getFullYear()));

    // Generate dynamic subject line
    const subject = `${data.matchScore}% Match — ${safeRole} at ${safeCompany}`;

    return { html: rendered, subject };
  }
}
