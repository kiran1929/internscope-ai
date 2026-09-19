import 'dotenv/config';
/**
 * Fetch India internships from JobVetta (bypasses SCRAPING_ENABLED gate).
 * Requires JOBVETTA_API_KEY. Free tier: 50 requests/day, ≤10 jobs per search.
 *
 * Usage: npx tsx scripts/fetch-jobvetta.ts
 */
import { IngestionPipeline } from '../lib/ingestion/pipeline';
import { JobVettaConnector } from '../lib/ingestion/connectors/jobvetta';

async function main() {
  if (!process.env.JOBVETTA_API_KEY?.trim()) {
    console.error('JOBVETTA_API_KEY is not set. Add it to .env / .env.local first.');
    process.exit(1);
  }

  const connector = new JobVettaConnector();
  console.log(
    `Starting JobVetta internship fetch (max ${process.env.JOBVETTA_MAX_REQUESTS || 40} API requests)...`
  );

  const pipeline = new IngestionPipeline(connector);
  const summary = await pipeline.run();

  console.log('\n=== JobVetta result ===');
  console.log(`API requests used: ${connector.getRequestCount()}`);
  console.log(`Fetched:    ${summary.totalFetched}`);
  console.log(`Persisted:  ${summary.totalPersisted}`);
  console.log(`Duplicates: ${summary.totalDuplicates}`);
  console.log(`Failed:     ${summary.totalFailed}`);
  console.log(
    `Skipped:    ${summary.records.filter((r) => r.status === 'skipped').length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
