import React from 'react';
import Link from 'next/link';
import { Compass, AlertCircle, ExternalLink } from 'lucide-react';
import { getPersonalizedRecommendations } from '@/app/actions/candidate';

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
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-primary" /> Personalized AI Recommendations
        </h3>
        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase">
          Real-time matching active
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-8 text-center text-zinc-500 space-y-2">
          <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto" />
          <p className="text-xs">No matching opportunities found. Update your skills in profile setup.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommendations.map((job) => (
            <div
              key={job.id}
              className="bg-[#111113] border border-zinc-850 hover:border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-xs font-bold text-zinc-100 hover:text-primary transition-colors block truncate max-w-[170px]"
                    >
                      {job.title}
                    </Link>
                    <p className="text-[10px] text-zinc-500 font-semibold">{job.company.name}</p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-950 font-mono text-zinc-400 capitalize">
                    {job.type.toLowerCase().replace('_', ' ')}
                  </span>
                </div>

                <p className="text-[10px] text-zinc-400 font-mono">{job.location}</p>

                {job.enrichment?.skills && job.enrichment.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {job.enrichment.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-[8px] bg-zinc-950 text-zinc-400 border border-zinc-900 px-1.5 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-900 mt-4 pt-3 flex items-center justify-between text-[10px]">
                <span className="text-zinc-500 font-mono">
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
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
        <div className="h-4 w-56 bg-zinc-800/50 rounded animate-pulse" />
        <div className="h-5 w-32 bg-primary/10 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111113] border border-zinc-850 rounded-xl p-4 h-36 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
