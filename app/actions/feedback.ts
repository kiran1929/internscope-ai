'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface FeedbackPayload {
  type: 'BUG' | 'FEATURE_REQUEST' | 'GENERAL' | 'AI_RATING';
  content: string;
  rating?: number;
}

export async function submitFeedbackAction(payload: FeedbackPayload) {
  try {
    const user = await getAuthenticatedUser().catch(() => null);

    const feedback = await prisma.userFeedback.create({
      data: {
        userId: user?.id || null,
        type: payload.type,
        content: payload.content,
        rating: payload.rating || null,
      },
    });

    // Write audit event
    await prisma.systemAuditLog.create({
      data: {
        userId: user?.id || null,
        action: 'SUBMIT_FEEDBACK',
        status: 'SUCCESS',
        details: `Submitted feedback type ${payload.type}`,
      },
    });

    revalidatePath('/admin');
    return { success: true, feedbackId: feedback.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function toggleFeedbackResolvedAction(id: string, isResolved: boolean) {
  try {
    // Verify admin
    const user = await getAuthenticatedUser();
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized');
    }

    await prisma.userFeedback.update({
      where: { id },
      data: { isResolved },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
