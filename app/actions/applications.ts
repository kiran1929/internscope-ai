'use server';

import { revalidatePath } from 'next/cache';
import { ApplicationRepository } from '@/lib/repositories/application';
import { ApplicationStatus } from '@/lib/generated/prisma/enums';
import { requireAdmin } from '@/lib/auth/admin';
import { actionError } from '@/lib/security/error-handler';

export async function updateApplicationStatusAction(id: string, newStatus: ApplicationStatus) {
  try {
    await requireAdmin();
    if (!Object.values(ApplicationStatus).includes(newStatus)) {
      return { success: false, error: 'Invalid application status specified' };
    }

    const application = await ApplicationRepository.update(id, { status: newStatus });
    revalidatePath('/admin/applications');
    revalidatePath(`/admin/applications/${id}`);
    
    // Revalidate related user profiles for applications count consistency
    if (application.userId) {
      revalidatePath(`/admin/users/${application.userId}`);
    }
    
    return { success: true, data: application };
  } catch (error: unknown) {
    console.error('Failed to update application status:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'applicationAction') };
  }
}
