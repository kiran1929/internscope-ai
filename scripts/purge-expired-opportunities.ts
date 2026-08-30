import 'dotenv/config';
import { deleteExpiredOpportunities } from '../lib/opportunities/purge-expired';

async function main() {
  const removed = await deleteExpiredOpportunities();
  console.log(`Removed ${removed} expired-deadline opportunities.`);
}

main().catch((error) => {
  console.error('Purge failed:', error);
  process.exit(1);
});
