import { JobRepository } from '../repositories/job';
import { JobStatus, Prisma } from '../generated/prisma/client';
import { IngestionPipeline } from './pipeline';
import { EnrichmentEngine } from '../ai/enrichment-engine';
import { GreenhouseConnector } from './connectors/greenhouse';
import { LeverConnector } from './connectors/lever';
import { AshbyConnector } from './connectors/ashby';
import { Connector } from './connector';
import { IngestionSummary } from './types';

// Concurrency locks
const activeJobs = new Set<string>();

async function runWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;

    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Do not retry validation, duplicate, or parse/malformed failures
    const isNonRetryable = 
      errorMsg.includes('Validation') || 
      errorMsg.includes('Duplicate') || 
      errorMsg.includes('Parse error') || 
      errorMsg.includes('Malformed') || 
      errorMsg.includes('missing ID or Title');

    if (isNonRetryable) {
      throw error;
    }

    console.warn(`[Queue] Transient error: "${errorMsg}". Retrying in ${delayMs}ms... (${retries} retries left)`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return runWithRetry(fn, retries - 1, delayMs * 2);
  }
}

export class IngestionQueue {
  static async runJob(provider: string, triggerId?: string): Promise<string> {
    // 1. Concurrency limit / Lock check
    if (activeJobs.has(provider)) {
      throw new Error(`Concurrency Lock: A sync job for "${provider}" is already active.`);
    }

    const runningJobs = await JobRepository.findRunning(provider);
    if (runningJobs.length > 0) {
      throw new Error(`Concurrency Lock: A database record shows "${provider}" sync is already running.`);
    }

    // Set memory/process lock
    activeJobs.add(provider);

    // 2. Persist RUNNING status
    const dbJob = await JobRepository.create(provider, triggerId);

    // Run asynchronously to allow instant status tracking on the dashboard
    (async () => {
      const startTime = Date.now();
      const initialMemory = process.memoryUsage().heapUsed;
      const executionLogs: string[] = [`[Started] Ingestion job for provider "${provider}" at ${new Date().toISOString()}`];

      try {
        let summary: IngestionSummary;

        if (provider === 'all') {
          // Sequentially run all three connectors
          const greenhouse = new GreenhouseConnector();
          const lever = new LeverConnector();
          const ashby = new AshbyConnector();

          const summaries: IngestionSummary[] = [];

          executionLogs.push('[All Sync] Executing Greenhouse connector');
          summaries.push(await runWithRetry(async () => {
            const pipeline = new IngestionPipeline(greenhouse);
            return pipeline.run();
          }));

          executionLogs.push('[All Sync] Executing Lever connector');
          summaries.push(await runWithRetry(async () => {
            const pipeline = new IngestionPipeline(lever);
            return pipeline.run();
          }));

          executionLogs.push('[All Sync] Executing Ashby connector');
          summaries.push(await runWithRetry(async () => {
            const pipeline = new IngestionPipeline(ashby);
            return pipeline.run();
          }));

          // Consolidate summaries
          summary = {
            sourceId: 'all',
            startTime: new Date(startTime),
            endTime: new Date(),
            totalFetched: summaries.reduce((acc, s) => acc + s.totalFetched, 0),
            totalParsed: summaries.reduce((acc, s) => acc + s.totalParsed, 0),
            totalNormalized: summaries.reduce((acc, s) => acc + s.totalNormalized, 0),
            totalMatched: summaries.reduce((acc, s) => acc + s.totalMatched, 0),
            totalValidated: summaries.reduce((acc, s) => acc + s.totalValidated, 0),
            totalDuplicates: summaries.reduce((acc, s) => acc + s.totalDuplicates, 0),
            totalPersisted: summaries.reduce((acc, s) => acc + s.totalPersisted, 0),
            totalFailed: summaries.reduce((acc, s) => acc + s.totalFailed, 0),
            records: summaries.flatMap((s) => s.records),
          };
        } else {
          // Run single connector
          let connector: Connector;
          if (provider === 'greenhouse') {
            connector = new GreenhouseConnector();
          } else if (provider === 'lever') {
            connector = new LeverConnector();
          } else if (provider === 'ashby') {
            connector = new AshbyConnector();
          } else {
            throw new Error(`Unsupported provider: "${provider}"`);
          }

          executionLogs.push(`[Connector Sync] Running ${provider} pipeline`);
          summary = await runWithRetry(async () => {
            const pipeline = new IngestionPipeline(connector);
            return pipeline.run();
          });
        }

        const endTime = Date.now();
        const durationMs = endTime - startTime;
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryUsedMb = Math.round((finalMemory - initialMemory) / 1024 / 1024 * 100) / 100;

        // Collect validation errors
        const validationFailures = summary.records
          .filter((r) => r.validation && !r.validation.isValid)
          .map((r) => ({
            title: r.parsed?.title || 'Unknown Opportunity',
            errors: r.validation?.errors || [],
          }));

        executionLogs.push(`[Completed] Job completed in ${durationMs}ms. Memory usage change: ${memoryUsedMb}MB`);

        // Persist COMPLETED status
        await JobRepository.update(dbJob.id, {
          status: JobStatus.COMPLETED,
          finishedAt: new Date(),
          durationMs,
          fetchedCount: summary.totalFetched,
          importedCount: summary.totalPersisted,
          duplicateCount: summary.totalDuplicates,
          failedCount: summary.totalFailed,
          validationErrors: summary.records
            .filter((r) => r.validation && !r.validation.isValid)
            .map((r) => ({
              title: r.parsed?.title || 'Unknown Opportunity',
              errors: r.validation?.errors || [],
            })) as Prisma.InputJsonValue,
          logs: executionLogs as Prisma.InputJsonValue,
        });

        // Trigger AI Enrichment asynchronously in the background for any pending items
        (async () => {
          try {
            console.log('[Queue] Triggering post-ingestion AI data enrichment task...');
            const enrichResult = await EnrichmentEngine.enrichAllPending(50, 1000);
            console.log(`[Queue] Post-ingestion enrichment complete. Success: ${enrichResult.success}, Failed: ${enrichResult.failed}`);
          } catch (enrichErr) {
            console.error('[Queue] Post-ingestion AI enrichment failed to trigger:', enrichErr);
          }
        })();

      } catch (err) {
        const endTime = Date.now();
        const durationMs = endTime - startTime;
        const errObj = err instanceof Error ? err : new Error(String(err));
        executionLogs.push(`[Failed] Job aborted due to error: ${errObj.message}`);

        // Persist FAILED status
        await JobRepository.update(dbJob.id, {
          status: JobStatus.FAILED,
          finishedAt: new Date(),
          durationMs,
          error: errObj.message + '\n' + (errObj.stack || ''),
          logs: executionLogs as Prisma.InputJsonValue,
        });
      } finally {
        activeJobs.delete(provider);
      }
    })();

    return dbJob.id;
  }
}
