import React from 'react';
import { CompanyRepository } from '@/lib/repositories/company';
import { CompanyForm } from '@/components/CompanyForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCompanyPage(props: PageProps) {
  const { id } = await props.params;

  // Fetch company specifications
  const company = await CompanyRepository.findById(id);

  if (!company) {
    notFound();
  }

  // Map database record to Form values matching Zod types
  const initialData = {
    name: company.name,
    logoUrl: company.logoUrl,
    websiteUrl: company.websiteUrl,
    careerPageUrl: company.careerPageUrl,
    industry: company.industry,
    description: company.description,
    country: company.country,
    state: company.state,
    city: company.city,
    companySize: company.companySize || '1-10',
    foundedYear: company.foundedYear,
    linkedinUrl: company.linkedinUrl,
    twitterUrl: company.twitterUrl,
    githubUrl: company.githubUrl,
    isVerified: company.isVerified,
    hiringStatus: company.hiringStatus,
    tags: company.tags,
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Edit Company Specifications
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Modify corporate parameters, scraper matching keys, or online presence links.
        </p>
      </div>

      <CompanyForm
        initialData={initialData}
        companyId={id}
      />
    </div>
  );
}
