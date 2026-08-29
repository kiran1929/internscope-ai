'use server';

import { revalidatePath } from 'next/cache';
import { OpportunityRepository } from '@/lib/repositories/opportunity';
import { opportunitySchema, OpportunityFormValues } from '@/lib/validation/opportunity';
import { scheduleNewOpportunityNotifications } from '@/lib/email/new-opportunity-dispatcher';

export async function createOpportunityAction(formData: OpportunityFormValues) {
  try {
    const validated = opportunitySchema.parse(formData);
    const opp = await OpportunityRepository.create(validated);
    if (opp.isActive && !opp.isArchived) {
      await scheduleNewOpportunityNotifications(opp.id);
    }
    revalidatePath('/admin/opportunities');
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to create opportunity:', error);
    const message = error instanceof Error ? error.message : 'Failed to create opportunity';
    return { success: false, error: message };
  }
}

export async function updateOpportunityAction(id: string, formData: OpportunityFormValues) {
  try {
    const validated = opportunitySchema.parse(formData);
    const opp = await OpportunityRepository.update(id, validated);
    revalidatePath('/admin/opportunities');
    revalidatePath(`/admin/opportunities/${id}`);
    revalidatePath(`/admin/opportunities/${id}/edit`);
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to update opportunity:', error);
    const message = error instanceof Error ? error.message : 'Failed to update opportunity';
    return { success: false, error: message };
  }
}

export async function togglePublishOpportunityAction(id: string, currentIsActive: boolean) {
  try {
    const opp = await OpportunityRepository.update(id, { isActive: !currentIsActive });
    if (opp.isActive && !opp.isArchived) {
      await scheduleNewOpportunityNotifications(opp.id);
    }
    revalidatePath('/admin/opportunities');
    revalidatePath(`/admin/opportunities/${id}`);
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to toggle publish status:', error);
    const message = error instanceof Error ? error.message : 'Failed to update publication status';
    return { success: false, error: message };
  }
}

export async function archiveOpportunityAction(id: string) {
  try {
    const opp = await OpportunityRepository.update(id, { isArchived: true });
    revalidatePath('/admin/opportunities');
    revalidatePath(`/admin/opportunities/${id}`);
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to archive opportunity:', error);
    const message = error instanceof Error ? error.message : 'Failed to archive opportunity';
    return { success: false, error: message };
  }
}

export async function unarchiveOpportunityAction(id: string) {
  try {
    const opp = await OpportunityRepository.update(id, { isArchived: false });
    revalidatePath('/admin/opportunities');
    revalidatePath(`/admin/opportunities/${id}`);
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to unarchive opportunity:', error);
    const message = error instanceof Error ? error.message : 'Failed to unarchive opportunity';
    return { success: false, error: message };
  }
}

export async function deleteOpportunityAction(id: string) {
  try {
    // Soft delete via setting isArchived to true
    const opp = await OpportunityRepository.update(id, { isArchived: true });
    revalidatePath('/admin/opportunities');
    return { success: true, data: opp };
  } catch (error: unknown) {
    console.error('Failed to delete opportunity:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete opportunity';
    return { success: false, error: message };
  }
}
