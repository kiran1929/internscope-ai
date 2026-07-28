'use client';

import React from 'react';
import { useDashboardState } from '@/providers/DashboardStateProvider';
import { DashboardInternships } from '@/components/DashboardInternships';

export default function InternshipsPage() {
  const {
    internships,
    savedIds,
    appliedIds,
    handleToggleSaveInternship,
    handleTrackApplication
  } = useDashboardState();

  return (
    <DashboardInternships
      internships={internships}
      savedIds={savedIds}
      appliedIds={appliedIds}
      onToggleSave={handleToggleSaveInternship}
      onTrackInternship={handleTrackApplication}
    />
  );
}
