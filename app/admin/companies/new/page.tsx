import React from 'react';
import { CompanyRepository } from '@/lib/repositories/company';
import { CompanyForm } from '@/components/CompanyForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    duplicate?: string;
  }>;
}

export default async function NewCompanyPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const duplicateId = searchParams.duplicate;

  let initialData: Parameters<typeof CompanyForm>[0]['initialData'] = undefined;

  // If duplicate query parameter is set, fetch that company to duplicate
  if (duplicateId) {
    const source = await CompanyRepository.findById(duplicateId);

    if (source) {
      initialData = {
        name: `${source.name} (Copy)`,
        logoUrl: source.logoUrl,
        websiteUrl: source.websiteUrl,
        careerPageUrl: source.careerPageUrl,
        industry: source.industry,
        description: source.description,
        country: source.country,
        state: source.state,
        city: source.city,
        companySize: source.companySize || '1-10',
        foundedYear: source.foundedYear,
        linkedinUrl: source.linkedinUrl,
        twitterUrl: source.twitterUrl,
        githubUrl: source.githubUrl,
        isVerified: source.isVerified,
        hiringStatus: source.hiringStatus,
        tags: source.tags,
      };
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-white">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Create Company
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Add a new corporate profile into the InternScope AI scraper matching index.
        </p>
      </div>

      <CompanyForm initialData={initialData} />
    </div>
  );
}
