import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import CandidateOnboardingClient from '@/components/CandidateOnboardingClient';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await getAuthenticatedUser();

  // Check if profile is already configured
  const existingProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (existingProfile) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <CandidateOnboardingClient />
    </div>
  );
}
