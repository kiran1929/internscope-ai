import React from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import { SettingsForm } from '@/components/SettingsForm';

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

export default async function AdminSettingsPage() {
  await getAdminUser();

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          System Settings
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Configure site brand parameters, platform access policies, crawlers, and AI pipeline weights.
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
