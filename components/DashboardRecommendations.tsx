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
              className="dashboard-card p-4 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CompanyLogo
                    logoUrl={job.company.logoUrl}
                    websiteUrl={job.company.websiteUrl}
                    applicationUrl={job.applicationUrl}
                    name={job.company.name}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary leading-snug truncate">
                      {job.company.name}
                    </p>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-sm font-bold text-foreground hover:text-primary transition-colors block truncate mt-0.5"
                    >
                      {job.title}
                    </Link>
                    <p className="text-[10px] text-text-muted font-mono flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {job.location}
                    </p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full border border-border-subtle bg-surface-muted font-mono text-text-muted capitalize shrink-0">
                    {job.type.toLowerCase().replace('_', ' ')}
                  </span>
                </div>

                {job.enrichment?.skills && job.enrichment.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.enrichment.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-[8px] bg-surface-muted text-text-muted border border-border-subtle px-1.5 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border-subtle mt-4 pt-3 flex items-center justify-between text-[10px]">
                <span className="text-text-muted font-mono">
                  {job.enrichment?.salaryMin
                    ? `$${Math.round(job.enrichment.salaryMin / 1000)}k+`
                    : 'Salary undisclosed'}
                </span>
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-bold"
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
