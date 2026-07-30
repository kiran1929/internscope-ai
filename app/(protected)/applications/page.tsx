import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import CandidateApplicationsClient from '@/components/CandidateApplicationsClient';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const user = await getAuthenticatedUser();

  // 1. Fetch applications
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      opportunity: {
        include: {
          company: true,
        },
      },
    },
  });

  const mappedApplications = applications.map((app) => ({
    id: app.id,
    status: app.status.toString(),
    notes: app.notes,
    appliedAt: app.appliedAt,
    updatedAt: app.updatedAt,
    opportunity: {
      id: app.opportunity.id,
      title: app.opportunity.title,
      location: app.opportunity.location,
      company: {
        name: app.opportunity.company.name,
        logoUrl: app.opportunity.company.logoUrl,
      },
    },
  }));

  return <CandidateApplicationsClient applications={mappedApplications} />;
}
