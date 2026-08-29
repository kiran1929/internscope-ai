import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import { isDirectApplicationUrl } from '../lib/email/application-url-utils';
import { getPgConnectionString } from '../lib/db-connection';

const pool = new pg.Pool({ connectionString: getPgConnectionString() });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Direct job posting URLs keyed by opportunity title */
const DIRECT_URL_BY_TITLE: Record<string, string> = {
  'STEP Internship 2027': 'https://buildyourfuture.withgoogle.com/step',
  'Software Engineering Internship, Summer 2027':
    'https://careers.google.com/jobs/results/112518690523488966-software-developer-intern/',
  'Associate Product Manager (APM) - New Grad':
    'https://careers.google.com/jobs/results/138972820464902854-software-engineering-intern/',
  'Google PhD Fellowship Program': 'https://research.google/outreach/phd-fellowship/',
  'Google PhD Research Fellowship': 'https://research.google/outreach/phd-fellowship/',
  'Google Summer of Code (GSoC) Research Program': 'https://summerofcode.withgoogle.com/programs/2027',
  'Microsoft Explore Internship Program':
    'https://apply.careers.microsoft.com/careers/job/1970393556855498',
  'Explore Microsoft Internship':
    'https://apply.careers.microsoft.com/careers/job/1970393556855498',
  'Software Engineering New Grad 2027':
    'https://apply.careers.microsoft.com/careers/job/1970393556857596',
  'Microsoft Azure Hackathon Fellowship':
    'https://apply.careers.microsoft.com/careers/job/1970393556857835',
  'Hardware Engineering Intern, Summer 2027':
    'https://jobs.apple.com/en-us/details/200554775-0404/hardware-engineering-internship',
  'Apple Software Engineering Intern':
    'https://jobs.apple.com/en-us/details/200554775-0404/hardware-engineering-internship',
  'iOS Developer New Grad 2027':
    'https://jobs.apple.com/en-us/details/200612588-2114/software-engineer',
  'Stripe Software Engineering Intern, University Programs':
    'https://stripe.com/careers/listing/software-engineer-intern/8031833',
  'Full Stack Engineer - New Grad 2027':
    'https://stripe.com/careers/listing/new-grad-software-engineer/8040416',
  'Netflix Software Engineering Internship, Summer 2027':
    'https://explore.jobs.netflix.net/careers/job/790312415414-machine-learning-engineer-intern-ms-phd-2026-los-gatos-california-united-states-of-america?domain=netflix.com&microsite=netflix.com',
  'AWS Software Engineering Intern':
    'https://www.amazon.jobs/en/jobs/10418355/2027-software-dev-engineer-intern',
  'Amazon Software Development Engineer SDE, New Grad':
    'https://amazon.jobs/en/jobs/10462014/software-development-graduate-aws-2027-sydney',
};

async function main() {
  const opportunities = await prisma.opportunity.findMany({
    where: { isArchived: false },
    include: { company: true },
  });

  let updated = 0;
  let alreadyDirect = 0;
  let skipped = 0;

  for (const opp of opportunities) {
    const mappedUrl = DIRECT_URL_BY_TITLE[opp.title];
    const currentIsDirect = isDirectApplicationUrl(opp.applicationUrl);

    if (mappedUrl) {
      if (opp.applicationUrl !== mappedUrl) {
        await prisma.opportunity.update({
          where: { id: opp.id },
          data: { applicationUrl: mappedUrl },
        });
        console.log(`✓ Updated: ${opp.company.name} — ${opp.title}`);
        console.log(`    ${opp.applicationUrl}`);
        console.log(`    → ${mappedUrl}\n`);
        updated++;
      } else {
        alreadyDirect++;
      }
      continue;
    }

    if (currentIsDirect) {
      alreadyDirect++;
      continue;
    }

    console.warn(`⚠ No direct URL mapping: ${opp.company.name} — ${opp.title}`);
    console.warn(`    Current: ${opp.applicationUrl}\n`);
    skipped++;
  }

  console.log(`Done. Updated: ${updated}, already direct: ${alreadyDirect}, unmapped: ${skipped}`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
