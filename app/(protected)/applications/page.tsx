'use client';

import React from 'react';
import { useDashboardState } from '@/providers/DashboardStateProvider';
import { DashboardApplications } from '@/components/DashboardApplications';

export default function ApplicationsPage() {
  const {
    applications,
    handleUpdateApplicationStatus,
    handleDeleteApplication,
    handleAddCustomApplication
  } = useDashboardState();

  return (
    <DashboardApplications
      applications={applications}
      onUpdateStatus={handleUpdateApplicationStatus}
      onDeleteApplication={handleDeleteApplication}
      onAddApplication={handleAddCustomApplication}
    />
  );
}
