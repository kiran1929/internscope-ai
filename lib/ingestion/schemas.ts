import { z } from 'zod';

/**
 * Greenhouse API Schemas (HIGH-002)
 */
export const greenhouseJobSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().min(1, 'Greenhouse job must have a title'),
  updated_at: z.string().optional().nullable(),
  location: z.union([
    z.string(),
    z.object({ name: z.string().optional() })
  ]).optional().nullable(),
  absolute_url: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  departments: z.array(z.object({ id: z.union([z.number(), z.string()]).optional(), name: z.string().optional() })).optional().nullable(),
  offices: z.array(z.object({ id: z.union([z.number(), z.string()]).optional(), name: z.string().optional(), location: z.string().optional() })).optional().nullable(),
}).passthrough();

export const greenhouseResponseSchema = z.object({
  jobs: z.array(greenhouseJobSchema).default([]),
});

/**
 * Lever API Schemas (HIGH-002)
 */
export const leverJobSchema = z.object({
  id: z.string().min(1, 'Lever job must have an ID'),
  text: z.string().min(1, 'Lever job must have a title/text'),
  createdAt: z.number().or(z.string()).optional().nullable(),
  hostedUrl: z.string().optional().nullable(),
  applyUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionPlain: z.string().optional().nullable(),
  categories: z.object({
    location: z.string().optional().nullable(),
    commitment: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    team: z.string().optional().nullable(),
  }).optional().nullable(),
  workplaceType: z.string().optional().nullable(),
  lists: z.array(z.object({ text: z.string().optional(), content: z.string().optional() })).optional().nullable(),
}).passthrough();

export const leverResponseSchema = z.array(leverJobSchema);

/**
 * Ashby API Schemas (HIGH-002)
 */
export const ashbyJobSchema = z.object({
  id: z.string().min(1, 'Ashby job must have an ID'),
  title: z.string().min(1, 'Ashby job must have a title'),
  publishedAt: z.string().optional().nullable(),
  jobUrl: z.string().optional().nullable(),
  applyUrl: z.string().optional().nullable(),
  locationName: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  departmentName: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  isRemote: z.boolean().optional().nullable(),
  descriptionHtml: z.string().optional().nullable(),
  descriptionPlain: z.string().optional().nullable(),
}).passthrough();

export const ashbyResponseSchema = z.object({
  jobs: z.array(ashbyJobSchema).optional().default([]),
  results: z.array(ashbyJobSchema).optional().default([]),
}).passthrough();
