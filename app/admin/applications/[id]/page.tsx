import React from 'react';
import { ApplicationRepository } from '@/lib/repositories/application';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  DollarSign,
  Clock,
  Briefcase,
  Compass,
  Paperclip,
  CheckCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApplicationStatus } from '@/lib/generated/prisma/enums';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ApplicationDetailPage(props: PageProps) {
  const { id } = await props.params;

  // 1. Fetch application details
  const app = await ApplicationRepository.findById(id);

  if (!app) {
    notFound();
  }

  const u = app.user;
  const p = u.profile;
  const displayName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Anonymous User';
  const initials = p?.firstName ? p.firstName.charAt(0) : (displayName ? displayName.charAt(0) : u.email.charAt(0));

  const opp = app.opportunity;
  const comp = opp.company;

  let badgeColor = 'border-zinc-800 bg-zinc-900 text-zinc-300';
  if (app.status === ApplicationStatus.APPLIED) badgeColor = 'border-blue-500/20 bg-blue-500/5 text-blue-400';
  if (app.status === ApplicationStatus.INTERVIEWING) badgeColor = 'border-amber-500/20 bg-amber-500/5 text-amber-400';
  if (app.status === ApplicationStatus.OFFERED) badgeColor = 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400';
  if (app.status === ApplicationStatus.REJECTED) badgeColor = 'border-red-500/20 bg-red-500/5 text-red-400';

  return (
    <div className="space-y-6 select-none animate-fade-in text-white max-w-5xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <Link
          href="/admin/applications"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to applications
        </Link>
      </div>

      {/* Main Title Card */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] text-primary uppercase font-bold tracking-wider font-mono">
            Application Details
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">
            {displayName} for {opp.title}
          </h2>
          <p className="text-xs text-text-muted">
            Tracked in company index at {comp.name}.
          </p>
        </div>

        {/* Status Indicator */}
        <span className={cn('px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider', badgeColor)}>
          {app.status}
        </span>
      </div>

      {/* Grid Layout Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Applicant Information */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
            Applicant Information
          </h3>

          <div className="flex items-start gap-4">
            {p?.avatarUrl ? (
              <img
                src={p.avatarUrl}
                alt={displayName}
                className="w-12 h-12 rounded-full border border-zinc-800 object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-850 border border-zinc-850 flex items-center justify-center text-sm text-zinc-400 font-bold uppercase shrink-0">
                {initials}
              </div>
            )}
            
            <div className="space-y-1.5 min-w-0">
              <Link
                href={`/admin/users/${app.userId}`}
                className="font-bold text-white hover:text-primary transition-colors text-sm"
              >
                {displayName}
              </Link>
              <span className="text-xs text-text-muted font-mono block truncate">{u.email}</span>
            </div>
          </div>

          <div className="space-y-3.5 pt-2 text-xs text-text-muted border-t border-zinc-900/60 mt-3">
            {p?.major && (
              <div className="flex items-start justify-between">
                <span>Field of Study</span>
                <span className="text-zinc-200 font-semibold truncate max-w-[200px]">{p.major}</span>
              </div>
            )}
            {p?.graduationYear && (
              <div className="flex items-start justify-between">
                <span>Graduation Year</span>
                <span className="text-zinc-200 font-semibold font-mono">{p.graduationYear}</span>
              </div>
            )}
            {p?.resumeUrl && (
              <div className="flex items-start justify-between">
                <span>Resume Upload</span>
                <a
                  href={p.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <Paperclip className="w-3.5 h-3.5" /> View document
                </a>
              </div>
            )}
          </div>
          
          <div className="pt-2">
            <Link
              href={`/admin/users/${app.userId}`}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
            >
              View User CRM Profile
            </Link>
          </div>
        </div>

        {/* Right: Opportunity Details */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
            Opportunity Details
          </h3>

          <div className="flex items-start gap-4">
            {comp.logoUrl ? (
              <img
                src={comp.logoUrl}
                alt={comp.name}
                className="w-12 h-12 rounded-lg border border-zinc-800 bg-white object-contain p-0.5 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-zinc-850 border border-zinc-850 flex items-center justify-center text-sm text-zinc-400 font-bold uppercase shrink-0">
                {comp.name.charAt(0)}
              </div>
            )}
            
            <div className="space-y-1 min-w-0">
              <Link
                href={`/admin/opportunities/${opp.id}`}
                className="font-bold text-white hover:text-primary transition-colors text-sm"
              >
                {opp.title}
              </Link>
              <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> {comp.name}
              </p>
            </div>
          </div>

          <div className="space-y-3.5 pt-2 text-xs text-text-muted border-t border-zinc-900/60 mt-3">
            <div className="flex items-start justify-between">
              <span>Work Type</span>
              <span className="text-zinc-200 font-semibold uppercase">{opp.type.replace('_', ' ')}</span>
            </div>
            <div className="flex items-start justify-between">
              <span>Work Location</span>
              <span className="text-zinc-200 font-semibold uppercase">{opp.location} ({opp.remoteType})</span>
            </div>
            {opp.salaryRange && (
              <div className="flex items-start justify-between">
                <span>Salary Range</span>
                <span className="text-zinc-200 font-semibold">{opp.salaryRange}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              href={`/admin/opportunities/${opp.id}`}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
            >
              View Opportunity CMS Details
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline Log */}
        <div className="md:col-span-2 bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" /> Application Timeline
          </h3>

          <div className="space-y-4 pt-2">
            {/* Timeline Item: Created */}
            <div className="relative pl-6 pb-2 border-l border-zinc-900">
              <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full border border-zinc-850 bg-zinc-950 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold text-white">Application Created</p>
                  <span className="text-[9px] text-text-muted font-mono">
                    {new Date(app.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted">Opportunity saved or registered on user workspace dashboard.</p>
              </div>
            </div>

            {/* Timeline Item: Last Active */}
            <div className="relative pl-6">
              <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full border border-zinc-850 bg-zinc-950 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold text-white">Last Status Transition</p>
                  <span className="text-[9px] text-text-muted font-mono">
                    {new Date(app.updatedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted">Status was updated to <strong className="text-zinc-300 font-bold font-mono">{app.status}</strong>.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes (Placeholder) */}
        <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" /> Notes & Logs
          </h3>

          <textarea
            readOnly
            defaultValue={app.notes || ''}
            placeholder="No administrative notes or logs have been recorded for this application."
            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700 outline-none resize-none font-mono cursor-not-allowed h-32"
          />
        </div>
      </div>
    </div>
  );
}
