import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  logoUrl: z.string().url('Please enter a valid logo URL').nullable().optional().or(z.literal('')),
  websiteUrl: z.string().url('Please enter a valid website URL').nullable().optional().or(z.literal('')),
  careerPageUrl: z.string().url('Please enter a valid career page URL').nullable().optional().or(z.literal('')),
  industry: z.string().nullable().optional().or(z.literal('')),
  description: z.string().nullable().optional().or(z.literal('')),
  country: z.string().nullable().optional().or(z.literal('')),
  state: z.string().nullable().optional().or(z.literal('')),
  city: z.string().nullable().optional().or(z.literal('')),
  companySize: z.string().default('1-10'),
  foundedYear: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : parseInt(val as string, 10)),
    z
      .number()
      .int('Founded year must be an integer')
      .positive('Founded year must be positive')
      .max(currentYear, `Founded year cannot be in the future (max ${currentYear})`)
      .nullable()
      .optional()
  ),
  linkedinUrl: z.string().url('Please enter a valid LinkedIn URL').nullable().optional().or(z.literal('')),
  twitterUrl: z.string().url('Please enter a valid Twitter/X URL').nullable().optional().or(z.literal('')),
  githubUrl: z.string().url('Please enter a valid GitHub URL').nullable().optional().or(z.literal('')),
  isVerified: z.boolean().default(false),
  hiringStatus: z.string().default('HIRING'), // e.g. "HIRING", "NOT_HIRING", "FREEZE"
  tags: z.array(z.string()).default([]),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
