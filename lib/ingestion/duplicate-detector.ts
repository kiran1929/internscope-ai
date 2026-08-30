import { prisma } from '../db';
import { NormalizedOpportunity, DuplicateDetectResult } from './types';

export class DuplicateDetector {
  static async detect(
    normalized: NormalizedOpportunity,
    companyId: string | null
  ): Promise<DuplicateDetectResult> {
    try {
      // 1. Match by exact application URL (HIGH-003)
      if (normalized.applicationUrl) {
        const rawUrl = normalized.applicationUrl.trim();
        const cleanUrl = rawUrl.split(/[?#]/)[0]; // Canonical base URL

        const urlMatch = await prisma.opportunity.findFirst({
          where: {
            OR: [
              { applicationUrl: rawUrl },
              { applicationUrl: cleanUrl },
              { applicationUrl: { startsWith: cleanUrl } },
            ],
            isArchived: false,
          },
          include: {
            company: true,
          },
        });

        if (urlMatch) {
          return {
            isDuplicate: true,
            confidence: 1.0,
            existingOpportunityId: urlMatch.id,
            message: `Duplicate detected: Application URL matched existing opportunity (${urlMatch.id}) under ${urlMatch.company.name}`,
          };
        }
      }

      // If no matched company, we cannot perform title/company matching
      if (!companyId) {
        return {
          isDuplicate: false,
          confidence: 0.0,
          existingOpportunityId: null,
          message: 'No duplicate detected. (Skipped company-based check due to empty company ID)',
        };
      }

      // 2. Match by exact Title, Company, and Location combination
      const exactTclMatch = await prisma.opportunity.findFirst({
        where: {
          title: { equals: normalized.title, mode: 'insensitive' },
          companyId: companyId,
          location: { equals: normalized.location, mode: 'insensitive' },
          isArchived: false,
        },
      });

      if (exactTclMatch) {
        return {
          isDuplicate: true,
          confidence: 0.9,
          existingOpportunityId: exactTclMatch.id,
          message: `Duplicate detected: Exact Title, Company, and Location match with job ID ${exactTclMatch.id}`,
        };
      }

      // 3. Match by Title and Company only (e.g. location varies slightly, like "Remote" vs "San Francisco, CA")
      const titleCompanyMatch = await prisma.opportunity.findFirst({
        where: {
          title: { equals: normalized.title, mode: 'insensitive' },
          companyId: companyId,
          isArchived: false,
        },
      });

      if (titleCompanyMatch) {
        return {
          isDuplicate: true,
          confidence: 0.7,
          existingOpportunityId: titleCompanyMatch.id,
          message: `Potential duplicate: Same title and company with differing location ("${titleCompanyMatch.location}" vs "${normalized.location}")`,
        };
      }

      return {
        isDuplicate: false,
        confidence: 0.0,
        existingOpportunityId: null,
        message: 'No duplicate records found in database.',
      };
    } catch (error) {
      console.error('Duplicate detection pipeline exception:', error);
      // Fallback to non-duplicate to not block ingestion if query errors
      return {
        isDuplicate: false,
        confidence: 0.0,
        existingOpportunityId: null,
        message: `Duplicate detection failed due to error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
