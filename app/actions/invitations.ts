'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { Role } from '@/lib/generated/prisma/enums';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

async function verifyAdminAccess() {
  const user = await getAuthenticatedUser();
  if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function createBetaInvitationAction(email: string) {
  try {
    await verifyAdminAccess();

    const token = crypto.randomBytes(16).toString('hex');

    const invitation = await prisma.betaInvitation.create({
      data: {
        email: email.trim(),
        token,
        status: 'PENDING',
      },
    });

    revalidatePath('/admin/invitations');
    return { success: true, invitation };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteBetaInvitationAction(id: string) {
  try {
    await verifyAdminAccess();

    await prisma.betaInvitation.delete({
      where: { id },
    });

    revalidatePath('/admin/invitations');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
