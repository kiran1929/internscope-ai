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
    console.log(`[Email Outbox] Sending email to ${payload.to} | Subject: "${payload.subject}"`);
    console.log(`[Email Body Preview] ${payload.body.slice(0, 180)}...`);

    // Simulated email delivery
    return {
      success: true,
      messageId: `msg_${Math.random().toString(36).substring(2, 11)}`,
    };
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
