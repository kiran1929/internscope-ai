'use server';

import { revalidatePath } from 'next/cache';
import { UserRepository } from '@/lib/repositories/user';
import { Role } from '@/lib/generated/prisma/enums';
import { requireAdmin } from '@/lib/auth/admin';

export async function changeUserRoleAction(id: string, newRole: Role) {
  try {
    await requireAdmin();
    if (!Object.values(Role).includes(newRole)) {
      return { success: false, error: 'Invalid user role specified' };
    }

    const user = await UserRepository.updateRole(id, newRole);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    return { success: true, data: user };
  } catch (error: unknown) {
    console.error('Failed to change user role:', error);
    const message = error instanceof Error ? error.message : 'Failed to update user role';
    return { success: false, error: message };
  }
}

export async function deactivateUserAction(id: string) {
  try {
    await requireAdmin();
    const user = await UserRepository.toggleActive(id, false);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    return { success: true, data: user };
  } catch (error: unknown) {
    console.error('Failed to deactivate user:', error);
    const message = error instanceof Error ? error.message : 'Failed to deactivate user';
    return { success: false, error: message };
  }
}

export async function reactivateUserAction(id: string) {
  try {
    await requireAdmin();
    const user = await UserRepository.toggleActive(id, true);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    return { success: true, data: user };
  } catch (error: unknown) {
    console.error('Failed to reactivate user:', error);
    const message = error instanceof Error ? error.message : 'Failed to reactivate user';
    return { success: false, error: message };
  }
}
