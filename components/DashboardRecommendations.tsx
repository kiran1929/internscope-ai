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
    <div className="lg:col-span-2 space-y-6">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Personalized AI Recommendations
        </h3>
        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
          Live Matching Active
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-card-bg border border-border-subtle rounded-2xl p-10 text-center text-text-muted space-y-3">
          <AlertCircle className="w-8 h-8 text-text-muted/40 mx-auto" />
          <p className="text-xs sm:text-sm">No matching opportunities found. Update your skills in profile setup.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {recommendations.map((job) => (
            <div
              key={job.id}
              className="group relative bg-card-bg border border-border-subtle hover:border-primary/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 gap-5 shadow-2xs"
            >
              <div className="space-y-4">
                {/* Header: Logo, Company Name, Match Pill & Type Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyLogo
                      logoUrl={job.company.logoUrl}
                      websiteUrl={job.company.websiteUrl}
                      applicationUrl={job.applicationUrl}
                      name={job.company.name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-muted truncate">
                        {job.company.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-text-muted/70" />
                        <span className="truncate">{job.location || 'Remote'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                      {job.matchScore}% Match
                    </span>
                    <span className="text-[9px] px-2.5 py-0.5 rounded-full border border-border-subtle bg-surface-muted font-medium text-text-muted capitalize">
                      {job.type.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors block line-clamp-2 leading-snug"
                    title={job.title}
                  >
                    {job.title}
                  </Link>
                </div>

                {/* Skills tags */}
                {job.enrichment?.skills && job.enrichment.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.enrichment.skills.slice(0, 3).map((skill: string) => (
                      <span
                        key={skill}
                        className="text-[10px] bg-surface-muted text-text-muted border border-border-subtle px-2.5 py-1 rounded-lg font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer: Salary & Apply Action */}
              <div className="border-t border-border-subtle pt-3 flex items-center justify-between text-xs">
                <span className="text-text-muted text-xs font-semibold font-mono">
                  {job.enrichment?.salaryMin
                    ? `$${Math.round(job.enrichment.salaryMin / 1000)}k+/yr`
                    : 'Salary undisclosed'}
                </span>

                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-semibold text-xs transition-all duration-200 cursor-pointer shadow-2xs"
                >
                  Apply Now <ExternalLink className="w-3.5 h-3.5" />
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
