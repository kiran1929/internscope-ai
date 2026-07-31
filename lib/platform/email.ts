import { prisma } from '../db';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export class EmailService {
  static async sendEmail(payload: EmailPayload): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM || 'alerts@internscope.ai';

    console.log(`[Email Service] Processing message outbox to: ${payload.to} | Subject: "${payload.subject}"`);

    let success = false;
    let messageId = '';
    let errorMsg = '';

    if (apiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: `InternScope AI <${fromAddress}>`,
            to: [payload.to],
            subject: payload.subject,
            html: `<p>${payload.body.replace(/\n/g, '<br />')}</p>`,
          }),
        });

        if (response.ok) {
          const resData = await response.json() as any;
          success = true;
          messageId = resData.id || 'resend_success_id';
        } else {
          errorMsg = await response.text();
          console.error('[Email Service] Resend dispatch failed:', errorMsg);
        }
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[Email Service] Resend fetch exception:', err);
      }
    } else {
      success = true;
      messageId = `simulated_${Date.now()}`;
      console.log(`[Email Service] Simulated success (RESEND_API_KEY not configured)`);
    }

    // Persist every email delivery log in SystemAuditLog table
    await prisma.systemAuditLog.create({
      data: {
        action: 'EMAIL_DISPATCH',
        status: success ? 'SUCCESS' : 'FAILURE',
        details: `To: ${payload.to} | Subject: ${payload.subject} | MsgID: ${messageId} | Error: ${errorMsg}`,
      },
    }).catch(e => console.error('Failed to log email audit:', e));

    return { success, messageId, error: errorMsg || undefined };
  }

  static async sendWelcomeEmail(to: string, userName: string) {
    return this.sendEmail({
      to,
      subject: 'Welcome to InternScope AI! Let\'s match your profile',
      body: `Hello ${userName},\n\nWelcome to InternScope AI! We are thrilled to help you scout, match, and secure your next technology internship. Complete your onboarding to set up active tracking alerts.`,
    });
  }

  static async sendWeeklyReportEmail(to: string, reportLink: string) {
    return this.sendEmail({
      to,
      subject: 'Your Weekly Career Progress Report is Ready',
      body: `Hello,\n\nYour weekly Career Snapshot progress review is ready. Check your rating deltas and custom strategic recommendations here: ${reportLink}`,
    });
  }

  static async sendInterviewReminderEmail(to: string, interviewTitle: string, scheduledTime: string) {
    return this.sendEmail({
      to,
      subject: `Upcoming Practice Reminder: "${interviewTitle}"`,
      body: `Hello,\n\nThis is a quick reminder to practice your technical questions for: "${interviewTitle}" scheduled at ${scheduledTime}. Open the practice arena to review your STAR metrics!`,
    });
  }
}
