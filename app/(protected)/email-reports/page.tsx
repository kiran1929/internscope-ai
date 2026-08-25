import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import EmailReportsClient from '@/components/EmailReportsClient';

export const dynamic = 'force-dynamic';

export default async function EmailReportsPage() {
  const user = await getAuthenticatedUser();

  const pref = await prisma.emailPreference.findUnique({
    where: { userId: user.id },
  });

  const preference = {
    emailDestination: pref?.emailDestination ?? user.email,
    weeklyDigest: pref?.weeklyDigest ?? true,
    instantAlerts: pref?.instantAlerts ?? true,
    deadlineReminders: pref?.deadlineReminders ?? true,
    newOpportunities: pref?.newOpportunities ?? true,
    applicationStatus: pref?.applicationStatus ?? true,
    interviewReminders: pref?.interviewReminders ?? true,
  };

  return (
    <EmailReportsClient
      userEmail={user.email}
      preference={preference}
    />
  );
}
