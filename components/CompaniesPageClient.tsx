'use client';

import React, { useState, useTransition } from 'react';
import { DashboardCompanies } from '@/components/DashboardCompanies';
import { Company } from '@/types';
import { trackCompanyAction, untrackCompanyAction } from '@/app/actions/candidate';
import { toast } from 'sonner';

interface CompaniesPageClientProps {
  initialCompanies: Company[];
}

export function CompaniesPageClient({ initialCompanies }: CompaniesPageClientProps) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [, startTransition] = useTransition();

  const handleToggleTrack = (id: string) => {
    const target = companies.find((company) => company.id === id);
    if (!target) return;

    const nextTracking = !target.isTracking;

    setCompanies((prev) =>
      prev.map((company) =>
        company.id === id ? { ...company, isTracking: nextTracking } : company
      )
    );

    startTransition(async () => {
      const result = nextTracking
        ? await trackCompanyAction(id)
        : await untrackCompanyAction(id);

      if (result.success) {
        toast.success(`${nextTracking ? 'Started' : 'Stopped'} tracking ${target.name}`);
      } else {
        setCompanies((prev) =>
          prev.map((company) =>
            company.id === id ? { ...company, isTracking: !nextTracking } : company
          )
        );
        toast.error(`Error: ${result.error}`);
      }
    });
  };

  return <DashboardCompanies companies={companies} onToggleTrack={handleToggleTrack} />;
}
