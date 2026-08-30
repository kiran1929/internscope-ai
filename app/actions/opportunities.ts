'use server';

import { revalidatePath } from 'next/cache';
import { OpportunityRepository } from '@/lib/repositories/opportunity';
import { opportunitySchema, OpportunityFormValues } from '@/lib/validation/opportunity';
import { scheduleNewOpportunityNotifications } from '@/lib/email/new-opportunity-dispatcher';
import { requireAdmin } from '@/lib/auth/admin';
import { actionError } from '@/lib/security/error-handler';

export async function createOpportunityAction(formData: OpportunityFormValues) {
  try {
    await requireAdmin();
    const validated = opportunitySchema.parse(formData);
    const opp = await OpportunityRepository.create(validated);
    if (opp.isActive && !opp.isArchived) {
      await scheduleNewOpportunityNotifications(opp.id);
    }
    revalidatePath('/admin/opportunities');
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to create opportunity:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'opportunityAction') };
  }
}

export async function updateOpportunityAction(id: string, formData: OpportunityFormValues) {
  try {
    await requireAdmin();
    const validated = opportunitySchema.parse(formData);
    const opp = await OpportunityRepository.update(id, validated);
    revalidatePath('/admin/opportunities');
    revalidatePath(`/admin/opportunities/${id}`);
    revalidatePath(`/admin/opportunities/${id}/edit`);
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to update opportunity:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'opportunityAction') };
  }
}

export async function togglePublishOpportunityAction(id: string, currentIsActive: boolean) {
  try {
    await requireAdmin();
    const opp = await OpportunityRepository.update(id, { isActive: !currentIsActive });
    if (opp.isActive && !opp.isArchived) {
      await scheduleNewOpportunityNotifications(opp.id);
    }
    revalidatePath('/admin/opportunities');
    revalidatePath(`/admin/opportunities/${id}`);
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to toggle publish status:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'opportunityAction') };
  }
}

export async function archiveOpportunityAction(id: string) {
  try {
    await requireAdmin();
    const opp = await OpportunityRepository.update(id, { isArchived: true });
    revalidatePath('/admin/opportunities');
    revalidatePath(`/admin/opportunities/${id}`);
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to archive opportunity:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'opportunityAction') };
  }
}

export async function unarchiveOpportunityAction(id: string) {
  try {
    await requireAdmin();
    const opp = await OpportunityRepository.update(id, { isArchived: false });
    revalidatePath('/admin/opportunities');
    revalidatePath(`/admin/opportunities/${id}`);
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to unarchive opportunity:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'opportunityAction') };
  }
}

export async function deleteOpportunityAction(id: string) {
  try {
    await requireAdmin();
    // Soft delete via setting isArchived to true
    const opp = await OpportunityRepository.update(id, { isArchived: true });
    revalidatePath('/admin/opportunities');
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to delete opportunity:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'opportunityAction') };
  }
}
