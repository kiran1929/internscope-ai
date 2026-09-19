import { IngestionPipeline } from '../lib/ingestion/pipeline';
import { GreenhouseConnector } from '../lib/ingestion/connectors/greenhouse';
import { LeverConnector } from '../lib/ingestion/connectors/lever';
import { AshbyConnector } from '../lib/ingestion/connectors/ashby';
import { SmartRecruitersConnector } from '../lib/ingestion/connectors/smartrecruiters';
import { UnstopConnector } from '../lib/ingestion/connectors/unstop';
import { DevfolioConnector } from '../lib/ingestion/connectors/devfolio';
import { IndianTechConnector } from '../lib/ingestion/connectors/indian-tech';
import { EnrichmentEngine } from '../lib/ai/enrichment-engine';
import { prisma } from '../lib/db';
import { getEffectiveBoardsByProvider } from '../lib/ingestion/dynamic-catalog';
import { buildCareerPageUrl } from '../lib/ingestion/company-catalog';

async function main() {
  console.log('🇮🇳 Starting Comprehensive Multi-Pipeline Ingestion for India (Pure Tech Internships & Student Programs)...');

  const results: Array<{ name: string; fetched: number; persisted: number; failed: number }> = [];

  // 1. Run Indian Tech Ecosystem Connector
  console.log('\n--- [Pipeline 1/7] Running Indian Tech Ecosystem, Startups & GCCs Connector ---');
  const indTechConnector = new IndianTechConnector();
  const indTechPipeline = new IngestionPipeline(indTechConnector);
  const indTechSummary = await indTechPipeline.run();
  results.push({
    name: 'Indian Tech Ecosystem & Unicorns',
    fetched: indTechSummary.totalFetched,
    persisted: indTechSummary.totalPersisted,
    failed: indTechSummary.totalFailed,
  });

  // 2. Run Unstop India Connector
  console.log('\n--- [Pipeline 2/7] Running Unstop India (Campus Challenges, Hackathons & Internships) ---');
  const unstopConnector = new UnstopConnector();
  const unstopPipeline = new IngestionPipeline(unstopConnector);
  const unstopSummary = await unstopPipeline.run();
  results.push({
    name: 'Unstop India Campus Challenges',
    fetched: unstopSummary.totalFetched,
    persisted: unstopSummary.totalPersisted,
    failed: unstopSummary.totalFailed,
  });

  // 3. Run Devfolio India Connector
  console.log('\n--- [Pipeline 3/7] Running Devfolio India (Student Hackathons & Fellowships) ---');
  const devfolioConnector = new DevfolioConnector();
  const devfolioPipeline = new IngestionPipeline(devfolioConnector);
  const devfolioSummary = await devfolioPipeline.run();
  results.push({
    name: 'Devfolio India Hackathons',
    fetched: devfolioSummary.totalFetched,
    persisted: devfolioSummary.totalPersisted,
    failed: devfolioSummary.totalFailed,
  });

  // 4. Run SmartRecruiters India Boards
  console.log('\n--- [Pipeline 4/7] Running SmartRecruiters ATS Boards (India Hubs) ---');
  const srBoards = await getEffectiveBoardsByProvider('smartrecruiters');
  let srFetched = 0, srPersisted = 0, srFailed = 0;
  for (const board of srBoards) {
    try {
      const conn = new SmartRecruitersConnector({
        boardToken: board.boardToken,
        companyName: board.name,
        websiteUrl: board.websiteUrl,
        careerPageUrl: buildCareerPageUrl(board),
      });
      const pipe = new IngestionPipeline(conn);
      const sum = await pipe.run();
      srFetched += sum.totalFetched;
      srPersisted += sum.totalPersisted;
      srFailed += sum.totalFailed;
    } catch {
      srFailed++;
    }
  }
  results.push({
    name: `SmartRecruiters (${srBoards.length} boards)`,
    fetched: srFetched,
    persisted: srPersisted,
    failed: srFailed,
  });

  // 5. Run Live Greenhouse Boards (India Filter Active)
  console.log('\n--- [Pipeline 5/7] Running Greenhouse Job Boards (India Location Filter) ---');
  const ghBoards = await getEffectiveBoardsByProvider('greenhouse');
  let ghFetched = 0, ghPersisted = 0, ghFailed = 0;
  for (const board of ghBoards) {
    try {
      const conn = new GreenhouseConnector({
        boardToken: board.boardToken,
        companyName: board.name,
        websiteUrl: board.websiteUrl,
        careerPageUrl: buildCareerPageUrl(board),
      });
      const pipe = new IngestionPipeline(conn);
      const sum = await pipe.run();
      ghFetched += sum.totalFetched;
      ghPersisted += sum.totalPersisted;
      ghFailed += sum.totalFailed;
    } catch {
      ghFailed++;
    }
  }
  results.push({
    name: `Greenhouse Boards (${ghBoards.length} boards)`,
    fetched: ghFetched,
    persisted: ghPersisted,
    failed: ghFailed,
  });

  // 6. Run Live Lever Boards (India Filter Active)
  console.log('\n--- [Pipeline 6/7] Running Lever Job Boards (India Location Filter) ---');
  const leverBoards = await getEffectiveBoardsByProvider('lever');
  let leverFetched = 0, leverPersisted = 0, leverFailed = 0;
  for (const board of leverBoards) {
    try {
      const conn = new LeverConnector({
        boardToken: board.boardToken,
        companyName: board.name,
        websiteUrl: board.websiteUrl,
        careerPageUrl: buildCareerPageUrl(board),
      });
      const pipe = new IngestionPipeline(conn);
      const sum = await pipe.run();
      leverFetched += sum.totalFetched;
      leverPersisted += sum.totalPersisted;
      leverFailed += sum.totalFailed;
    } catch {
      leverFailed++;
    }
  }
  results.push({
    name: `Lever Boards (${leverBoards.length} boards)`,
    fetched: leverFetched,
    persisted: leverPersisted,
    failed: leverFailed,
  });

  // 7. Run Live Ashby Boards (India Filter Active)
  console.log('\n--- [Pipeline 7/7] Running Ashby Job Boards (India Location Filter) ---');
  const ashbyBoards = await getEffectiveBoardsByProvider('ashby');
  let ashbyFetched = 0, ashbyPersisted = 0, ashbyFailed = 0;
  for (const board of ashbyBoards) {
    try {
      const conn = new AshbyConnector({
        boardToken: board.boardToken,
        companyName: board.name,
        websiteUrl: board.websiteUrl,
        careerPageUrl: buildCareerPageUrl(board),
      });
      const pipe = new IngestionPipeline(conn);
      const sum = await pipe.run();
      ashbyFetched += sum.totalFetched;
      ashbyPersisted += sum.totalPersisted;
      ashbyFailed += sum.totalFailed;
    } catch {
      ashbyFailed++;
    }
  }
  results.push({
    name: `Ashby Boards (${ashbyBoards.length} boards)`,
    fetched: ashbyFetched,
    persisted: ashbyPersisted,
    failed: ashbyFailed,
  });

  console.log('\n================ INGESTION RESULTS ================');
  console.table(results);

  // 8. Run AI Enrichment Drain
  console.log('\n🧠 Draining AI Enrichment Queue for newly ingested opportunities...');
  const enrichResult = await EnrichmentEngine.drainAllPending();
  console.log(`✓ AI Enrichment complete! Processed: ${enrichResult.processed}, Success: ${enrichResult.success}, Failed: ${enrichResult.failed}`);

  // 9. Output Final Opportunity Metrics
  const totalOpps = await prisma.opportunity.count();
  const totalEnriched = await prisma.opportunityEnrichment.count({ where: { status: 'COMPLETED' } });
  const totalPending = await prisma.opportunity.count({
    where: { isArchived: false, OR: [{ enrichment: null }, { enrichment: { status: 'FAILED' } }] },
  });
  const internships = await prisma.opportunity.count({ where: { type: 'INTERNSHIP' } });
  const hackathons = await prisma.opportunity.count({ where: { type: 'HACKATHON' } });
  const fellowships = await prisma.opportunity.count({ where: { type: 'FELLOWSHIP' } });
  const research = await prisma.opportunity.count({ where: { type: 'RESEARCH' } });

  console.log('\n================ FINAL DATABASE STATUS ================');
  console.log({
    totalOpportunitiesInIndia: totalOpps,
    internships,
    hackathons,
    fellowships,
    research,
    completedEnrichments: totalEnriched,
    pendingEnrichment: totalPending,
  });
}

main().catch(console.error);
