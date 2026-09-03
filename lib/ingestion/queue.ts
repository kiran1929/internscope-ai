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

import { acquireDistributedLock } from './distributed-lock';
import { buildProviderRollups } from './scraper-metrics';
import type { IngestionRunMetrics } from './scraper-metrics-types';
import type { BoardScrapeMetric } from './scraper-metrics-types';

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

    // Distributed lock guard across serverless instances (CRIT-004)
    const lock = await acquireDistributedLock(provider);
    if (!lock.acquired) {
      throw new Error(`Concurrency Lock: A sync job for "${provider}" is currently locked and running on another worker.`);
    }

    if (activeJobs.has(provider)) {
      await lock.release();
      throw new Error(`Concurrency Lock: A sync job for "${provider}" is already active in this instance.`);
    }

    const runningJobs = await JobRepository.findRunning(provider);
    if (runningJobs.length > 0) {
      await lock.release();
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
        const catalogSyncStarted = Date.now();
        appendLog('[Catalog] Syncing scrape company catalog to database...');
        const catalogSync = await syncCatalogToDatabase();
        appendLog(`[Catalog] Upserted ${catalogSync.upserted} companies from catalog.`);

        const purged = await deleteExpiredOpportunities();
        if (purged > 0) {
          appendLog(`[Cleanup] Removed ${purged} expired-deadline opportunities.`);
        }
        const catalogSyncMs = Date.now() - catalogSyncStarted;

        const runPipeline = async (connector: Connector) =>
          runWithRetry(() => runPipelineForConnector(connector));

        let summary: IngestionSummary;
        let boardsSucceeded = 0;
        let boardsFailed = 0;
        let boardMetrics: BoardScrapeMetric[] = [];

        if (provider === 'all') {
          appendLog('[All Sync] Running internship catalog (India + global) across SmartRecruiters, Workday, Greenhouse, Lever, Ashby, and JobVetta');
          const result = await runAllCatalogBoards(runPipeline, appendLog);
          summary = result.summary;
          boardsSucceeded = result.boardsSucceeded;
          boardsFailed = result.boardsFailed;
          boardMetrics = result.boardMetrics;
          result.boardErrors.forEach(({ board, error }) => {
            appendLog(`[Board Error] ${board}: ${error}`);
          });
        } else if (
          provider === 'greenhouse' ||
          provider === 'lever' ||
          provider === 'ashby' ||
          provider === 'smartrecruiters' ||
          provider === 'workday'
        ) {
          appendLog(`[${provider}] Running catalog boards for provider`);
          const result = await runBoardsForProvider(provider as ScrapeProvider, runPipeline, appendLog);
          summary = result.summary;
          boardsSucceeded = result.boardsSucceeded;
          boardsFailed = result.boardsFailed;
          boardMetrics = result.boardMetrics;
          result.boardErrors.forEach(({ board, error }) => {
            appendLog(`[Board Error] ${board}: ${error}`);
          });
        } else if (provider === 'jobvetta') {
          appendLog('[JobVetta] Running JobVetta India internship connector');
          const { JobVettaConnector } = await import('./connectors/jobvetta');
          const connector = new JobVettaConnector();
          if (!connector.isConfigured()) {
            throw new Error('JOBVETTA_API_KEY is not set. Add it to your environment to enable JobVetta.');
          }
          const boardStarted = Date.now();
          summary = await runPipeline(connector);
          boardsSucceeded = 1;
          const durationMsBoard = Date.now() - boardStarted;
          boardMetrics = [
            {
              board: 'JobVetta India',
              provider: 'jobvetta',
              boardToken: 'jobvetta',
              durationMs: durationMsBoard,
              fetched: summary.totalFetched,
              persisted: summary.totalPersisted,
              duplicates: summary.totalDuplicates,
              failed: summary.totalFailed,
              msPerJob:
                summary.totalFetched > 0
                  ? Math.round(durationMsBoard / summary.totalFetched)
                  : 0,
              success: true,
            },
          ];
          appendLog(
            `[JobVetta] Used ${connector.getRequestCount()} API requests; fetched ${summary.totalFetched}, persisted ${summary.totalPersisted}`
          );
        } else if (provider === 'unstop') {
          appendLog('[Unstop] Running Unstop India Campus Connector');
          const { UnstopConnector } = await import('./connectors/unstop');
          summary = await runPipeline(new UnstopConnector());
          boardsSucceeded = 1;
        } else if (provider === 'devfolio') {
          appendLog('[Devfolio] Running Devfolio India Hackathon Connector');
          const { DevfolioConnector } = await import('./connectors/devfolio');
          summary = await runPipeline(new DevfolioConnector());
          boardsSucceeded = 1;
        } else if (provider === 'indian-tech') {
          appendLog('[Indian Tech] Running Indian Tech Unicorns & Research Ecosystem Connector');
          const { IndianTechConnector } = await import('./connectors/indian-tech');
          summary = await runPipeline(new IndianTechConnector());
          boardsSucceeded = 1;
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

        const runMetrics: IngestionRunMetrics = {
          version: 1,
          boardsSucceeded,
          boardsFailed,
          catalogSyncMs,
          purgeExpiredCount: purged,
          boardMetrics,
          providerRollups: buildProviderRollups(boardMetrics),
        };

        await JobRepository.update(dbJob.id, {
          status: JobStatus.COMPLETED,
          finishedAt: new Date(),
          durationMs,
          fetchedCount: summary.totalFetched,
          importedCount: summary.totalPersisted,
          duplicateCount: summary.totalDuplicates,
          failedCount: summary.totalFailed + boardsFailed,
          metrics: runMetrics as unknown as Prisma.InputJsonValue,
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
        await lock.release();
      }
    })();

    return dbJob.id;
  }
}
