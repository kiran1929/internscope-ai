'use server';

import { revalidatePath } from 'next/cache';
import { ApplicationRepository } from '@/lib/repositories/application';
import { ApplicationStatus } from '@/lib/generated/prisma/enums';

export async function updateApplicationStatusAction(id: string, newStatus: ApplicationStatus) {
  try {
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
    const message = error instanceof Error ? error.message : 'Failed to update application status';
    return { success: false, error: message };
  }
}
