'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { UserRepository } from '@/lib/repositories/user';
import { SavedOpportunityRepository } from '@/lib/repositories/saved-opportunity';
import { ApplicationRepository } from '@/lib/repositories/application';
import { ApplicationStatus, OpportunityType, RemoteType, Prisma } from '@/lib/generated/prisma/client';
import { CandidateApplicationStatus } from '@/types/candidate';
import { revalidatePath } from 'next/cache';
import { SearchService, SearchOptions } from '@/lib/search/search-service';

// Helper to authenticate the candidate user and retrieve DB entity
export async function getAuthenticatedUser() {
  const session = await auth();
  const userId = session.userId;
  if (!userId) {
    throw new Error('Unauthorized candidate session');
  }

  let user = await UserRepository.findByClerkId(userId);
  if (!user) {
    // Lazy sync Clerk user to PostgreSQL DB if missing
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error('User not found in Clerk directory');
    }
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    user = await UserRepository.createUser({
      clerkId: userId,
      email,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      avatarUrl: clerkUser.imageUrl || '',
    });
  }
  return user;
}

// 1. Profile Actions
export async function updateProfilePageAction(data: {
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
  preferredTechnologies?: string[];
  preferredLocations?: string[];
  employmentPreferences?: string[];
  remotePreferences?: string[];
  salaryExpectations?: string;
  experienceLevel?: string;
}) {
  try {
    const user = await getAuthenticatedUser();
    
    // Split first and last name updates if provided
    await prisma.$transaction([
      prisma.profile.update({
        where: { userId: user.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          headline: data.headline,
          bio: data.bio,
          githubUrl: data.githubUrl,
          linkedinUrl: data.linkedinUrl,
          portfolioUrl: data.portfolioUrl,
          skills: data.skills,
          preferredTechnologies: data.preferredTechnologies,
          preferredLocations: data.preferredLocations,
          employmentPreferences: data.employmentPreferences,
          remotePreferences: data.remotePreferences,
          salaryExpectations: data.salaryExpectations,
          experienceLevel: data.experienceLevel,
        },
      }),
    ]);

    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// 2. Saved Jobs Actions
export async function toggleSaveJobAction(opportunityId: string) {
  try {
    const user = await getAuthenticatedUser();
    const existing = await SavedOpportunityRepository.findByUserAndOpportunity(user.id, opportunityId);

    if (existing) {
      await SavedOpportunityRepository.unsave(user.id, opportunityId);
      revalidatePath('/saved');
      revalidatePath('/dashboard');
      revalidatePath(`/jobs/${opportunityId}`);
      return { success: true, saved: false };
    } else {
      await SavedOpportunityRepository.save(user.id, opportunityId);
      revalidatePath('/saved');
      revalidatePath('/dashboard');
      revalidatePath(`/jobs/${opportunityId}`);
      return { success: true, saved: true };
    }
  } catch (error) {
    console.error('Toggle save job error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// 3. Application Tracker Actions
export async function upsertApplicationAction(
  opportunityId: string,
  status: CandidateApplicationStatus,
  notes?: string
) {
  try {
    const user = await getAuthenticatedUser();
    const existing = await ApplicationRepository.findByUserAndOpportunity(user.id, opportunityId);

    if (existing) {
      await ApplicationRepository.update(existing.id, {
        status: status as ApplicationStatus,
        notes,
      });
    } else {
      await ApplicationRepository.create({
        userId: user.id,
        opportunityId,
        status: status as ApplicationStatus,
        notes,
      });
    }

    revalidatePath('/applications');
    revalidatePath('/dashboard');
    revalidatePath(`/jobs/${opportunityId}`);
    return { success: true };
  } catch (error) {
    console.error('Upsert application error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteApplicationAction(applicationId: string) {
  try {
    await getAuthenticatedUser();
    await ApplicationRepository.delete(applicationId);
    revalidatePath('/applications');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Delete application error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// 4. Personalization & Recommendation Engine
export async function getPersonalizedRecommendations() {
  try {
    const user = await getAuthenticatedUser();
    const profile = user.profile;

    if (!profile) {
      // Default: Return newest 6 jobs
      const defaultJobs = await prisma.opportunity.findMany({
        where: { isArchived: false, isActive: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { company: true, enrichment: true },
      });
      return { success: true, recommendations: defaultJobs };
    }

    // Query active enriched opportunities
    const opportunities = await prisma.opportunity.findMany({
      where: { isArchived: false, isActive: true },
      include: { company: true, enrichment: true },
    });

    const userSkills = profile.skills || [];
    const userLocations = profile.preferredLocations || [];
    const userTypes = profile.employmentPreferences || []; // e.g. "INTERNSHIP", "FULL-TIME"
    const userRemote = profile.remotePreferences || [];

    const scoredJobs = opportunities.map((job) => {
      let score = 0;

      // 1. Skill & Technologies overlap (max 50 points)
      const jobSkills = job.enrichment?.skills || [];
      if (userSkills.length > 0 && jobSkills.length > 0) {
        const matchingSkills = jobSkills.filter((s) =>
          userSkills.map((us) => us.toLowerCase()).includes(s.toLowerCase())
        );
        score += (matchingSkills.length / Math.max(userSkills.length, 1)) * 50;
      }

      // 2. Preferred Location overlap (max 20 points)
      if (userLocations.length > 0) {
        const jobLoc = job.location.toLowerCase();
        const matchesLocation = userLocations.some((ul) =>
          jobLoc.includes(ul.toLowerCase())
        );
        if (matchesLocation) score += 20;
      }

      // 3. Remote Pref overlap (max 15 points)
      if (userRemote.length > 0) {
        const jobRemote = job.remoteType?.toString().toUpperCase();
        const matchesRemote = userRemote.some((ur) =>
          ur.toUpperCase() === jobRemote
        );
        if (matchesRemote) score += 15;
      }

      // 4. Employment Type Pref overlap (max 15 points)
      if (userTypes.length > 0) {
        const jobType = job.type?.toString().toUpperCase();
        const matchesType = userTypes.some((ut) =>
          ut.toUpperCase() === jobType
        );
        if (matchesType) score += 15;
      }

      return { job, score };
    });

    // Sort by compatibility descending
    scoredJobs.sort((a, b) => b.score - a.score);

    return {
      success: true,
      recommendations: scoredJobs.slice(0, 6).map((x) => x.job),
    };
  } catch (error) {
    console.error('Recommendations error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      recommendations: [],
    };
  }
}

// 5. Settings Actions
export async function updateEmailPreferenceAction(data: {
  weeklyDigest: boolean;
  instantAlerts: boolean;
  deadlineReminders: boolean;
}) {
  try {
    const user = await getAuthenticatedUser();
    await UserRepository.updateEmailPreferences(user.id, data);
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Update settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function searchJobsAction(options: SearchOptions) {
  try {
    const user = await getAuthenticatedUser();
    const results = await SearchService.search({
      ...options,
      userId: user.id,
    });
    
    const mappedOpps = results.opportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      location: opp.location,
      type: opp.type.toString(),
      applicationUrl: opp.applicationUrl,
      createdAt: opp.createdAt,
      company: {
        id: opp.company.id,
        name: opp.company.name,
        logoUrl: opp.company.logoUrl,
      },
      enrichment: opp.enrichment ? {
        skills: opp.enrichment.skills,
        qualityScore: opp.enrichment.qualityScore,
        experienceLevel: opp.enrichment.experienceLevel,
        salaryMin: opp.enrichment.salaryMin,
      } : null,
    }));

    return {
      success: true,
      opportunities: mappedOpps,
      total: results.total,
      totalPages: results.totalPages,
    };
  } catch (error) {
    console.error('Search jobs action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      opportunities: [],
      total: 0,
      totalPages: 1,
    };
  }
}
