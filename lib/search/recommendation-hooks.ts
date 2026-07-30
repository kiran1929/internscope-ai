import type { Opportunity, Company, OpportunityEnrichment } from '../generated/prisma/client';

export type EnrichedOpportunity = Opportunity & {
  company: Company;
  enrichment: OpportunityEnrichment | null;
};

/**
 * 1. Recommendation Engine Interface
 * Defines how future personalization engines will rank opportunities for a specific user.
 */
export interface RecommendationEngine {
  /**
   * Ranks opportunity IDs for a given user profile based on matching criteria.
   */
  getRecommendations(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{
    recommendations: { opportunityId: string; score: number; matchReasons: string[] }[];
    total: number;
  }>;

  /**
   * Computes matching percentage for a single opportunity.
   */
  scoreOpportunity(
    userId: string,
    opportunityId: string
  ): Promise<{ score: number; matchReasons: string[] }>;
}

/**
 * 2. Saved Searches Interface
 * Enables users to persist search criteria and receive triggers for new matches.
 */
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: {
    companyId?: string;
    remoteType?: string;
    employmentType?: string;
    experienceLevel?: string;
    skills?: string[];
    salaryMin?: number;
  };
  createdAt: Date;
}

/**
 * 3. Job Alerts Interface
 * Handles notification preferences and trigger matching when new listings are ingested.
 */
export interface JobAlert {
  id: string;
  userId: string;
  savedSearchId: string;
  frequency: 'INSTANT' | 'DAILY' | 'WEEKLY';
  isActive: boolean;
  lastSentAt: Date | null;
}

export interface JobAlertProcessor {
  /**
   * Triggers comparison of a newly ingested and enriched opportunity against active alerts.
   */
  processAlertMatches(opportunity: EnrichedOpportunity): Promise<void>;
}

/**
 * 4. Resume Matching Interface
 * Matches candidate resumes (PDF/Text) against opportunity requirements.
 */
export interface ResumeMatcher {
  /**
   * Extracts skills and experience metrics from raw resume text.
   */
  parseResume(resumeText: string): Promise<{
    extractedSkills: string[];
    inferredTitle?: string;
    yearsOfExperience?: number;
  }>;

  /**
   * Computes suitability score and extracts skill gaps between parsed resume and an enriched opportunity.
   */
  matchResumeToJob(
    resumeText: string,
    opportunity: EnrichedOpportunity
  ): Promise<{
    matchingScore: number; // 0.0 to 1.0
    matchingSkills: string[];
    missingSkills: string[]; // Skill gaps
    reasoning: string;
  }>;
}
