import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import CandidateSettingsClient from '@/components/CandidateSettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();

  const mappedEmailPref = {
    weeklyDigest: user.emailPreference?.weeklyDigest ?? true,
    instantAlerts: user.emailPreference?.instantAlerts ?? true,
    deadlineReminders: user.emailPreference?.deadlineReminders ?? true,
  };

  return <CandidateSettingsClient emailPreference={mappedEmailPref} />;
}
