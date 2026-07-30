import { prisma } from '../db';
import { OpportunityEnrichment, EnrichmentStatus, Prisma } from '../generated/prisma/client';

export class EnrichmentRepository {
  static async createRunning(opportunityId: string): Promise<OpportunityEnrichment> {
    return prisma.opportunityEnrichment.upsert({
      where: { opportunityId },
      update: {
        status: EnrichmentStatus.RUNNING,
        error: null,
      },
      create: {
        opportunityId,
        status: EnrichmentStatus.RUNNING,
        provider: 'Unknown',
        model: 'Unknown',
      },
    });
  }

  static async updateSuccess(
    opportunityId: string,
    data: Prisma.OpportunityEnrichmentUpdateInput & { tags: string[] }
  ): Promise<OpportunityEnrichment> {
    // 1. Update the opportunity's tags in parallel
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { tags: data.tags },
    });

    // 2. Update enrichment record to COMPLETED
    return prisma.opportunityEnrichment.update({
      where: { opportunityId },
      data: {
        ...data,
        status: EnrichmentStatus.COMPLETED,
        error: null,
      },
    });
  }

  static async updateFailure(opportunityId: string, error: string): Promise<OpportunityEnrichment> {
    return prisma.opportunityEnrichment.update({
      where: { opportunityId },
      data: {
        status: EnrichmentStatus.FAILED,
        error,
      },
    });
  }

  static async findPending(): Promise<string[]> {
    // Opportunities that do NOT have any enrichment record, or failed records
    const opportunities = await prisma.opportunity.findMany({
      where: {
        isArchived: false,
        OR: [
          { enrichment: null },
          { enrichment: { status: EnrichmentStatus.FAILED } },
        ],
      },
      select: { id: true },
    });

    return opportunities.map((o) => o.id);
  }

  static async getEnrichmentStats() {
    const [totalOpportunityCount, pendingCount, runningCount, completedCount, failedCount, statsAgg] = await Promise.all([
      prisma.opportunity.count({ where: { isArchived: false } }),
      prisma.opportunity.count({
        where: {
          isArchived: false,
          OR: [
            { enrichment: null },
            { enrichment: { status: EnrichmentStatus.FAILED } },
          ],
        },
      }),
      prisma.opportunityEnrichment.count({ where: { status: EnrichmentStatus.RUNNING } }),
      prisma.opportunityEnrichment.count({ where: { status: EnrichmentStatus.COMPLETED } }),
      prisma.opportunityEnrichment.count({ where: { status: EnrichmentStatus.FAILED } }),
      prisma.opportunityEnrichment.aggregate({
        where: { status: EnrichmentStatus.COMPLETED },
        _avg: {
          latencyMs: true,
          qualityScore: true,
        },
        _sum: {
          tokensUsed: true,
          estimatedCost: true,
        },
      }),
    ]);

    return {
      total: totalOpportunityCount,
      pending: pendingCount,
      running: runningCount,
      completed: completedCount,
      failed: failedCount,
      avgLatencyMs: statsAgg._avg.latencyMs || 0,
      avgConfidence: statsAgg._avg.qualityScore || 0,
      totalTokens: statsAgg._sum.tokensUsed || 0,
      totalCost: statsAgg._sum.estimatedCost || 0,
    };
  }

  static async getConfidenceDistribution() {
    const enrichments = await prisma.opportunityEnrichment.findMany({
      where: { status: EnrichmentStatus.COMPLETED },
      select: { qualityScore: true },
    });

    const bins = {
      '0.90+': 0,
      '0.80-0.89': 0,
      '0.70-0.79': 0,
      '<0.70': 0,
    };

    enrichments.forEach((e) => {
      const score = e.qualityScore;
      if (score >= 0.9) bins['0.90+']++;
      else if (score >= 0.8) bins['0.80-0.89']++;
      else if (score >= 0.7) bins['0.70-0.79']++;
      else bins['<0.70']++;
    });

    return bins;
  }
}
