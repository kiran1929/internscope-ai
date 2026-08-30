'use server';

import { revalidatePath } from 'next/cache';
import { UserRepository } from '@/lib/repositories/user';
import { Role } from '@/lib/generated/prisma/enums';
import { requireAdmin } from '@/lib/auth/admin';
import { actionError } from '@/lib/security/error-handler';

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
    return { success: false, error: actionError(error, 'Operation failed.', 'userAction') };
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
    return { success: false, error: actionError(error, 'Operation failed.', 'userAction') };
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
    return { success: false, error: actionError(error, 'Operation failed.', 'userAction') };
  }
}
