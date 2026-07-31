'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';

export async function exportAccountDataAction() {
  try {
    const user = await getAuthenticatedUser();

    // Query all records associated with this candidate user
    const [profile, applications, saved, goals, feedback] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: user.id } }),
      prisma.application.findMany({ where: { userId: user.id } }),
      prisma.savedOpportunity.findMany({ where: { userId: user.id } }),
      prisma.careerGoal.findMany({ where: { userId: user.id } }),
      prisma.userFeedback.findMany({ where: { userId: user.id } }),
    ]);

    const exportPayload = {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      profile,
      applications,
      savedOpportunities: saved,
      careerGoals: goals,
      userFeedback: feedback,
    };

    return {
      success: true,
      dataString: JSON.stringify(exportPayload, null, 2),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function requestDataDeletionAction() {
  try {
    const user = await getAuthenticatedUser();

    // Execute full deletion
    await prisma.user.delete({
      where: { id: user.id },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
