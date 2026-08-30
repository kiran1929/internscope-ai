'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';
import { RedisCache } from '@/lib/platform/redis';
import { HealthMonitor } from '@/lib/platform/health';
import { revalidatePath } from 'next/cache';
import { sanitizeError } from '@/lib/security/error-handler';

export async function toggleFeatureFlagAction(flagName: string, isEnabled: boolean) {
  try {
    await requireAdmin();

    const flag = await prisma.featureFlag.update({
      where: { name: flagName },
      data: { isEnabled },
    });

    // Invalidate Redis cache
    await RedisCache.delete(`featureflag:${flagName}`);

    // Log update audit event
    await prisma.systemAuditLog.create({
      data: {
        action: 'UPDATE_FEATURE_FLAG',
        status: 'SUCCESS',
        details: `Toggled flag: ${flagName} to ${isEnabled}`,
      },
    });

    revalidatePath('/admin/system');
    return { success: true, flag };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to update feature flag.'),
    };
  }
}

export async function updateFlagRolloutAction(flagName: string, percent: number) {
  try {
    await requireAdmin();

    const flag = await prisma.featureFlag.update({
      where: { name: flagName },
      data: { rolloutPercent: percent },
    });

    await RedisCache.delete(`featureflag:${flagName}`);

    revalidatePath('/admin/system');
    return { success: true, flag };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to update flag rollout percentage.'),
    };
  }
}

export async function refreshSystemHealthAction() {
  try {
    await requireAdmin();
    
    const health = await HealthMonitor.checkHealth();
    
    revalidatePath('/admin/system');
    return { success: true, health };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to retrieve system health diagnostics.'),
    };
  }
}

export async function writeAuditLogAction(params: {
  action: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILURE';
  details: string;
}) {
  try {
    const user = await getAuthenticatedUser().catch(() => null);

    const log = await prisma.systemAuditLog.create({
      data: {
        userId: user?.id || null,
        action: params.action,
        status: params.status,
        details: params.details,
      },
    });

    return { success: true, logId: log.id };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to write audit log.'),
    };
  }
}

export async function getDeadLetterQueueAction() {
  try {
    await requireAdmin();
    const { DeadLetterQueue } = await import('@/lib/ingestion/dead-letter-queue');
    const items = DeadLetterQueue.getRecentFailures(50);
    const count = DeadLetterQueue.getFailureCount();
    return { success: true, count, items };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to fetch dead letter queue.'),
      count: 0,
      items: [],
    };
  }
}
