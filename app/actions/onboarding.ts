'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface OnboardingPayload {
  careerGoal: string;
  preferredRoles: string[];
  skills: string[];
  experienceLevel: string;
  preferredLocations: string[];
  remotePreference: string; // REMOTE, HYBRID, ONSITE
  desiredSalary: string;
}

export async function submitOnboardingAction(payload: OnboardingPayload) {
  try {
    const user = await getAuthenticatedUser();

    // Map Remote type string matching database RemoteType enum
    let dbRemote = 'REMOTE';
    if (payload.remotePreference === 'HYBRID') dbRemote = 'HYBRID';
    if (payload.remotePreference === 'ONSITE') dbRemote = 'ONSITE';

    // Update or create user Profile record
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bio: `Goal: ${payload.careerGoal}. Target Role: ${payload.preferredRoles.join(', ')}`,
        githubUrl: '',
        linkedinUrl: '',
        portfolioUrl: '',
        skills: payload.skills,
        preferredLocations: payload.preferredLocations,
        experienceLevel: payload.experienceLevel,
      },
      update: {
        bio: `Goal: ${payload.careerGoal}. Target Role: ${payload.preferredRoles.join(', ')}`,
        skills: payload.skills,
        preferredLocations: payload.preferredLocations,
        experienceLevel: payload.experienceLevel,
      },
    });

    // Populate initial CareerGoal in database automatically
    await prisma.careerGoal.create({
      data: {
        userId: user.id,
        title: payload.careerGoal,
        status: 'IN_PROGRESS',
        progress: 10.0,
        missingSkills: [],
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
