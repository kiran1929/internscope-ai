import { GreenhouseConnector } from './connectors/greenhouse';
import { LeverConnector } from './connectors/lever';
import { AshbyConnector } from './connectors/ashby';
import { Connector } from './connector';
import { IngestionPipeline } from './pipeline';
import { defaultScraperSettings } from './config';
import {
  ScrapeBoard,
  ScrapeProvider,
  getCatalogBoardsByProvider,
  buildCareerPageUrl,
} from './company-catalog';
import { IngestionSummary } from './types';

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
}

export async function runBoardsForProvider(
  provider: ScrapeProvider,
  runPipeline: (connector: Connector) => Promise<IngestionSummary>,
  onLog?: (message: string) => void
): Promise<BoardRunResult> {
  const boards = getCatalogBoardsByProvider(provider);
  const summaries: IngestionSummary[] = [];
  const boardErrors: Array<{ board: string; error: string }> = [];
  let boardsSucceeded = 0;
  let boardsFailed = 0;

  const rateLimitMs = defaultScraperSettings[provider].rateLimitMs;

  for (const board of boards) {
    onLog?.(`[${provider}] Scraping ${board.name} (${board.boardToken})`);
    try {
      const connector = createConnector(board);
      const summary = await runPipeline(connector);
      summaries.push(summary);
      boardsSucceeded += 1;
      onLog?.(
        `[${provider}] ${board.name}: fetched ${summary.totalFetched}, persisted ${summary.totalPersisted}`
      );
    } catch (error) {
      boardsFailed += 1;
      const message = error instanceof Error ? error.message : String(error);
      boardErrors.push({ board: board.name, error: message });
      onLog?.(`[${provider}] ${board.name} failed: ${message}`);
    }

    if (rateLimitMs > 0) {
      await sleep(rateLimitMs);
    }
  }

  const summary =
    summaries.length > 0
      ? mergeIngestionSummaries(summaries, provider)
      : {
          sourceId: provider,
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

  return { summary, boardsSucceeded, boardsFailed, boardErrors };
}

export async function runAllCatalogBoards(
  runPipeline: (connector: Connector) => Promise<IngestionSummary>,
  onLog?: (message: string) => void
): Promise<BoardRunResult> {
  const providers: ScrapeProvider[] = ['greenhouse', 'lever', 'ashby'];
  const summaries: IngestionSummary[] = [];
  let boardsSucceeded = 0;
  let boardsFailed = 0;
  const boardErrors: Array<{ board: string; error: string }> = [];

  for (const provider of providers) {
    const result = await runBoardsForProvider(provider, runPipeline, onLog);
    summaries.push(result.summary);
    boardsSucceeded += result.boardsSucceeded;
    boardsFailed += result.boardsFailed;
    boardErrors.push(...result.boardErrors);
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

  return { summary, boardsSucceeded, boardsFailed, boardErrors };
}
