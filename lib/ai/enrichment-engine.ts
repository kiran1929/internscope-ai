import { prisma } from '../db';
import { Prisma } from '../generated/prisma/client';
import { AIProviderFactory } from './providers';
import { EnrichmentRepository } from '../repositories/enrichment';
import { IngestionLogger } from '../ingestion/logger';
import { scheduleNewOpportunityNotifications } from '../email/new-opportunity-dispatcher';

export class EnrichmentEngine {
  static async enrichOpportunity(opportunityId: string): Promise<boolean> {
    const startTime = Date.now();
    
    // 1. Fetch opportunity
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      console.warn(`[Enrichment] Opportunity not found: ${opportunityId}`);
      return false;
    }

    // 2. Prevent duplicate running (Creates a RUNNING database lock)
    await EnrichmentRepository.createRunning(opportunityId);

    const provider = AIProviderFactory.getProvider();
    
    try {
      IngestionLogger.info(
        'Pipeline',
        `Starting AI enrichment for: "${opportunity.title}" using provider ${provider.name}`,
        opportunityId
      );

      // 3. Invoke LLM / Mock parser
      const result = await provider.enrich(
        opportunity.title,
        opportunity.location,
        opportunity.description || ''
      );

      const latencyMs = Date.now() - startTime;

      // 4. Save COMPLETED results
      await EnrichmentRepository.updateSuccess(opportunityId, {
        skills: result.skills,
        techStack: result.techStack as unknown as Prisma.InputJsonValue,
        experienceLevel: result.experienceLevel,
        employmentType: result.employmentType,
        remoteType: result.remoteType,
        salaryMin: result.salaryMin,
        salaryMax: result.salaryMax,
        salaryCurrency: result.salaryCurrency,
        salaryPeriod: result.salaryPeriod,
        tags: result.tags,
        qualityScore: result.qualityScore,
        reasoning: result.reasoning,
        provider: provider.name,
        model: provider.modelName,
        tokensUsed: result.tokensUsed,
        latencyMs,
        estimatedCost: result.estimatedCost,
      });

      IngestionLogger.info(
        'Pipeline',
        `Successfully enriched opportunity: "${opportunity.title}" (Confidence: ${result.qualityScore}, Cost: $${result.estimatedCost})`,
        opportunityId
      );

      scheduleNewOpportunityNotifications(opportunityId).catch((notifyErr) => {
        console.warn(
          `[Enrichment] Failed to schedule notifications for ${opportunityId}:`,
          notifyErr instanceof Error ? notifyErr.message : notifyErr,
        );
      });

      return true;
    } catch (error) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      console.error(`[Enrichment] Failed for opportunity: ${opportunityId}. Error:`, errObj);

      // 5. Save FAILED state
      await EnrichmentRepository.updateFailure(
        opportunityId,
        errObj.message + '\n' + (errObj.stack || '')
      );

      IngestionLogger.error(
        'Pipeline',
        `Enrichment failed for opportunity: "${opportunity.title}". Error: ${errObj.message}`,
        opportunityId,
        undefined,
        undefined,
        errObj
      );

      scheduleNewOpportunityNotifications(opportunityId).catch((notifyErr) => {
        console.warn(
          `[Enrichment] Failed to schedule fallback notifications for ${opportunityId}:`,
          notifyErr instanceof Error ? notifyErr.message : notifyErr,
        );
      });

      return false;
    }
  }

  static async enrichAllPending(batchSize = 10, rateLimitDelayMs = 1000): Promise<{
    processed: number;
    success: number;
    failed: number;
  }> {
    const pendingIds = await EnrichmentRepository.findPending();
    const idsToProcess = pendingIds.slice(0, batchSize);

    console.log(`[Enrichment] Found ${pendingIds.length} pending opportunities. Processing batch of ${idsToProcess.length}.`);

    let success = 0;
    let failed = 0;

    for (const id of idsToProcess) {
      const isSuccess = await this.enrichOpportunity(id);
      if (isSuccess) success++;
      else failed++;

      // Introduce a slight rate limit throttle delay between LLM calls
      if (idsToProcess.indexOf(id) < idsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, rateLimitDelayMs));
      }
    }

    return {
      processed: idsToProcess.length,
      success,
      failed,
    };
  }
}
