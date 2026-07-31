'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { Role } from '@/lib/generated/prisma/enums';
import { RedisCache } from '@/lib/platform/redis';
import { HealthMonitor } from '@/lib/platform/health';
import { revalidatePath } from 'next/cache';

async function verifyAdminAccess() {
  const user = await getAuthenticatedUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
    throw new Error('Unauthorized admin access');
  }
  return user;
}

export async function toggleFeatureFlagAction(flagName: string, isEnabled: boolean) {
  try {
    await verifyAdminAccess();

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
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateFlagRolloutAction(flagName: string, percent: number) {
  try {
    await verifyAdminAccess();

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
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function refreshSystemHealthAction() {
  try {
    await verifyAdminAccess();
    
    const health = await HealthMonitor.checkHealth();
    
    revalidatePath('/admin/system');
    return { success: true, health };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
