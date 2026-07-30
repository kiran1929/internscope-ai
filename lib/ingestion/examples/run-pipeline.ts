import { prisma } from '../../db';
import { GreenhouseConnector } from '../greenhouse-connector';
import { IngestionPipeline } from '../pipeline';

async function main() {
  console.log('Ingestion Engine - Integration Test Runner');
  console.log('==========================================');

  // 1. Ensure Stripe company exists in the database for matching to succeed
  console.log('Checking database seed constraints...');
  let stripe = await prisma.company.findUnique({
    where: { name: 'Stripe' },
  });

  if (!stripe) {
    stripe = await prisma.company.create({
      data: {
        name: 'Stripe',
        websiteUrl: 'https://stripe.com',
        linkedinUrl: 'https://linkedin.com/company/stripe',
        industry: 'Fintech',
        description: 'Financial infrastructure for the internet.',
        isVerified: true,
        hiringStatus: 'HIRING',
      },
    });
    console.log(`Created Stripe company record in database: ${stripe.id}`);
  } else {
    console.log(`Stripe company record verified with ID: ${stripe.id}`);
  }

  // 2. Instantiate Connector and Pipeline
  const connector = new GreenhouseConnector();
  const pipeline = new IngestionPipeline(connector);

  console.log('\nExecuting Ingestion Pipeline...');
  const summary = await pipeline.run();

  console.log('\n==========================================');
  console.log('Ingestion Summary Results:');
  console.log(`- Fetch Count:      ${summary.totalFetched}`);
  console.log(`- Parse Count:      ${summary.totalParsed}`);
  console.log(`- Normalize Count:  ${summary.totalNormalized}`);
  console.log(`- Match Count:      ${summary.totalMatched}`);
  console.log(`- Validation Count: ${summary.totalValidated}`);
  console.log(`- Duplicates:       ${summary.totalDuplicates}`);
  console.log(`- Persisted:        ${summary.totalPersisted}`);
  console.log(`- Failed Count:     ${summary.totalFailed}`);
  console.log('==========================================');
  console.log('Detailed records output:');
  summary.records.forEach((r, idx) => {
    console.log(`\n[Record ${idx + 1}] External ID: ${r.raw.externalJobId}`);
    console.log(`- Title:   ${r.parsed?.title || 'N/A'}`);
    console.log(`- Status:  ${r.status.toUpperCase()}`);
    if (r.errors.length > 0) {
      console.log(`- Errors:  ${r.errors.join('; ')}`);
    }
    if (r.match?.companyId) {
      console.log(`- Company: ${r.normalized?.companyName} (Matched ID: ${r.match.companyId})`);
    }
    if (r.duplicate?.isDuplicate) {
      console.log(`- Reason:  ${r.duplicate.message}`);
    }
  });
}

main()
  .catch((err) => {
    console.error('Test script runner encountered critical exception:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
