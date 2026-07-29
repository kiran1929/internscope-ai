import React from 'react';
import { OpportunityRepository } from '@/lib/repositories/opportunity';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  DollarSign,
  Tag,
  Clock,
  Compass,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OpportunityDetailPage(props: PageProps) {
  const { id } = await props.params;

  // 1. Fetch opportunity specifications
  const opp = await OpportunityRepository.findById(id);

  if (!opp) {
    notFound();
  }

  const isExpired = opp.deadline && new Date(opp.deadline) < new Date();

  return (
    <div className="space-y-6 select-none animate-fade-in text-white max-w-5xl">
      {/* Top Navigation & Edit Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <Link
          href="/admin/opportunities"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to opportunities
        </Link>
        <Link
          href={`/admin/opportunities/${opp.id}/edit`}
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0"
        >
          <Edit className="w-4 h-4" /> Edit Job Specifications
        </Link>
      </div>

      {/* Main Opportunity Title Shell */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {opp.company.logoUrl ? (
            <img
              src={opp.company.logoUrl}
              alt={opp.company.name}
              className="w-12 h-12 rounded-lg border border-zinc-800 bg-white object-contain p-0.5 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-center text-sm text-zinc-400 font-bold font-display uppercase shrink-0">
              {opp.company.name.charAt(0)}
            </div>
          )}
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">
              {opp.title}
            </h2>
            <p className="text-xs text-primary font-medium flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> {opp.company.name}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {opp.isArchived ? (
            <span className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Archived
            </span>
          ) : isExpired ? (
            <span className="px-3 py-1 rounded-full border border-red-500/10 bg-red-500/5 text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Expired
            </span>
          ) : !opp.isActive ? (
            <span className="px-3 py-1 rounded-full border border-amber-500/10 bg-amber-500/5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              Draft
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-bold text-primary uppercase tracking-wider">
              Published
            </span>
          )}
        </div>
      </div>

      {/* Grid Specs Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left main: Specs Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              Job Description
            </h3>
            <div className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap font-sans">
              {opp.description || 'No description provided for this opportunity.'}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              Requirements
            </h3>
            <div className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap font-sans">
              {opp.requirements || 'No specific requirements have been listed.'}
            </div>
          </div>
        </div>

        {/* Right side: Metadata specs card */}
        <div className="space-y-6">
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
              Metadata Specifications
            </h3>

            <div className="space-y-4 text-xs">
              {/* Type */}
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-text-muted flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> Type
                </span>
                <span className="text-white font-semibold uppercase">{opp.type.replace('_', ' ')}</span>
              </div>

              {/* Remote */}
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-text-muted flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Work Style
                </span>
                <span className="text-white font-semibold uppercase">{opp.remoteType}</span>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-text-muted">Location</span>
                <span className="text-white font-semibold truncate max-w-[150px]">{opp.location}</span>
              </div>

              {/* Salary */}
              {opp.salaryRange && (
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Salary Range
                  </span>
                  <span className="text-white font-semibold">{opp.salaryRange}</span>
                </div>
              )}

              {/* Deadline */}
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Deadline
                </span>
                <span className={cn('font-semibold', isExpired ? 'text-red-400' : 'text-white')}>
                  {opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'No deadline'}
                </span>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Created Date
                </span>
                <span className="text-zinc-400">{new Date(opp.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-text-muted">Last Updated</span>
                <span className="text-zinc-400">{new Date(opp.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Application link */}
            <a
              href={opp.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Visit Application Page
            </a>
          </div>

          {/* Tags list */}
          {opp.tags.length > 0 && (
            <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-1.5 text-white">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-[10px] uppercase font-bold tracking-wider">Opportunity Tags</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {opp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-300 font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
