import { GreenhouseConnector } from './connectors/greenhouse';
import { LeverConnector } from './connectors/lever';
import { AshbyConnector } from './connectors/ashby';
import { SmartRecruitersConnector } from './connectors/smartrecruiters';
import { WorkdayConnector } from './connectors/workday';
import { Connector } from './connector';
import { IngestionPipeline } from './pipeline';
import { defaultScraperSettings } from './config';
import {
  ScrapeBoard,
  ScrapeProvider,
  buildCareerPageUrl,
} from './company-catalog';
import { getEffectiveBoardsByProvider } from './dynamic-catalog';
import { IngestionSummary } from './types';
import type { BoardScrapeMetric } from './scraper-metrics-types';
import { JobVettaConnector } from './connectors/jobvetta';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createConnector(board: ScrapeBoard): Connector {
  const shared = {
    boardToken: board.boardToken,
    companyName: board.name,
    websiteUrl: board.websiteUrl,
    careerPageUrl: buildCareerPageUrl(board),
  };

  switch (board.provider) {
    case 'greenhouse':
      return new GreenhouseConnector(shared);
    case 'lever':
      return new LeverConnector(shared);
    case 'ashby':
      return new AshbyConnector(shared);
    case 'smartrecruiters':
      return new SmartRecruitersConnector(shared);
    case 'workday':
      if (!board.tenant || !board.wdServer) {
        throw new Error(`Workday board "${board.name}" is missing tenant or wdServer`);
      }
      return new WorkdayConnector({
        tenant: board.tenant,
        wdServer: board.wdServer,
        site: board.boardToken,
        companyName: board.name,
        websiteUrl: board.websiteUrl,
        careerPageUrl: buildCareerPageUrl(board),
      });
  }
}

