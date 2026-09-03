import 'dotenv/config';
import { prisma } from '../lib/db';
import { OpportunityType } from '../lib/generated/prisma/enums';

async function purgeNonInternships() {
  const nonInternships = await prisma.opportunity.findMany({
    where: { type: { not: OpportunityType.INTERNSHIP } },
    select: { id: true, title: true, type: true },
  });

  if (nonInternships.length === 0) {
    console.log('No non-internship opportunities to remove.');
    return;
  }

  console.log(`Removing ${nonInternships.length} non-internship opportunities...`);
  const ids = nonInternships.map((o) => o.id);

  await prisma.jobMatch.deleteMany({ where: { opportunityId: { in: ids } } });
  await prisma.opportunityEnrichment.deleteMany({ where: { opportunityId: { in: ids } } });
  await prisma.savedOpportunity.deleteMany({ where: { opportunityId: { in: ids } } });
  await prisma.application.deleteMany({ where: { opportunityId: { in: ids } } });
  await prisma.emailNotification.deleteMany({ where: { opportunityId: { in: ids } } });
  await prisma.coverLetter.updateMany({
    where: { opportunityId: { in: ids } },
    data: { opportunityId: null },
  });
  await prisma.resumeOptimization.updateMany({
    where: { opportunityId: { in: ids } },
    data: { opportunityId: null },
  });
  await prisma.interviewSession.updateMany({
    where: { opportunityId: { in: ids } },
    data: { opportunityId: null },
  });

  const deleted = await prisma.opportunity.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`Deleted ${deleted.count} opportunities.`);
  const remaining = await prisma.opportunity.count();
  const internships = await prisma.opportunity.count({
    where: { type: OpportunityType.INTERNSHIP },
  });
  console.log(`Remaining: ${remaining} total (${internships} internships).`);
}

purgeNonInternships()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Purge failed:', err);
    process.exit(1);
  });
