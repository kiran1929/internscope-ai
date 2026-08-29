import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export class SMTPTransport {
  private static instance: SMTPTransport;
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  private constructor() {
    this.initTransporter();
  }

  public static getInstance(): SMTPTransport {
    if (!SMTPTransport.instance) {
      SMTPTransport.instance = new SMTPTransport();
    }
    return SMTPTransport.instance;
  }

  /**
   * Initializes the Nodemailer transporter using environment variables.
   */
  public initTransporter(): void {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USERNAME || process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          // Pool connections for server performance
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateLimit: 10, // 10 messages per second
        });
        this.isConfigured = true;
        console.log(`[SMTPTransport] Initialized SMTP transporter for host: ${host}:${port} (secure: ${secure})`);
      } catch (err) {
        console.error('[SMTPTransport] Failed to initialize SMTP transporter:', err instanceof Error ? err.message : String(err));
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      console.info('[SMTPTransport] SMTP credentials not fully configured in environment. Emails will run in simulated preview mode.');
    }
  }

  public getFromAddress(): string {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || 'alerts@internscope.ai';
    const fromName = process.env.SMTP_FROM_NAME || 'InternScope AI';
    return `"${fromName}" <${fromEmail}>`;
  }

  public getIsConfigured(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Delivers an email through SMTP or logs simulation if not configured.
   */
  public async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    // Re-initialize transporter with current process.env if needed
    this.initTransporter();
    const from = this.getFromAddress();

    // If SMTP is not configured, simulate successful delivery in dev
    if (!this.transporter || !this.isConfigured) {
      const simulatedId = `simulated_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[SMTPTransport] [SIMULATION] Email to: ${options.to} | Subject: "${options.subject}" | ID: ${simulatedId}`);
      return {
        success: true,
        messageId: simulatedId,
        simulated: true,
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        replyTo: options.replyTo,
      });

      console.log(`[SMTPTransport] Dispatched email to: ${options.to} | MessageId: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        simulated: false,
      };
    } catch (error) {
      const safeErrorMsg = error instanceof Error ? error.message : 'Unknown SMTP dispatch error';
      // Log error safely without leaking credentials
      console.error(`[SMTPTransport] Failed to send email to ${options.to}:`, safeErrorMsg);
      return {
        success: false,
        error: safeErrorMsg,
        simulated: false,
      };
    }
  }

  /**
   * Verifies SMTP connection credentials.
   */
  public async verifyConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.transporter) {
      return { connected: false, error: 'SMTP transporter not configured' };
    }
    try {
      await this.transporter.verify();
      return { connected: true };
    } catch (err) {
      return { connected: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  }
}

export const smtpTransport = SMTPTransport.getInstance();