export function mergeIngestionSummaries(
  summaries: IngestionSummary[],
  sourceId: string
): IngestionSummary {
  const startTime = summaries.reduce(
    (earliest, summary) => (summary.startTime < earliest ? summary.startTime : earliest),
    summaries[0]?.startTime ?? new Date()
  );
  const endTime = summaries.reduce(
    (latest, summary) => (summary.endTime > latest ? summary.endTime : latest),
    summaries[0]?.endTime ?? new Date()
  );

  return {
    sourceId,
    startTime,
    endTime,
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
}

export interface BoardRunResult {
  summary: IngestionSummary;
  boardsSucceeded: number;
  boardsFailed: number;
  boardErrors: Array<{ board: string; error: string }>;
  boardMetrics: BoardScrapeMetric[];
}

export async function runBoardsForProvider(
  provider: ScrapeProvider,
  runPipeline: (connector: Connector) => Promise<IngestionSummary>,
  onLog?: (message: string) => void
): Promise<BoardRunResult> {
  const boards = await getEffectiveBoardsByProvider(provider);
  const summaries: IngestionSummary[] = [];
  const boardErrors: Array<{ board: string; error: string }> = [];
  const boardMetrics: BoardScrapeMetric[] = [];
  let boardsSucceeded = 0;
  let boardsFailed = 0;

  onLog?.(`[${provider}] Starting run across ${boards.length} configured boards.`);

  for (let i = 0; i < boards.length; i++) {
    const board = boards[i];
    onLog?.(`[${provider}] Scraping ${board.name} (${board.boardToken})`);

    const boardStarted = Date.now();

    try {
      const connector = createConnector(board);
      const summary = await runPipeline(connector);
      summaries.push(summary);
      boardsSucceeded++;
      const durationMs = Date.now() - boardStarted;
      const fetched = summary.totalFetched;
      boardMetrics.push({
        board: board.name,
        provider,
        boardToken: board.boardToken,
        durationMs,
        fetched,
        persisted: summary.totalPersisted,
        duplicates: summary.totalDuplicates,
        failed: summary.totalFailed,
        msPerJob: fetched > 0 ? Math.round(durationMs / fetched) : 0,
        success: true,
      });
      onLog?.(`[${provider}] ${board.name}: fetched ${summary.totalFetched}, persisted ${summary.totalPersisted} (${durationMs}ms)`);
    } catch (error) {
      boardsFailed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      boardErrors.push({ board: board.name, error: errorMsg });
      boardMetrics.push({
        board: board.name,
        provider,
        boardToken: board.boardToken,
        durationMs: Date.now() - boardStarted,
        fetched: 0,
        persisted: 0,
        duplicates: 0,
        failed: 1,
        msPerJob: 0,
        success: false,
        error: errorMsg,
      });
      onLog?.(`[${provider}] ${board.name} failed: ${errorMsg}`);
    }

    if (i < boards.length - 1) {
      const rateLimit =
        defaultScraperSettings[provider as keyof typeof defaultScraperSettings]?.rateLimitMs ?? 1000;
      await sleep(rateLimit);
    }
  }

  const summary =
    summaries.length > 0
      ? mergeIngestionSummaries(summaries, `all_${provider}`)
      : {
          sourceId: `all_${provider}`,
          startTime: new Date(),
          endTime: new Date(),
          totalFetched: 0,
          totalParsed: 0,
          totalNormalized: 0,
          totalMatched: 0,
          totalValidated: 0,
          totalDuplicates: 0,
          totalPersisted: 0,
          totalFailed: 0,
          records: [],
        };

  return { summary, boardsSucceeded, boardsFailed, boardErrors, boardMetrics };
}

export async function runAllCatalogBoards(
  runPipeline: (connector: Connector) => Promise<IngestionSummary>,
  onLog?: (message: string) => void
): Promise<BoardRunResult> {
  const providers: ScrapeProvider[] = [
    'smartrecruiters',
    'workday',
    'greenhouse',
    'lever',
    'ashby',
  ];
  const summaries: IngestionSummary[] = [];
  let boardsSucceeded = 0;
  let boardsFailed = 0;
  const boardErrors: Array<{ board: string; error: string }> = [];
  const boardMetrics: BoardScrapeMetric[] = [];

  // 1. Run ATS Provider Job Boards (SmartRecruiters, Workday, Greenhouse, Lever, Ashby)
  for (const provider of providers) {
    const result = await runBoardsForProvider(provider, runPipeline, onLog);
    summaries.push(result.summary);
    boardsSucceeded += result.boardsSucceeded;
    boardsFailed += result.boardsFailed;
    boardErrors.push(...result.boardErrors);
    boardMetrics.push(...result.boardMetrics);
  }

  // 2. JobVetta India internship index (API-key gated, rate-limited)
  onLog?.('[jobvetta] Running JobVetta India internship connector...');
  const jobvettaStarted = Date.now();
  try {
    const connector = new JobVettaConnector();
    if (!connector.isConfigured()) {
      onLog?.('[jobvetta] Skipped — set JOBVETTA_API_KEY to enable');
    } else {
      const summary = await runPipeline(connector);
      summaries.push(summary);
      boardsSucceeded += 1;
      const durationMs = Date.now() - jobvettaStarted;
      boardMetrics.push({
        board: 'JobVetta India',
        provider: 'jobvetta',
        boardToken: 'jobvetta',
        durationMs,
        fetched: summary.totalFetched,
        persisted: summary.totalPersisted,
        duplicates: summary.totalDuplicates,
        failed: summary.totalFailed,
        msPerJob:
          summary.totalFetched > 0 ? Math.round(durationMs / summary.totalFetched) : 0,
        success: true,
      });
      onLog?.(
        `[jobvetta] Done: fetched ${summary.totalFetched}, persisted ${summary.totalPersisted}, requests used ${connector.getRequestCount()} (${durationMs}ms)`
      );
    }
  } catch (error) {
    boardsFailed += 1;
    const errorMsg = error instanceof Error ? error.message : String(error);
    boardErrors.push({ board: 'JobVetta India', error: errorMsg });
    boardMetrics.push({
      board: 'JobVetta India',
      provider: 'jobvetta',
      boardToken: 'jobvetta',
      durationMs: Date.now() - jobvettaStarted,
      fetched: 0,
      persisted: 0,
      duplicates: 0,
      failed: 1,
      msPerJob: 0,
      success: false,
      error: errorMsg,
    });
    onLog?.(`[jobvetta] Failed: ${errorMsg}`);
  }

  const summary =
    summaries.length > 0
      ? mergeIngestionSummaries(summaries, 'all')
      : {
          sourceId: 'all',
          startTime: new Date(),
          endTime: new Date(),
          totalFetched: 0,
          totalParsed: 0,
          totalNormalized: 0,
          totalMatched: 0,
          totalValidated: 0,
          totalDuplicates: 0,
          totalPersisted: 0,
          totalFailed: 0,
          records: [],
        };

  return { summary, boardsSucceeded, boardsFailed, boardErrors, boardMetrics };
}
