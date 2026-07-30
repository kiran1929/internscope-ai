import { CompanyRepository } from '../repositories/company';
import { NormalizedOpportunity, CompanyMatchResult } from './types';
import { MatchError } from './errors';

export class CompanyMatcher {
  static async match(normalized: NormalizedOpportunity): Promise<CompanyMatchResult> {
    try {
      // 1. Match by Website
      if (normalized.companyWebsite) {
        const match = await CompanyRepository.findByWebsite(normalized.companyWebsite);
        if (match) {
          return {
            companyId: match.id,
            confidence: 1.0,
            matchType: 'website',
            message: `Exact match found by company website: ${normalized.companyWebsite}`,
          };
        }
      }

      // 2. Match by LinkedIn URL
      if (normalized.companyLinkedin) {
        const match = await CompanyRepository.findByLinkedIn(normalized.companyLinkedin);
        if (match) {
          return {
            companyId: match.id,
            confidence: 0.95,
            matchType: 'linkedin',
            message: `Exact match found by LinkedIn URL: ${normalized.companyLinkedin}`,
          };
        }
      }

      // 3. Match by Career Page URL
      // If we extract website name, check if website matches career page properties
      if (normalized.companyWebsite) {
        const match = await CompanyRepository.findByCareerPage(normalized.companyWebsite);
        if (match) {
          return {
            companyId: match.id,
            confidence: 0.9,
            matchType: 'careerPage',
            message: `Match found by Career Page lookup: ${normalized.companyWebsite}`,
          };
        }
      }

      // 4. Match by Name (Exact unique key name match)
      const exactNameMatch = await CompanyRepository.findByName(normalized.companyName);
      if (exactNameMatch) {
        return {
          companyId: exactNameMatch.id,
          confidence: 0.85,
          matchType: 'name',
          message: `Match found by exact name: ${normalized.companyName}`,
        };
      }

      // 5. Match by Case-Insensitive Name Search
      // Look up via general query search to capture minor spacing or casing variations
      const queryResults = await CompanyRepository.findMany({
        search: normalized.companyName,
        limit: 5,
      });

      if (queryResults.data.length > 0) {
        const cleanedQueryName = normalized.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const company of queryResults.data) {
          const cleanedDbName = company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanedDbName === cleanedQueryName) {
            return {
              companyId: company.id,
              confidence: 0.75,
              matchType: 'name',
              message: `Match found by case-insensitive name similarity: ${company.name}`,
            };
          }
        }
      }

      return {
        companyId: null,
        confidence: 0.0,
        matchType: 'none',
        message: `No matching company found in database for name: ${normalized.companyName}`,
      };
    } catch (error) {
      throw new MatchError(
        `Failed to execute company matching queries for ${normalized.companyName}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
