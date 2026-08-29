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
    const { smtpTransport } = await import('@/lib/email/smtp-transport');

    // 1. Prefer SMTP Transport if configured
    if (smtpTransport.getIsConfigured()) {
      const result = await smtpTransport.sendMail({
        to: payload.to,
        subject: payload.subject,
        html: payload.body.includes('<') ? payload.body : `<p>${payload.body.replace(/\n/g, '<br />')}</p>`,
      });

      // Persist delivery log in SystemAuditLog table
      await prisma.systemAuditLog.create({
        data: {
          action: 'EMAIL_DISPATCH',
          status: result.success ? 'SUCCESS' : 'FAILURE',
          details: `To: ${payload.to} | Subject: ${payload.subject} | MsgID: ${result.messageId} | Transport: SMTP | Error: ${result.error || 'None'}`,
        },
      }).catch(e => console.error('Failed to log email audit:', e));

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };
    }

    // 2. Fallback to Resend API if RESEND_API_KEY is present
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || 'alerts@internscope.ai';

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
            html: payload.body.includes('<') ? payload.body : `<p>${payload.body.replace(/\n/g, '<br />')}</p>`,
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
      console.log(`[Email Service] Simulated success (SMTP and Resend not configured)`);
    }

    // Persist every email delivery log in SystemAuditLog table
    await prisma.systemAuditLog.create({
      data: {
        action: 'EMAIL_DISPATCH',
        status: success ? 'SUCCESS' : 'FAILURE',
        details: `To: ${payload.to} | Subject: ${payload.subject} | MsgID: ${messageId} | Transport: Resend/Simulated | Error: ${errorMsg}`,
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
