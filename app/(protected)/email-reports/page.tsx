'use client';

import React from 'react';
import { useDashboardState } from '@/providers/DashboardStateProvider';
import { DashboardEmailReports } from '@/components/DashboardEmailReports';

export default function EmailReportsPage() {
  const { emailPreferences, handleTogglePreference } = useDashboardState();

  return (
    <DashboardEmailReports
      preferences={emailPreferences}
      onTogglePreference={handleTogglePreference}
    />
  );
}
