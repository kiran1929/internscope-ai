import { prisma } from '../db';
import { OpportunityType, RemoteType, Prisma } from '../generated/prisma/client';
import { EnrichedOpportunity } from './recommendation-hooks';
import { openOpportunityWhere } from '../opportunities/deadline-utils';
import { validateSearchLimit, validateSearchOffset } from '../security/pagination';

export interface SearchOptions {
  query?: string;
  companyId?: string;
  remoteType?: string;
  employmentType?: string;
  experienceLevel?: string;
  skills?: string[];
  techStack?: string[];
  salaryMin?: number;
  salaryMax?: number;
  postedDate?: '24h' | '7d' | '30d';
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  opportunities: EnrichedOpportunity[];
  total: number;
  page: number;
  totalPages: number;
}

export class SearchService {
  static async search(options: SearchOptions): Promise<SearchResult> {
    const limit = validateSearchLimit(options.limit);
    const offset = validateSearchOffset(options.offset);
    const query = options.query?.trim() || '';

    // 1. Build DB Filtering Conditions
    const whereConditions: Prisma.OpportunityWhereInput = {
      ...openOpportunityWhere(),
    };

    if (options.companyId) {
      whereConditions.companyId = options.companyId;
    }

    // Remote Type mapping
    if (options.remoteType) {
      const typeStr = options.remoteType.toUpperCase();
      if (typeStr === 'REMOTE') whereConditions.remoteType = RemoteType.REMOTE;
      else if (typeStr === 'HYBRID') whereConditions.remoteType = RemoteType.HYBRID;
      else if (typeStr === 'ONSITE') whereConditions.remoteType = RemoteType.ONSITE;
    }

    // Employment Type mapping (internships only on the public site)
    if (options.employmentType) {
      const typeStr = options.employmentType.toUpperCase();
      if (typeStr === 'INTERNSHIP') whereConditions.type = OpportunityType.INTERNSHIP;
    }

    // Experience Level and Skills filters inside the joined Enrichment table
    const enrichmentConditions: Prisma.OpportunityEnrichmentWhereInput = {};
    let hasEnrichmentFilter = false;

    if (options.experienceLevel) {
      enrichmentConditions.experienceLevel = options.experienceLevel;
      hasEnrichmentFilter = true;
    }

    if (options.skills && options.skills.length > 0) {
      enrichmentConditions.skills = {
        hasSome: options.skills,
      };
      hasEnrichmentFilter = true;
    }

    if (options.salaryMin) {
      enrichmentConditions.salaryMin = {
        gte: options.salaryMin,
      };
      hasEnrichmentFilter = true;
    }

    if (hasEnrichmentFilter) {
      whereConditions.enrichment = enrichmentConditions;
    }

    // Freshness Date filter
    if (options.postedDate) {
      const cutoffDate = new Date();
      if (options.postedDate === '24h') {
        cutoffDate.setDate(cutoffDate.getDate() - 1);
      } else if (options.postedDate === '7d') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (options.postedDate === '30d') {
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      }
      whereConditions.createdAt = {
        gte: cutoffDate,
      };
    }

    // 2. Fetch records from Neon PostgreSQL
    const matches = await prisma.opportunity.findMany({
      where: whereConditions,
      include: {
        company: true,
        enrichment: true,
      },
    });

    // 3. Apply Heuristic Ranking algorithm in memory
    const rankedResults = matches.map((opp) => {
      let score = 0;

      // Rule A: Keyword Relevance (Weight = 45 points max)
      if (query) {
        const q = query.toLowerCase();
        const title = opp.title.toLowerCase();
        const companyName = opp.company.name.toLowerCase();
        const description = (opp.description || '').toLowerCase();

        if (title === q) {
          score += 45;
        } else if (title.includes(q)) {
          score += 30;
        } else if (description.includes(q)) {
          score += 15;
        }

        if (companyName.includes(q)) {
          score += 10;
        }
      }

      // Rule B: Skill Overlap (Weight = 30 points max)
      // Check if target skills match the job's extracted skills
      const opportunitySkills = opp.enrichment?.skills || [];
      if (options.skills && options.skills.length > 0 && opportunitySkills.length > 0) {
        const intersection = opportunitySkills.filter((s) =>
          options.skills!.map((os) => os.toLowerCase()).includes(s.toLowerCase())
        );
        score += (intersection.length / options.skills.length) * 30;
      }

      // Rule C: Freshness (Weight = 15 points max)
      const ageMs = Date.now() - new Date(opp.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays <= 1) score += 15;
      else if (ageDays <= 7) score += 10;
      else if (ageDays <= 30) score += 5;

      // Rule D: Confidence Score (Weight = 10 points max)
      const confidence = opp.enrichment?.qualityScore || 0.5;
      score += confidence * 10;

      return { opportunity: opp as EnrichedOpportunity, score };
    });

    // Sort by computed score descending
    rankedResults.sort((a, b) => b.score - a.score);

    const total = rankedResults.length;
    const paginated = rankedResults
      .slice(offset, offset + limit)
      .map((r) => r.opportunity);

    // 4. Log telemetry search query asynchronously to database
    if (query && query.trim().length > 0) {
      (async () => {
        try {
          await prisma.searchLog.create({
            data: {
              query: query.trim(),
              filters: JSON.stringify(options),
              resultsCount: total,
              userId: options.userId || null,
            },
          });
        } catch (err) {
          console.error('[SearchService] Telemetry log save failed:', err);
        }
      })();
    }

    return {
      opportunities: paginated,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async autocomplete(
    field: 'company' | 'skill' | 'technology' | 'location',
    input: string
  ): Promise<string[]> {
    const term = input.trim().toLowerCase();
    if (!term) return [];

    if (field === 'company') {
      const companies = await prisma.company.findMany({
        where: { name: { contains: term, mode: 'insensitive' } },
        select: { name: true },
        take: 5,
      });
      return Array.from(new Set(companies.map((c) => c.name)));
    }

    if (field === 'location') {
      const opportunities = await prisma.opportunity.findMany({
        where: { location: { contains: term, mode: 'insensitive' } },
        select: { location: true },
        take: 10,
      });
      return Array.from(new Set(opportunities.map((o) => o.location)));
    }

    if (field === 'skill') {
      // Find matching skills within completed enrichments
      const enrichments = await prisma.opportunityEnrichment.findMany({
        where: {
          status: 'COMPLETED',
          skills: { hasSome: [term] }, // Postgres array matches are precise, contains requires list mapping
        },
        select: { skills: true },
        take: 30,
      });

      // Filter and count matches in memory
      const allSkills = enrichments.flatMap((e) => e.skills);
      const matches = allSkills.filter((s) => s.toLowerCase().includes(term));
      return Array.from(new Set(matches)).slice(0, 5);
    }

    if (field === 'technology') {
      const enrichments = await prisma.opportunityEnrichment.findMany({
        where: {
          status: 'COMPLETED',
          tags: { hasSome: [term] },
        },
        select: { tags: true },
        take: 20,
      });

      const allTags = enrichments.flatMap((e) => e.tags);
      const matches = allTags.filter((t) => t.toLowerCase().includes(term));
      return Array.from(new Set(matches)).slice(0, 5);
    }

    return [];
  }

  static async getTrendAnalytics() {
    // 1. Fetch completed enrichments to build trends
    const enrichments = await prisma.opportunityEnrichment.findMany({
      where: { status: 'COMPLETED' },
      select: {
        skills: true,
        tags: true,
        remoteType: true,
        salaryMin: true,
        salaryMax: true,
        opportunity: {
          select: {
            location: true,
            company: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Compute metrics
    const skillsCounts: Record<string, number> = {};
    const tagsCounts: Record<string, number> = {};
    const companyCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    let remoteCount = 0;

    const salaryDistribution = {
      'Under $50k': 0,
      '$50k - $100k': 0,
      '$100k - $150k': 0,
      '$150k+': 0,
    };

    enrichments.forEach((e) => {
      // Skills
      e.skills.forEach((s) => {
        skillsCounts[s] = (skillsCounts[s] || 0) + 1;
      });

      // Tags/Tech
      e.tags.forEach((t) => {
        tagsCounts[t] = (tagsCounts[t] || 0) + 1;
      });

      // Company
      if (e.opportunity?.company?.name) {
        const name = e.opportunity.company.name;
        companyCounts[name] = (companyCounts[name] || 0) + 1;
      }

      // Location
      if (e.opportunity?.location) {
        const loc = e.opportunity.location;
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }

      // Remote percentage
      if (e.remoteType?.toUpperCase() === 'REMOTE') {
        remoteCount++;
      }

      // Salaries
      if (e.salaryMin) {
        const minVal = e.salaryMin;
        if (minVal < 50000) salaryDistribution['Under $50k']++;
        else if (minVal < 100000) salaryDistribution['$50k - $100k']++;
        else if (minVal < 150000) salaryDistribution['$100k - $150k']++;
        else salaryDistribution['$150k+']++;
      }
    });

    // Map helpers to return sorted top items arrays
    const getTopItems = (counts: Record<string, number>, limit = 5) => {
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    };

    const totalOpportunities = await prisma.opportunity.count({
      where: openOpportunityWhere(),
    });

    return {
      topSkills: getTopItems(skillsCounts, 6),
      topTechnologies: getTopItems(tagsCounts, 6),
      hiringCompanies: getTopItems(companyCounts, 6),
      mostCommonLocations: getTopItems(locationCounts, 6),
      remotePercentage: totalOpportunities > 0 ? Math.round((remoteCount / totalOpportunities) * 100) : 0,
      salaryDistribution,
    };
  }

  static async getSearchStats() {
    const [totalSearches, recentLogs] = await Promise.all([
      prisma.searchLog.count(),
      prisma.searchLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { query: true },
      }),
    ]);

    // Compute most searched keywords
    const searchCounts: Record<string, number> = {};
    recentLogs.forEach((log) => {
      const q = log.query.trim().toLowerCase();
      if (q) {
        searchCounts[q] = (searchCounts[q] || 0) + 1;
      }
    });

    const trendingQueries = Object.entries(searchCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Compute daily indexed stats for the last 7 days
    const dailyIndexed: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const count = await prisma.opportunity.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const dayLabel = startOfDay.toLocaleDateString([], { weekday: 'short' });
      dailyIndexed.push({ label: dayLabel, value: count });
    }

    return {
      totalSearches,
      trendingQueries,
      dailyIndexed,
    };
  }
}
