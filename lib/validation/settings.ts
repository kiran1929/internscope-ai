import { z } from 'zod';

export const generalSettingsSchema = z.object({
  siteName: z.string().min(2, 'Site name must be at least 2 characters').max(100),
  supportEmail: z.string().email('Please enter a valid support email address'),
});

export const platformSettingsSchema = z.object({
  allowSignups: z.boolean(),
  maintenanceMode: z.boolean(),
});

export const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP Host is required'),
  smtpPort: z.coerce.number().min(1, 'Port must be greater than 0').max(65535, 'Invalid port'),
});

export const aiSettingsSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  temperature: z.coerce.number().min(0).max(2, 'Temperature must be between 0 and 2'),
});

export const scraperSettingsSchema = z.object({
  cronInterval: z.string().min(1, 'Cron interval is required'),
  maxConcurrentJobs: z.coerce.number().min(1, 'Must be at least 1').max(10, 'Maximum is 10'),
});

export const securitySettingsSchema = z.object({
  requireMfa: z.boolean(),
  passwordExpiryDays: z.coerce.number().min(0).max(365, 'Must be between 0 and 365'),
});

export const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string().min(1, 'Primary color is required'),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;
export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;
export type AISettingsInput = z.infer<typeof aiSettingsSchema>;
export type ScraperSettingsInput = z.infer<typeof scraperSettingsSchema>;
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
export type AppearanceSettingsInput = z.infer<typeof appearanceSettingsSchema>;
