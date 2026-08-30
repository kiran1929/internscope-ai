import React from 'react';
import Link from 'next/link';
import { Compass, AlertCircle, ExternalLink, MapPin } from 'lucide-react';
import { getPersonalizedRecommendations } from '@/app/actions/candidate';
import { CompanyLogo } from '@/components/CompanyLogo';

export async function DashboardRecommendations() {
  const recsResult = await getPersonalizedRecommendations();

  const recommendations =
    recsResult.success && recsResult.recommendations
      ? recsResult.recommendations.map((job) => ({
          id: job.id,
          title: job.title,
          location: job.location,
          type: job.type.toString(),
          applicationUrl: job.applicationUrl || `/jobs/${job.id}`,
          company: {
            name: job.company.name,
            logoUrl: job.company.logoUrl,
            websiteUrl: job.company.websiteUrl ?? null,
          },
          enrichment: job.enrichment
            ? {
                skills: job.enrichment.skills,
                salaryMin: job.enrichment.salaryMin,
              }
            : null,
        }))
      : [];

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-primary" /> Personalized AI Recommendations
        </h3>
        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase">
          Real-time matching active
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div className="dashboard-card p-8 text-center text-text-muted space-y-2">
          <AlertCircle className="w-8 h-8 text-text-muted/40 mx-auto" />
          <p className="text-xs">No matching opportunities found. Update your skills in profile setup.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommendations.map((job) => (
            <div
              key={job.id}
              className="group relative bg-card-bg border border-border-subtle hover:border-primary/40 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 gap-3.5"
            >
              <div className="space-y-3">
                {/* Header: Logo, Company, Title & Type Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <CompanyLogo
                      logoUrl={job.company.logoUrl}
                      websiteUrl={job.company.websiteUrl}
                      applicationUrl={job.applicationUrl}
                      name={job.company.name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-muted truncate">
                        {job.company.name}
                      </p>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors block line-clamp-1 mt-0.5 leading-snug"
                        title={job.title}
                      >
                        {job.title}
                      </Link>
                      <p className="text-[11px] text-text-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 shrink-0 text-text-muted/70" />
                        <span className="truncate">{job.location || 'Remote'}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-border-subtle bg-surface-muted font-medium text-text-muted capitalize shrink-0">
                    {job.type.toLowerCase().replace('_', ' ')}
                  </span>
                </div>

                {/* Skills tags */}
                {job.enrichment?.skills && job.enrichment.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {job.enrichment.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] bg-surface-muted text-text-muted border border-border-subtle px-2 py-0.5 rounded-md font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer: Salary & Apply Action */}
              <div className="border-t border-border-subtle pt-2.5 flex items-center justify-between text-xs">
                <span className="text-text-muted text-[11px] font-medium">
                  {job.enrichment?.salaryMin
                    ? `$${Math.round(job.enrichment.salaryMin / 1000)}k+/yr`
                    : 'Salary undisclosed'}
                </span>

                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white font-semibold text-xs transition-all duration-150 cursor-pointer shadow-2xs"
                >
                  Apply Now <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardRecommendationsSkeleton() {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="h-4 w-56 bg-surface-muted rounded animate-pulse" />
        <div className="h-5 w-32 bg-primary/10 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="dashboard-card p-4 h-36 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
