import { prisma } from '../lib/db';

async function removeAllOpportunities() {
  console.log('Starting full deletion of all opportunities...');

  console.log('1. Deleting JobMatches...');
  const deletedJobMatches = await prisma.jobMatch.deleteMany({});
  console.log(`Deleted ${deletedJobMatches.count} job matches.`);

  console.log('2. Deleting OpportunityEnrichments...');
  const deletedEnrichments = await prisma.opportunityEnrichment.deleteMany({});
  console.log(`Deleted ${deletedEnrichments.count} enrichments.`);

  console.log('3. Deleting SavedOpportunities...');
  const deletedSaved = await prisma.savedOpportunity.deleteMany({});
  console.log(`Deleted ${deletedSaved.count} saved opportunities.`);

  console.log('4. Deleting Applications...');
  const deletedApplications = await prisma.application.deleteMany({});
  console.log(`Deleted ${deletedApplications.count} applications.`);

  console.log('5. Unlinking nullable relationships...');
  const unlinkedCoverLetters = await prisma.coverLetter.updateMany({
    where: { opportunityId: { not: null } },
    data: { opportunityId: null },
  });
  console.log(`Unlinked ${unlinkedCoverLetters.count} cover letters.`);

  const unlinkedResumeOpts = await prisma.resumeOptimization.updateMany({
    where: { opportunityId: { not: null } },
    data: { opportunityId: null },
  });
  console.log(`Unlinked ${unlinkedResumeOpts.count} resume optimizations.`);

  const unlinkedInterviews = await prisma.interviewSession.updateMany({
    where: { opportunityId: { not: null } },
    data: { opportunityId: null },
  });
  console.log(`Unlinked ${unlinkedInterviews.count} interview sessions.`);

  const deletedEmailNotifs = await prisma.emailNotification.deleteMany({
    where: { opportunityId: { not: null } },
  });
  console.log(`Deleted ${deletedEmailNotifs.count} opportunity email notifications.`);

  console.log('6. Deleting all Opportunities...');
  const deletedOpportunities = await prisma.opportunity.deleteMany({});
  console.log(`Deleted ${deletedOpportunities.count} opportunities.`);

  const remainingOpps = await prisma.opportunity.count();
  console.log('Verification: Remaining opportunities in database:', remainingOpps);
}

removeAllOpportunities()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error deleting opportunities:', err);
    process.exit(1);
  });
