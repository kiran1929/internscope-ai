import { prisma } from '../../db';
import { GreenhouseConnector } from '../connectors/greenhouse';
import { LeverConnector } from '../connectors/lever';
import { AshbyConnector } from '../connectors/ashby';
import { IngestionPipeline } from '../pipeline';
import { Connector } from '../connector';

async function seedCompany(name: string, website: string) {
  let company = await prisma.company.findUnique({
    where: { name },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name,
        websiteUrl: website,
        isVerified: true,
        hiringStatus: 'HIRING',
      },
    });
    console.log(`Seeded company: ${name} (ID: ${company.id})`);
  } else {
    console.log(`Verified company exists: ${name} (ID: ${company.id})`);
  }
}

async function runPipelineForConnector(connector: Connector) {
  console.log(`\n==========================================`);
  console.log(`Starting connector pipeline: ${connector.metadata.name}`);
  console.log(`Target endpoint: ${connector.metadata.url}`);
  console.log(`==========================================`);

  const pipeline = new IngestionPipeline(connector);
  const summary = await pipeline.run();

  console.log(`Pipeline Sync Complete:`);
  console.log(`- Fetched:    ${summary.totalFetched}`);
  console.log(`- Parsed:     ${summary.totalParsed}`);
  console.log(`- Matched:    ${summary.totalMatched}`);
  console.log(`- Validated:  ${summary.totalValidated}`);
  console.log(`- Duplicates: ${summary.totalDuplicates}`);
  console.log(`- Persisted:  ${summary.totalPersisted}`);
  console.log(`- Failed:     ${summary.totalFailed}`);
  
  if (summary.records.length > 0) {
    console.log('\nSample Ingestion Trace (Top 3):');
    summary.records.slice(0, 3).forEach((r, idx) => {
      console.log(`  [Record ${idx + 1}] ID: ${r.raw.externalJobId} | Title: "${r.parsed?.title || 'N/A'}" | Status: ${r.status.toUpperCase()}`);
      if (r.errors.length > 0) {
        console.log(`    Errors: ${r.errors.join('; ')}`);
      }
    });
  }
}

async function main() {
  console.log('Ingestion Engine - Full Connector Integration Tester');
  console.log('====================================================');

  // 1. Seed companies
  await seedCompany('Stripe', 'https://stripe.com');
  await seedCompany('Spotify', 'https://spotify.com');
  await seedCompany('Linear', 'https://linear.app');

  // 2. Initialize connectors
  const greenhouse = new GreenhouseConnector();
  const lever = new LeverConnector();
  const ashby = new AshbyConnector();

  // 3. Run pipelines sequentially to avoid database locking or connection overload
  await runPipelineForConnector(greenhouse);
  await runPipelineForConnector(lever);
  await runPipelineForConnector(ashby);
}

main()
  .catch((err) => {
    console.error('Integration runner critical failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
