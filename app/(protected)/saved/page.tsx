'use client';

import React from 'react';
import { useDashboardState } from '@/providers/DashboardStateProvider';
import { DashboardSaved } from '@/components/DashboardSaved';

export default function SavedPage() {
  const {
    internships,
    savedIds,
    appliedIds,
    handleToggleSaveInternship,
    handleTrackApplication
  } = useDashboardState();

  return (
    <DashboardSaved
      internships={internships}
      savedIds={savedIds}
      appliedIds={appliedIds}
      onRemoveSave={handleToggleSaveInternship}
      onTrackInternship={handleTrackApplication}
    />
  );
}
