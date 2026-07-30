import { EnrichmentEngine } from './enrichment-engine';
import { EnrichmentRepository } from '../repositories/enrichment';

async function main() {
  console.log('==========================================');
  console.log('Starting AI Opportunity Enrichment Test Run');
  console.log('==========================================');

  // Fetch initial enrichment stats
  const beforeStats = await EnrichmentRepository.getEnrichmentStats();
  console.log('Initial Enrichment Stats:', beforeStats);

  if (beforeStats.pending === 0) {
    console.log('No pending opportunities to enrich. Exiting.');
    return;
  }

  console.log(`Processing batch of 5 opportunities...`);
  const result = await EnrichmentEngine.enrichAllPending(5, 500);
  console.log('Batch Ingestion Processing Completed:', result);

  // Fetch updated stats
  const afterStats = await EnrichmentRepository.getEnrichmentStats();
  console.log('Final Enrichment Stats:', afterStats);

  const confidenceDist = await EnrichmentRepository.getConfidenceDistribution();
  console.log('Confidence Bins Distribution:', confidenceDist);
  console.log('==========================================');
}

main().catch((err) => {
  console.error('Enrichment execution test script failed:', err);
  process.exit(1);
});
