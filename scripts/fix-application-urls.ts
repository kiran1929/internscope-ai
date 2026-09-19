import 'dotenv/config';
import { prisma } from '../lib/db';
import {
  fetchSmartRecruitersApplicationUrl,
  isAcceptableApplicationUrl,
  isApiApplicationUrl,
  buildSmartRecruitersJobUrl,
} from '../lib/opportunities/application-url';

function parseSmartRecruitersApiUrl(url: string): { company: string; postingId: string } | null {
  const match = url.match(
    /api\.smartrecruiters\.com\/v1\/companies\/([^/]+)\/postings\/([^/?#]+)/i
  );
  if (!match) return null;
  return { company: match[1], postingId: match[2] };
}

async function main() {
  const opportunities = await prisma.opportunity.findMany({
    where: { isArchived: false },
    select: {
      id: true,
      title: true,
      applicationUrl: true,
      company: { select: { name: true } },
    },
  });

  let fixed = 0;
  let removed = 0;
  let ok = 0;

  for (const opp of opportunities) {
    const url = opp.applicationUrl?.trim() || '';

    if (isAcceptableApplicationUrl(url)) {
      ok++;
      continue;
    }

    if (isApiApplicationUrl(url)) {
      const parsed = parseSmartRecruitersApiUrl(url);
      if (parsed) {
        const resolved =
          (await fetchSmartRecruitersApplicationUrl(parsed.company, parsed.postingId)) ||
          buildSmartRecruitersJobUrl(parsed.company, parsed.postingId);

        if (isAcceptableApplicationUrl(resolved)) {
          await prisma.opportunity.update({
            where: { id: opp.id },
            data: { applicationUrl: resolved },
          });
          console.log(`Fixed SR URL: ${opp.company.name} — ${opp.title}`);
          fixed++;
          continue;
        }
      }
    }

    await deleteOpportunityCascade(opp.id);
    console.log(`Removed invalid URL: ${opp.company.name} — ${opp.title}`);
    console.log(`  ${url}`);
    removed++;
  }

  const remaining = await prisma.opportunity.count({ where: { isArchived: false } });
  console.log(`\nDone. OK: ${ok}, fixed: ${fixed}, removed: ${removed}, remaining: ${remaining}`);
}

async function deleteOpportunityCascade(opportunityId: string) {
  await prisma.jobMatch.deleteMany({ where: { opportunityId } });
  await prisma.opportunityEnrichment.deleteMany({ where: { opportunityId } });
  await prisma.savedOpportunity.deleteMany({ where: { opportunityId } });
  await prisma.application.deleteMany({ where: { opportunityId } });
  await prisma.emailNotification.deleteMany({ where: { opportunityId } });
  await prisma.coverLetter.updateMany({
    where: { opportunityId },
    data: { opportunityId: null },
  });
  await prisma.resumeOptimization.updateMany({
    where: { opportunityId },
    data: { opportunityId: null },
  });
  await prisma.interviewSession.updateMany({
    where: { opportunityId },
    data: { opportunityId: null },
  });
  await prisma.opportunity.delete({ where: { id: opportunityId } });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
