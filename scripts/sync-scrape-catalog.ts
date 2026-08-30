import 'dotenv/config';
import { syncCatalogToDatabase, getCatalogCompanyCount } from '../lib/ingestion/catalog-sync';

async function main() {
  console.log(`Syncing ${getCatalogCompanyCount()} scrape catalog companies to database...`);
  const result = await syncCatalogToDatabase();
  console.log(`Done. Upserted ${result.upserted} companies.`);
}

main().catch((error) => {
  console.error('Catalog sync failed:', error);
  process.exit(1);
});
