'use client';

import React from 'react';
import { useDashboardState } from '@/providers/DashboardStateProvider';
import { DashboardCompanies } from '@/components/DashboardCompanies';

export default function CompaniesPage() {
  const { companies, handleToggleCompanyTrack } = useDashboardState();

  return (
    <DashboardCompanies
      companies={companies}
      onToggleTrack={handleToggleCompanyTrack}
    />
  );
}
