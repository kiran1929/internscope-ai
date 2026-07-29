import React from 'react';
import { prisma } from '@/lib/db';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApplicationStatus } from '@/lib/generated/prisma/enums';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationsPage() {
  const applications = await prisma.application.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      opportunity: {
        include: {
          company: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            User Applications
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Browse all user application lifecycle submissions recorded across pipelines.
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase text-text-muted tracking-wider bg-zinc-900/10 font-bold">
                <th className="px-6 py-3.5">Candidate</th>
                <th className="px-6 py-3.5">Opportunity</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Pipeline Status</th>
                <th className="px-6 py-3.5">Applied Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-xs">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                    No applications recorded in the database.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-zinc-900/25 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {app.user.profile?.avatarUrl ? (
                        <img
                          src={app.user.profile.avatarUrl}
                          alt="Avatar"
                          className="w-7 h-7 rounded-full border border-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white">
                          {app.user.profile?.firstName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-white block">
                          {app.user.profile?.firstName || 'Candidate'} {app.user.profile?.lastName || ''}
                        </span>
                        <span className="text-[10px] text-text-muted block truncate max-w-xs">{app.user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-semibold">{app.opportunity.title}</td>
                    <td className="px-6 py-4 text-text-muted">{app.opportunity.company.name}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wider uppercase',
                        app.status === ApplicationStatus.OFFERED && 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                        app.status === ApplicationStatus.INTERVIEWING && 'text-primary bg-primary/10 border-primary/20',
                        app.status === ApplicationStatus.APPLIED && 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                        app.status === ApplicationStatus.SAVED && 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
                        app.status === ApplicationStatus.REJECTED && 'text-red-400 bg-red-500/10 border-red-500/20'
                      )}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{app.appliedAt.toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] text-text-muted hover:text-white cursor-not-allowed uppercase font-medium">
                        View
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Notice Banner */}
      <div className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-white">CRUD Restrictions Active</p>
          <p className="text-[10px] text-text-muted leading-relaxed">
            In compliance with current product phases, CMS create, update, and delete actions are locked down. You can view all records directly synced from our Neon database instance.
          </p>
        </div>
      </div>
    </div>
  );
}
