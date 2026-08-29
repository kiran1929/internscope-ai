import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '../lib/generated/prisma/client';
import { UserRepository } from '../lib/repositories/user';
import { OpportunityNotificationService } from '../lib/email/opportunity-notification-service';
import { isDirectApplicationUrl } from '../lib/email/application-url-utils';
import { getPgConnectionString } from '../lib/db-connection';

const pool = new pg.Pool({ connectionString: getPgConnectionString() });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Seed/demo clerkIds created by prisma/seed.ts — not real Clerk accounts */
const SEED_CLERK_ID_PREFIX = 'user_clerk_';

async function fetchAllClerkUsers() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is not set in environment.');
  }

  const clerk = createClerkClient({ secretKey });
  const clerkUsers = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await clerk.users.getUserList({ limit, offset });
    clerkUsers.push(...response.data);
    if (response.data.length < limit) break;
    offset += limit;
  }

  return clerkUsers;
}

async function resolveDbUserForClerkUser(clerkUser: Awaited<ReturnType<ReturnType<typeof createClerkClient>['users']['getUserList']>>['data'][number]) {
  let dbUser = await UserRepository.findByClerkId(clerkUser.id);
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';

  if (!dbUser && email) {
    dbUser = await UserRepository.findByEmail(email);
    if (dbUser && dbUser.clerkId.startsWith(SEED_CLERK_ID_PREFIX)) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { clerkId: clerkUser.id },
        include: { profile: true, emailPreference: true },
      });
    }
  }

  if (!dbUser) {
    dbUser = await UserRepository.createUser({
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
      avatarUrl: clerkUser.imageUrl || undefined,
    });
  }

  return dbUser;
}

/** One opportunity per company — test fixed direct application links */
const TARGET_COMPANIES = ['Google', 'Netflix', 'Amazon'];

async function fetchOpportunitiesForCompanies(companyNames: string[]) {
  const opportunities = [];

  for (const companyName of companyNames) {
    const companyOpps = await prisma.opportunity.findMany({
      where: {
        isArchived: false,
        isActive: true,
        company: { name: companyName },
      },
      include: { company: true, enrichment: true },
      orderBy: { createdAt: 'desc' },
    });

    const directOpp = companyOpps.find((opp) => isDirectApplicationUrl(opp.applicationUrl));
    const opp = directOpp || companyOpps[0];
    if (opp) opportunities.push(opp);
  }

  return opportunities;
}

async function main() {
  const clerkUsers = await fetchAllClerkUsers();

  if (clerkUsers.length === 0) {
    console.error('No users found in Clerk.');
    process.exit(1);
  }

  console.log(`Found ${clerkUsers.length} Clerk user(s):\n`);
  clerkUsers.forEach((u) => {
    console.log(`  • ${u.emailAddresses[0]?.emailAddress || '(no email)'} (${u.id})`);
  });
  console.log('');

  const opportunities = await fetchOpportunitiesForCompanies(TARGET_COMPANIES);

  if (opportunities.length === 0) {
    console.error('No active opportunities found for target companies.');
    process.exit(1);
  }

  console.log(`Using opportunities from: ${opportunities.map((o) => o.company.name).join(', ')}\n`);

  console.log(`Sending opportunity emails to ${clerkUsers.length} Clerk user(s)...\n`);

  for (let i = 0; i < clerkUsers.length; i++) {
    const clerkUser = clerkUsers[i];
    const dbUser = await resolveDbUserForClerkUser(clerkUser);
    const opportunity = opportunities[i % opportunities.length];
    const matchScore = 88 + i * 3;
    const skills = opportunity.enrichment?.skills?.length
      ? opportunity.enrichment.skills.slice(0, 4)
      : dbUser.profile?.skills?.slice(0, 4) || ['React', 'TypeScript', 'Node.js'];

    const recipientEmail =
      dbUser.emailPreference?.emailDestination ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      dbUser.email;

    const result = await OpportunityNotificationService.notifyCandidateIfEligible({
      userId: dbUser.id,
      opportunityId: opportunity.id,
      recipientEmail,
      userName: dbUser.profile?.firstName || recipientEmail.split('@')[0],
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        location: opportunity.location,
        remoteType: opportunity.remoteType?.toString(),
        type: opportunity.type?.toString(),
        applicationUrl: opportunity.applicationUrl,
        deadline: opportunity.deadline,
        company: { name: opportunity.company.name },
        enrichment: opportunity.enrichment,
      },
      matchScore,
      matchedSkills: skills,
      matchReasons: [
        `Matches your profile skills in ${skills.slice(0, 2).join(' and ')}`,
        `Matches your preferred ${opportunity.remoteType?.toLowerCase() || 'remote'} work mode`,
        `Strong profile-to-role compatibility (${matchScore}% Match Score)`,
      ],
      forceSend: true,
    });

    const viewLink = opportunity.applicationUrl;
    console.log(
      `[${i + 1}/${clerkUsers.length}] ${recipientEmail} (Clerk: ${clerkUser.id})`,
    );
    console.log(`    Opportunity: "${opportunity.title}" at ${opportunity.company.name}`);
    console.log(`    View link: ${viewLink}`);
    console.log(
      `    Status: ${result.sent ? 'SENT' : result.skipped ? `SKIPPED (${result.skipReason})` : `FAILED (${result.error})`}`,
    );
    if (result.messageId) console.log(`    MessageId: ${result.messageId}`);
    console.log('');
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
