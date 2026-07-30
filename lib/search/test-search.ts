import { SearchService } from './search-service';

async function main() {
  console.log('==========================================');
  console.log('Starting Search & Telemetry Telemetry Test');
  console.log('==========================================');

  // 1. Run autocomplete checks
  console.log('Autocomplete matches for "Strip" (Company):');
  const compMatch = await SearchService.autocomplete('company', 'Strip');
  console.log('->', compMatch);

  console.log('\nAutocomplete matches for "React" (Skill):');
  const skillMatch = await SearchService.autocomplete('skill', 'React');
  console.log('->', skillMatch);

  // 2. Perform test searches to seed telemetry logs
  console.log('\nPerforming query: "React Developer" with filters: remote=Remote');
  const search1 = await SearchService.search({
    query: 'React Developer',
    remoteType: 'Remote',
    limit: 3,
  });
  console.log(`-> Found ${search1.total} matches. Paginated:`, search1.opportunities.map(o => ({
    title: o.title,
    company: o.company.name,
    remote: o.remoteType,
    skills: o.enrichment?.skills || [],
  })));

  console.log('\nPerforming query: "Software Intern" with filters: employmentType=Internship');
  const search2 = await SearchService.search({
    query: 'Software Intern',
    employmentType: 'Internship',
    limit: 3,
  });
  console.log(`-> Found ${search2.total} matches. Paginated:`, search2.opportunities.map(o => ({
    title: o.title,
    company: o.company.name,
    type: o.type,
    skills: o.enrichment?.skills || [],
  })));

  console.log('\nPerforming query: "Python Senior"');
  const search3 = await SearchService.search({
    query: 'Python Senior',
    limit: 2,
  });
  console.log(`-> Found ${search3.total} matches.`);

  // 3. Fetch search stats
  const stats = await SearchService.getSearchStats();
  console.log('\nSearch Telemetry Stats:', stats);

  const trends = await SearchService.getTrendAnalytics();
  console.log('\nGeneral Enriched Trends Analytics:', trends);
  console.log('==========================================');
}

main().catch((err) => {
  console.error('Search test execution script failed:', err);
  process.exit(1);
});
