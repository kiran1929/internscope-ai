import React from 'react';
import { getAuthenticatedUser, getPersonalizedRecommendations } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import CandidateDashboardClient from '@/components/CandidateDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. Fetch user profile (or create a default one)
  const user = await getAuthenticatedUser();

  // 2. Fetch bookmarks count
  const savedCount = await prisma.savedOpportunity.count({
    where: { userId: user.id },
  });

  // 3. Fetch applications counts and funnel list
  const [applicationsCount, applications, recentSearches, upcomingDeadlines, recsResult] = await Promise.all([
    prisma.application.count({ where: { userId: user.id } }),
    prisma.application.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        opportunity: {
          include: {
            company: true,
          },
        },
      },
    }),
    // Recent searches logged by this candidate
    prisma.searchLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, query: true, createdAt: true },
    }),
    // Upcoming deadlines in the next 14 days
    prisma.opportunity.findMany({
      where: {
        isArchived: false,
        isActive: true,
        deadline: {
          gte: new Date(),
          lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Next 14 days
        },
      },
      take: 3,
      orderBy: { deadline: 'asc' },
      select: {
        id: true,
        title: true,
        deadline: true,
        company: { select: { name: true } },
      },
    }),
    getPersonalizedRecommendations(),
  ]);

  // Map to client format
  const mappedUser = {
    email: user.email,
    profile: user.profile ? {
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatarUrl: user.profile.avatarUrl,
      skills: user.profile.skills,
      preferredLocations: user.profile.preferredLocations,
      preferredTechnologies: user.profile.preferredTechnologies,
      graduationYear: user.profile.graduationYear,
      major: user.profile.major,
      headline: user.profile.headline,
      bio: user.profile.bio,
      githubUrl: user.profile.githubUrl,
      linkedinUrl: user.profile.linkedinUrl,
      portfolioUrl: user.profile.portfolioUrl,
    } : null,
  };

  const mappedApplications = applications.map((app) => ({
    id: app.id,
    status: app.status.toString(),
    appliedAt: app.appliedAt,
    notes: app.notes,
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

  const mappedDeadlines = upcomingDeadlines.map((item) => ({
    id: item.id,
    title: item.title,
    deadline: item.deadline!,
    company: item.company,
  }));

  const recommendations = recsResult.success && recsResult.recommendations
    ? (recsResult.recommendations as any[]).map((job) => ({
        id: job.id,
        title: job.title,
        location: job.location,
        type: job.type.toString(),
        createdAt: job.createdAt,
        company: {
          name: job.company.name,
          logoUrl: job.company.logoUrl,
        },
        enrichment: job.enrichment ? {
          skills: job.enrichment.skills,
          experienceLevel: job.enrichment.experienceLevel,
          salaryMin: job.enrichment.salaryMin,
          salaryMax: job.enrichment.salaryMax,
          salaryCurrency: job.enrichment.salaryCurrency,
        } : null,
      }))
    : [];

  return (
    <CandidateDashboardClient
      user={mappedUser}
      savedCount={savedCount}
      applicationsCount={applicationsCount}
      applications={mappedApplications}
      recommendations={recommendations}
      recentSearches={recentSearches}
      upcomingDeadlines={mappedDeadlines}
    />
  );
}
