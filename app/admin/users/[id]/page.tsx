import React from 'react';
import { UserRepository } from '@/lib/repositories/user';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Shield,
  Clock,
  Compass,
  Briefcase,
  Bookmark,
  Award,
  Bell,
  Github,
  Linkedin,
  Globe,
  Check,
  AlertCircle,
  Tag,
  Calendar,
  X,
  ExternalLink
} from 'lucide-react';
import { Role } from '@/lib/generated/prisma/enums';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserProfilePage(props: PageProps) {
  const { id } = await props.params;

  // 1. Fetch user complete profile details
  const user = await UserRepository.findById(id);

  if (!user) {
    notFound();
  }

  const p = user.profile;
  const displayName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Anonymous User';
  const initials = p?.firstName ? p.firstName.charAt(0) : (displayName ? displayName.charAt(0) : user.email.charAt(0));

  // Calculate profile completion
  const getProfileCompletion = () => {
    if (!p) return 0;
    const fields = [
      p.firstName,
      p.lastName,
      p.avatarUrl,
      p.resumeUrl,
      p.githubUrl,
      p.linkedinUrl,
      p.portfolioUrl,
      p.graduationYear,
      p.major,
      p.skills && p.skills.length > 0 ? p.skills : null
    ];
    const filled = fields.filter((x) => x !== null && x !== undefined && x !== '').length;
    return Math.round((filled / fields.length) * 100);
  };
  const pct = getProfileCompletion();

  // Combine application actions & joined event into a unified timeline
  interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    date: Date;
    type: 'joined' | 'applied' | 'saved';
  }

  const timelineEvents: TimelineEvent[] = [
    {
      id: 'join',
      title: 'Joined InternScope AI',
      description: 'Account successfully registered and profile initialized.',
      date: new Date(user.createdAt),
      type: 'joined'
    }
  ];

  user.applications.forEach((app) => {
    timelineEvents.push({
      id: app.id,
      title: `Applied: ${app.opportunity.title}`,
      description: `Application status updated to ${app.status} at ${app.opportunity.company.name}.`,
      date: new Date(app.appliedAt),
      type: 'applied'
    });
  });

  // Sort timeline chronologically desc
  timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6 select-none animate-fade-in text-white max-w-5xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to users
        </Link>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - CRM Stats Card, Skills & Preferences */}
        <div className="space-y-6">
          {/* Main User Card */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-zinc-900">
              {p?.avatarUrl ? (
                <img
                  src={p.avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-full border border-zinc-800 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-850 border border-zinc-850 flex items-center justify-center text-xl text-zinc-400 font-bold uppercase">
                  {initials}
                </div>
              )}
              
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white tracking-tight">{displayName}</h2>
                <span className="text-[10px] text-text-muted font-mono">{user.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                  user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN
                    ? 'border-red-500/20 bg-red-500/5 text-red-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-300'
                }`}>
                  {user.role}
                </span>

                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                  user.isActive
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500'
                }`}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-text-muted font-mono font-semibold">
                <span>Profile Completion</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-950">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-350"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* User Details list */}
            <div className="space-y-3.5 pt-2 text-xs text-text-muted">
              {p?.major && (
                <div className="flex items-start justify-between">
                  <span>Major</span>
                  <span className="text-zinc-200 font-semibold text-right truncate max-w-[150px]">{p.major}</span>
                </div>
              )}
              {p?.graduationYear && (
                <div className="flex items-start justify-between">
                  <span>Graduation</span>
                  <span className="text-zinc-200 font-semibold font-mono">{p.graduationYear}</span>
                </div>
              )}
              <div className="flex items-start justify-between">
                <span>Joined</span>
                <span className="text-zinc-200 font-semibold font-mono">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Resume link */}
            {p?.resumeUrl && (
              <div className="pt-2">
                <a
                  href={p.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
                >
                  <Compass className="w-3.5 h-3.5" /> Open Resume Link
                </a>
              </div>
            )}

            {/* Social links */}
            {(p?.linkedinUrl || p?.githubUrl || p?.portfolioUrl) && (
              <div className="flex items-center gap-3 justify-center pt-2">
                {p.linkedinUrl && (
                  <a
                    href={p.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-zinc-900 text-text-muted hover:text-white"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {p.githubUrl && (
                  <a
                    href={p.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-zinc-900 text-text-muted hover:text-white"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {p.portfolioUrl && (
                  <a
                    href={p.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-zinc-900 text-text-muted hover:text-white"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* User Skills list */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" /> Skills
            </h3>
            
            {p?.skills && p.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-300 font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No skills populated on user profile.</p>
            )}
          </div>

          {/* User Email Preferences */}
          {user.emailPreference && (
            <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">
                Email Preferences
              </h3>

              <div className="space-y-3 text-xs text-text-muted">
                <div className="flex items-center justify-between">
                  <span>Weekly Digest Reports</span>
                  {user.emailPreference.weeklyDigest ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <X className="w-4 h-4 text-zinc-700" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Instant Match Alerts</span>
                  {user.emailPreference.instantAlerts ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <X className="w-4 h-4 text-zinc-700" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Deadline Reminders</span>
                  {user.emailPreference.deadlineReminders ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <X className="w-4 h-4 text-zinc-700" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Timeline, Saved & Applications */}
        <div className="md:col-span-2 space-y-6">
          {/* Applications list */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-primary" /> Application History ({user.applications.length})
            </h3>

            <div className="space-y-3">
              {user.applications.length > 0 ? (
                user.applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-900 hover:border-zinc-850 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/opportunities/${app.opportunityId}`}
                        className="text-xs font-semibold text-zinc-200 hover:text-primary transition-colors block truncate"
                      >
                        {app.opportunity.title}
                      </Link>
                      <span className="text-[10px] text-text-muted block truncate mt-0.5">
                        {app.opportunity.company.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-[9px] font-bold text-zinc-300 uppercase tracking-wider">
                        {app.status}
                      </span>
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="p-1 rounded hover:bg-zinc-900 text-text-muted hover:text-white transition-all"
                        title="View Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-muted">No applications submitted yet.</p>
              )}
            </div>
          </div>

          {/* Saved Opportunities list */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-primary" /> Saved Opportunities ({user.savedOpportunities.length})
            </h3>

            <div className="space-y-3">
              {user.savedOpportunities.length > 0 ? (
                user.savedOpportunities.map((item) => (
                  <div
                    key={item.opportunityId}
                    className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-900 hover:border-zinc-850 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/opportunities/${item.opportunityId}`}
                        className="text-xs font-semibold text-zinc-200 hover:text-primary transition-colors block truncate"
                      >
                        {item.opportunity.title}
                      </Link>
                      <span className="text-[10px] text-text-muted block truncate mt-0.5">
                        {item.opportunity.company.name}
                      </span>
                    </div>

                    <Link
                      href={`/admin/opportunities/${item.opportunityId}`}
                      className="p-1 rounded hover:bg-zinc-900 text-text-muted hover:text-white transition-all shrink-0"
                      title="View Opportunity"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-muted">No opportunities saved.</p>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" /> Activity Timeline
            </h3>

            <div className="space-y-4 pt-2">
              {timelineEvents.map((evt, idx) => (
                <div key={evt.id + idx} className="relative pl-6 pb-2 last:pb-0">
                  {/* Timeline bar line */}
                  {idx !== timelineEvents.length - 1 && (
                    <div className="absolute left-2 top-2.5 bottom-0 w-0.5 bg-zinc-900" />
                  )}
                  {/* Dot */}
                  <div className="absolute left-0.5 top-1 w-3.5 h-3.5 rounded-full border border-zinc-850 bg-zinc-950 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-bold text-white">{evt.title}</p>
                      <span className="text-[9px] text-text-muted font-mono shrink-0">
                        {evt.date.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted leading-relaxed">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
