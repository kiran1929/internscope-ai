import { JobRepository } from '../repositories/job';
import { JobStatus, Prisma } from '../generated/prisma/client';
import { IngestionPipeline } from './pipeline';
import { EnrichmentEngine } from '../ai/enrichment-engine';
import { Connector } from './connector';
import { IngestionSummary } from './types';
import { syncCatalogToDatabase } from './catalog-sync';
import { deleteExpiredOpportunities } from '../opportunities/purge-expired';
import {
  runAllCatalogBoards,
  runBoardsForProvider,
} from './board-runner';
import { ScrapeProvider } from './company-catalog';
import { isScrapingEnabled, SCRAPING_DISABLED_MESSAGE } from './scraper-config';

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

function runPipelineForConnector(connector: Connector) {
  const pipeline = new IngestionPipeline(connector);
  return pipeline.run();
}

export class IngestionQueue {
  static async runJob(provider: string, triggerId?: string): Promise<string> {
    if (!isScrapingEnabled()) {
      throw new Error(SCRAPING_DISABLED_MESSAGE);
    }

    if (activeJobs.has(provider)) {
      throw new Error(`Concurrency Lock: A sync job for "${provider}" is already active.`);
    }

    const runningJobs = await JobRepository.findRunning(provider);
    if (runningJobs.length > 0) {
      throw new Error(`Concurrency Lock: A database record shows "${provider}" sync is already running.`);
    }

    activeJobs.add(provider);
    const dbJob = await JobRepository.create(provider, triggerId);

    (async () => {
      const startTime = Date.now();
      const initialMemory = process.memoryUsage().heapUsed;
      const executionLogs: string[] = [`[Started] Ingestion job for provider "${provider}" at ${new Date().toISOString()}`];

      const appendLog = (message: string) => {
        executionLogs.push(message);
      };

      try {
        appendLog('[Catalog] Syncing scrape company catalog to database...');
        const catalogSync = await syncCatalogToDatabase();
        appendLog(`[Catalog] Upserted ${catalogSync.upserted} companies from catalog.`);

        const purged = await deleteExpiredOpportunities();
        if (purged > 0) {
          appendLog(`[Cleanup] Removed ${purged} expired-deadline opportunities.`);
        }

        const runPipeline = async (connector: Connector) =>
          runWithRetry(() => runPipelineForConnector(connector));

        let summary: IngestionSummary;
        let boardsSucceeded = 0;
        let boardsFailed = 0;

        if (provider === 'all') {
          appendLog('[All Sync] Running full catalog across Greenhouse, Lever, and Ashby');
          const result = await runAllCatalogBoards(runPipeline, appendLog);
          summary = result.summary;
          boardsSucceeded = result.boardsSucceeded;
          boardsFailed = result.boardsFailed;
          result.boardErrors.forEach(({ board, error }) => {
            appendLog(`[Board Error] ${board}: ${error}`);
          });
        } else if (provider === 'greenhouse' || provider === 'lever' || provider === 'ashby') {
          appendLog(`[${provider}] Running catalog boards for provider`);
          const result = await runBoardsForProvider(provider as ScrapeProvider, runPipeline, appendLog);
          summary = result.summary;
          boardsSucceeded = result.boardsSucceeded;
          boardsFailed = result.boardsFailed;
          result.boardErrors.forEach(({ board, error }) => {
            appendLog(`[Board Error] ${board}: ${error}`);
          });
        } else {
          throw new Error(`Unsupported provider: "${provider}"`);
        }

        appendLog(
          `[Boards] Completed ${boardsSucceeded} boards successfully, ${boardsFailed} boards failed.`
        );

        const endTime = Date.now();
        const durationMs = endTime - startTime;
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryUsedMb = Math.round(((finalMemory - initialMemory) / 1024 / 1024) * 100) / 100;

        executionLogs.push(`[Completed] Job completed in ${durationMs}ms. Memory usage change: ${memoryUsedMb}MB`);

        await JobRepository.update(dbJob.id, {
          status: JobStatus.COMPLETED,
          finishedAt: new Date(),
          durationMs,
          fetchedCount: summary.totalFetched,
          importedCount: summary.totalPersisted,
          duplicateCount: summary.totalDuplicates,
          failedCount: summary.totalFailed + boardsFailed,
          validationErrors: summary.records
            .filter((r) => r.validation && !r.validation.isValid)
            .map((r) => ({
              title: r.parsed?.title || 'Unknown Opportunity',
              errors: r.validation?.errors || [],
            })) as Prisma.InputJsonValue,
          logs: executionLogs as Prisma.InputJsonValue,
        });

        (async () => {
          try {
            console.log('[Queue] Triggering post-ingestion AI data enrichment task...');
            const enrichResult = await EnrichmentEngine.drainAllPending();
            console.log(
              `[Queue] Post-ingestion enrichment drain complete. Processed: ${enrichResult.processed}, success: ${enrichResult.success}, failed: ${enrichResult.failed}, remaining: ${enrichResult.remaining}`,
            );
          } catch (enrichErr) {
            console.error('[Queue] Post-ingestion AI enrichment failed to trigger:', enrichErr);
          }
        })();
      } catch (err) {
        const endTime = Date.now();
        const durationMs = endTime - startTime;
        const errObj = err instanceof Error ? err : new Error(String(err));
        executionLogs.push(`[Failed] Job aborted due to error: ${errObj.message}`);

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
