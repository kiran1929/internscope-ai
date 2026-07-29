import { z } from 'zod';
import { OpportunityType, RemoteType } from '../generated/prisma/enums';

export const opportunitySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  companyId: z.string().min(1, 'Please select a company'),
  description: z.string().min(10, 'Description must be at least 10 characters').nullable().optional().or(z.literal('')),
  requirements: z.string().nullable().optional().or(z.literal('')),
  location: z.string().min(2, 'Location is required'),
  remoteType: z.nativeEnum(RemoteType),
  type: z.nativeEnum(OpportunityType),
  salaryRange: z.string().nullable().optional().or(z.literal('')),
  benefits: z.string().nullable().optional().or(z.literal('')),
  applicationUrl: z.string().url('Please enter a valid application URL'),
  deadline: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional()
  ),
  isActive: z.boolean().default(true),
  isArchived: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;
