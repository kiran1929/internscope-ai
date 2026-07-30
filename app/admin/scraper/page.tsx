import React from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import { JobRepository } from '@/lib/repositories/job';
import ScraperDashboardClient from '@/components/ScraperDashboardClient';

export const dynamic = 'force-dynamic';

async function getAdminUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const dbUser = await UserRepository.findByClerkId(clerkUser.id);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    redirect('/403');
  }
  return dbUser;
}

// Live connection checker helper
async function checkProviderStatus(url: string): Promise<'Online' | 'Offline'> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'InternScope-Health-Check/1.0',
      },
    });

    clearTimeout(id);
    return res.status >= 200 && res.status < 500 ? 'Online' : 'Offline';
  } catch {
    return 'Offline';
  }
}

export default async function ScraperDashboardPage() {
  await getAdminUser();

  // Perform parallel live connection health checks and database history lookups
  const [
    greenhouseStatus,
    leverStatus,
    ashbyStatus,
    runningJobs,
    history,
    lastGreenhouseSuccess,
    lastLeverSuccess,
    lastAshbySuccess,
    nextGreenhouse,
    nextLever,
    nextAshby,
  ] = await Promise.all([
    checkProviderStatus('https://boards-api.greenhouse.io/v1/boards/stripe/jobs'),
    checkProviderStatus('https://api.lever.co/v0/postings/spotify?mode=json'),
    checkProviderStatus('https://api.ashbyhq.com/posting-api/job-board/linear'),
    JobRepository.findRunning(),
    JobRepository.getHistory(30),
    JobRepository.getLastSuccessfulSync('greenhouse'),
    JobRepository.getLastSuccessfulSync('lever'),
    JobRepository.getLastSuccessfulSync('ashby'),
    JobRepository.getNextScheduledSync('greenhouse'),
    JobRepository.getNextScheduledSync('lever'),
    JobRepository.getNextScheduledSync('ashby'),
  ]);

  const formatLastSyncString = (finishedAt: Date | null) => {
    if (!finishedAt) return 'Never synced';
    return new Date(finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const providers = [
    {
      name: 'Greenhouse Job Boards',
      token: 'stripe',
      status: greenhouseStatus,
      type: 'greenhouse',
      endpoint: 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs',
      lastSuccessfulSync: formatLastSyncString(lastGreenhouseSuccess?.finishedAt || null),
      nextScheduledSync: nextGreenhouse.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      name: 'Lever Job Boards',
      token: 'spotify',
      status: leverStatus,
      type: 'lever',
      endpoint: 'https://api.lever.co/v0/postings/spotify?mode=json',
      lastSuccessfulSync: formatLastSyncString(lastLeverSuccess?.finishedAt || null),
      nextScheduledSync: nextLever.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      name: 'Ashby Careers Pages',
      token: 'linear',
      status: ashbyStatus,
      type: 'ashby',
      endpoint: 'https://api.ashbyhq.com/posting-api/job-board/linear',
      lastSuccessfulSync: formatLastSyncString(lastAshbySuccess?.finishedAt || null),
      nextScheduledSync: nextAshby.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in text-white">
      <ScraperDashboardClient
        providers={providers}
        runningJobs={runningJobs}
        history={history}
      />
    </div>
  );
}
