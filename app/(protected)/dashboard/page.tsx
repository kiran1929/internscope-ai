'use client';

import React from 'react';
import { useDashboardState } from '@/providers/DashboardStateProvider';
import { DashboardOverview } from '@/components/DashboardOverview';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const {
    companies,
    internships,
    applications,
    activities,
    handleTrackApplication
  } = useDashboardState();

  return (
    <DashboardOverview
      companies={companies}
      internships={internships}
      applications={applications}
      activities={activities}
      onNavigate={(tab) => {
        if (tab === 'overview') {
          router.push('/dashboard');
        } else {
          router.push(`/${tab}`);
        }
      }}
      onTrackInternship={handleTrackApplication}
    />
  );
}
