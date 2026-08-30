import React from 'react';
import Link from 'next/link';
import { Sparkles, AlertCircle, ExternalLink, MapPin } from 'lucide-react';
import { getPersonalizedRecommendations } from '@/app/actions/candidate';
import { CompanyLogo } from '@/components/CompanyLogo';

export async function DashboardRecommendations() {
  const recsResult = await getPersonalizedRecommendations();

  const recommendations =
    recsResult.success && recsResult.recommendations
      ? recsResult.recommendations.map((job: any) => ({
          id: job.id,
          title: job.title,
          location: job.location,
          type: job.type.toString(),
          matchScore: job.matchScore ?? 88,
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
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" /> Personalized AI Recommendations
        </h3>
        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
          Live Matching Active
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-card-bg border border-border-subtle rounded-xl p-8 text-center text-text-muted space-y-2">
          <AlertCircle className="w-8 h-8 text-text-muted/40 mx-auto" />
          <p className="text-xs">No matching opportunities found. Update your skills in profile setup.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommendations.map((job) => (
            <div
              key={job.id}
              className="group relative bg-card-bg border border-border-subtle hover:border-primary/40 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 gap-3.5 shadow-2xs"
            >
              <div className="space-y-3">
                {/* Header: Logo, Company Name, Match Pill & Type Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
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
                      <div className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 text-text-muted/70" />
                        <span className="truncate">{job.location || 'Remote'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                      {job.matchScore}% Match
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-border-subtle bg-surface-muted font-medium text-text-muted capitalize">
                      {job.type.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors block line-clamp-2 leading-snug"
                    title={job.title}
                  >
                    {job.title}
                  </Link>
                </div>

                {/* Skills tags */}
                {job.enrichment?.skills && job.enrichment.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {job.enrichment.skills.slice(0, 3).map((skill: string) => (
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
                <span className="text-text-muted text-[11px] font-medium font-mono">
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
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <div className="h-4 w-56 bg-surface-muted rounded animate-pulse" />
        <div className="h-5 w-32 bg-primary/10 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card-bg border border-border-subtle rounded-xl p-4.5 h-40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
