import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import UserProfileFormClient from '@/components/UserProfileFormClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  const mappedUser = {
    id: user.id,
    email: user.email,
    profile: user.profile ? {
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatarUrl: user.profile.avatarUrl,
      skills: user.profile.skills,
      preferredLocations: user.profile.preferredLocations,
      preferredTechnologies: user.profile.preferredTechnologies,
      salaryExpectations: user.profile.salaryExpectations,
      experienceLevel: user.profile.experienceLevel,
      headline: user.profile.headline,
      bio: user.profile.bio,
      githubUrl: user.profile.githubUrl,
      linkedinUrl: user.profile.linkedinUrl,
      portfolioUrl: user.profile.portfolioUrl,
      employmentPreferences: user.profile.employmentPreferences,
      remotePreferences: user.profile.remotePreferences,
    } : null,
  };

  return <UserProfileFormClient user={mappedUser} />;
}
