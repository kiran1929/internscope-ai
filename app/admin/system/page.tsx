import React from 'react';
import { prisma } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import { HealthMonitor } from '@/lib/platform/health';
import SystemHealthClient from '@/components/SystemHealthClient';

export const dynamic = 'force-dynamic';

async function verifyAdminAccess() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const dbUser = await UserRepository.findByClerkId(clerkUser.id);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    redirect('/403');
  }
  return dbUser;
}

export default async function AdminSystemHealthPage() {
  await verifyAdminAccess();

  // 1. Fetch initial platform diagnostics
  const health = await HealthMonitor.checkHealth();

  // 2. Fetch all registered feature flags
  const flags = await prisma.featureFlag.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <SystemHealthClient
      initialHealth={health}
      initialFlags={flags}
    />
  );
}
