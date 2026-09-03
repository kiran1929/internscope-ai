import 'dotenv/config';
/**
 * Fetch India internships from all ATS vendors (bypasses SCRAPING_ENABLED gate).
 * Pipeline already enforces: India location + internship-only + INTERNSHIP type.
 *
 * Usage:
 *   npx tsx scripts/fetch-india-ats.ts
 *   npx tsx scripts/fetch-india-ats.ts all
 *   npx tsx scripts/fetch-india-ats.ts greenhouse
 *   npx tsx scripts/fetch-india-ats.ts lever|ashby|smartrecruiters|workday
 */
import { syncCatalogToDatabase } from '../lib/ingestion/catalog-sync';
import { runBoardsForProvider } from '../lib/ingestion/board-runner';
import { IngestionPipeline } from '../lib/ingestion/pipeline';
import { Connector } from '../lib/ingestion/connector';
import {
  getCatalogBoardsByProvider,
  getCatalogCompanyCount,
  type ScrapeProvider,
} from '../lib/ingestion/company-catalog';
import { prisma } from '../lib/db';
import { OpportunityType } from '../lib/generated/prisma/enums';

const ALL_PROVIDERS: ScrapeProvider[] = [
  'smartrecruiters',
  'workday',
  'greenhouse',
  'lever',
  'ashby',
];

const providerArg = (process.argv[2] || 'all').toLowerCase();

const providers: ScrapeProvider[] =
  providerArg === 'all'
    ? ALL_PROVIDERS
    : ALL_PROVIDERS.includes(providerArg as ScrapeProvider)
      ? [providerArg as ScrapeProvider]
      : [];

if (providers.length === 0) {
  console.error(
    'Usage: npx tsx scripts/fetch-india-ats.ts [all|greenhouse|lever|ashby|smartrecruiters|workday]'
  );
  process.exit(1);
}

async function runPipeline(connector: Connector) {
  const pipeline = new IngestionPipeline(connector);
  return pipeline.run();
}

async function printDbCounts(label: string) {
  const total = await prisma.opportunity.count({ where: { isArchived: false } });
  const internships = await prisma.opportunity.count({
    where: { isArchived: false, type: OpportunityType.INTERNSHIP },
  });
  const nonInternships = await prisma.opportunity.count({
    where: { isArchived: false, type: { not: OpportunityType.INTERNSHIP } },
  });
  console.log(
    `\n[${label}] Active opportunities: ${total} | Internships: ${internships} | Non-internships: ${nonInternships}`
  );
}

async function main() {
  console.log('=== InternScope ATS Sync (internships only — India + global) ===');
  console.log(`Catalog boards: ${getCatalogCompanyCount()}`);
  for (const p of ALL_PROVIDERS) {
    console.log(`  - ${p}: ${getCatalogBoardsByProvider(p).length} boards`);
  }
  console.log(`Providers this run: ${providers.join(', ')}`);

  console.log('\nSyncing catalog to database...');
  const sync = await syncCatalogToDatabase();
  console.log(`Catalog sync: ${sync.upserted} companies.`);

  await printDbCounts('before');

  let totalFetched = 0;
  let totalPersisted = 0;
  let totalDuplicates = 0;
  let boardsSucceeded = 0;
  let boardsFailed = 0;

  // ATS boards only (Greenhouse, Lever, Ashby, SmartRecruiters, Workday)
  for (const provider of providers) {
    console.log(
      `\n=== Fetching ${provider} (${getCatalogBoardsByProvider(provider).length} boards) ===`
    );
    console.log('Pipeline keeps internship roles only (all locations).\n');

    const result = await runBoardsForProvider(provider, runPipeline, console.log);
    totalFetched += result.summary.totalFetched;
    totalPersisted += result.summary.totalPersisted;
    totalDuplicates += result.summary.totalDuplicates;
    boardsSucceeded += result.boardsSucceeded;
    boardsFailed += result.boardsFailed;
    console.log(
      `[${provider}] Done: fetched ${result.summary.totalFetched}, persisted ${result.summary.totalPersisted}, failed boards ${result.boardsFailed}`
    );
  }

  // Safety purge: remove any non-internship rows that slipped in historically
  const purged = await prisma.opportunity.deleteMany({
    where: { type: { not: OpportunityType.INTERNSHIP } },
  });
  if (purged.count > 0) {
    console.log(`\nPurged ${purged.count} non-internship opportunities.`);
  }

  console.log('\n=== Sync complete ===');
  console.log(`Boards succeeded: ${boardsSucceeded}`);
  console.log(`Boards failed:    ${boardsFailed}`);
  console.log(`Fetched (raw):    ${totalFetched}`);
  console.log(`Persisted (new):  ${totalPersisted}`);
  console.log(`Duplicates:       ${totalDuplicates}`);
  await printDbCounts('after');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
