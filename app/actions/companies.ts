'use server';

import { revalidatePath } from 'next/cache';
import { CompanyRepository } from '@/lib/repositories/company';
import { companySchema, CompanyFormValues } from '@/lib/validation/company';
import { requireAdmin } from '@/lib/auth/admin';
import { actionError } from '@/lib/security/error-handler';

export async function createCompanyAction(formData: CompanyFormValues) {
  try {
    await requireAdmin();
    const validated = companySchema.parse(formData);
    
    // Check for duplicate names
    const existing = await CompanyRepository.findByName(validated.name);
    if (existing) {
      return { success: false, error: 'A company with this name already exists' };
    }

    const company = await CompanyRepository.create(validated);
    revalidatePath('/admin/companies');
    return { success: true, data: company };
  } catch (error: unknown) {
    console.error('Failed to create company:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'companyAction') };
  }
}

export async function updateCompanyAction(id: string, formData: CompanyFormValues) {
  try {
    await requireAdmin();
    const validated = companySchema.parse(formData);

    // Check duplicate names (excluding current record)
    const existing = await CompanyRepository.findByName(validated.name);
    if (existing && existing.id !== id) {
      return { success: false, error: 'A company with this name already exists' };
    }

    const company = await CompanyRepository.update(id, validated);
    revalidatePath('/admin/companies');
    revalidatePath(`/admin/companies/${id}`);
    revalidatePath(`/admin/companies/${id}/edit`);
    return { success: true, data: company };
  } catch (error: unknown) {
    console.error('Failed to update company:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'companyAction') };
  }
}

export async function archiveCompanyAction(id: string) {
  try {
    await requireAdmin();
    const company = await CompanyRepository.update(id, { isArchived: true });
    revalidatePath('/admin/companies');
    revalidatePath(`/admin/companies/${id}`);
    return { success: true, data: company };
  } catch (error: unknown) {
    console.error('Failed to archive company:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'companyAction') };
  }
}

export async function verifyCompanyAction(id: string, currentIsVerified: boolean) {
  try {
    await requireAdmin();
    const company = await CompanyRepository.update(id, { isVerified: !currentIsVerified });
    revalidatePath('/admin/companies');
    revalidatePath(`/admin/companies/${id}`);
    return { success: true, data: company };
  } catch (error: unknown) {
    console.error('Failed to toggle verification:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'companyAction') };
  }
}

export async function deleteCompanyAction(id: string) {
  try {
    await requireAdmin();
    // Soft delete via setting isArchived to true
    const company = await CompanyRepository.update(id, { isArchived: true });
    revalidatePath('/admin/companies');
    return { success: true, data: company };
  } catch (error: unknown) {
    console.error('Failed to delete company:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'companyAction') };
  }
}

export async function duplicateCompanyAction(id: string) {
  try {
    await requireAdmin();
    const source = await CompanyRepository.findById(id);
    if (!source) {
      return { success: false, error: 'Source company not found' };
    }

    // Generate unique copy name
    let copyName = `${source.name} (Copy)`;
    let existing = await CompanyRepository.findByName(copyName);
    let attempts = 1;
    while (existing) {
      copyName = `${source.name} (Copy ${attempts})`;
      existing = await CompanyRepository.findByName(copyName);
      attempts++;
    }

    // Clone all primitive attributes
    const company = await CompanyRepository.create({
      name: copyName,
      logoUrl: source.logoUrl,
      websiteUrl: source.websiteUrl,
      careerPageUrl: source.careerPageUrl,
      industry: source.industry,
      description: source.description,
      country: source.country,
      state: source.state,
      city: source.city,
      companySize: source.companySize,
      foundedYear: source.foundedYear,
      linkedinUrl: source.linkedinUrl,
      twitterUrl: source.twitterUrl,
      githubUrl: source.githubUrl,
      isVerified: source.isVerified,
      hiringStatus: source.hiringStatus,
      tags: source.tags,
      isArchived: false, // Clone as active
    });

    revalidatePath('/admin/companies');
    return { success: true, data: company };
  } catch (error: unknown) {
    console.error('Failed to duplicate company:', error);
    return { success: false, error: actionError(error, 'Operation failed.', 'companyAction') };
  }
}
