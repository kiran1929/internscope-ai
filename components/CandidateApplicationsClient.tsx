'use client';

import React, { useState, useTransition } from 'react';
import { Briefcase, Calendar, Trash2, CheckCircle2, ChevronRight, X, FileText, Loader2, Plus, Edit } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { upsertApplicationAction, deleteApplicationAction } from '@/app/actions/candidate';
import { CandidateApplicationStatus } from '@/types/candidate';

interface ApplicationItem {
  id: string;
  status: string;
  notes: string | null;
  appliedAt: Date;
  updatedAt: Date;
  opportunity: {
    id: string;
    title: string;
    location: string;
    company: {
      name: string;
      logoUrl: string | null;
    };
  };
}

interface CandidateApplicationsClientProps {
  applications: ApplicationItem[];
}

export default function CandidateApplicationsClient({
  applications,
}: CandidateApplicationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active edit application modal state
  const [editingApp, setEditingApp] = useState<ApplicationItem | null>(null);
  const [editStatus, setEditStatus] = useState<CandidateApplicationStatus>('DISCOVERED');
  const [editNotes, setEditNotes] = useState('');

  // Tracking columns config
  const columns: { id: CandidateApplicationStatus; label: string; color: string; border: string }[] = [
    { id: 'DISCOVERED', label: 'Discovered', color: 'bg-zinc-800/40 text-zinc-400', border: 'border-zinc-900' },
    { id: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-blue-500/10 text-blue-400', border: 'border-blue-500/20' },
    { id: 'PREPARING', label: 'Preparing', color: 'bg-purple-500/10 text-purple-400', border: 'border-purple-500/20' },
    { id: 'APPLIED', label: 'Applied', color: 'bg-indigo-500/10 text-indigo-400', border: 'border-indigo-500/20' },
    { id: 'OA', label: 'OA / Test', color: 'bg-amber-500/10 text-amber-400', border: 'border-amber-500/20' },
    { id: 'INTERVIEW', label: 'Interview', color: 'bg-primary/10 text-primary', border: 'border-primary/20' },
    { id: 'OFFER', label: 'Offer', color: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/20' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-red-500/10 text-red-400', border: 'border-red-500/20' },
    { id: 'WITHDRAWN', label: 'Withdrawn', color: 'bg-zinc-700/30 text-zinc-500', border: 'border-zinc-800' }
  ];

  const getNextStatus = (current: string): CandidateApplicationStatus | null => {
    switch (current) {
      case 'DISCOVERED': return 'SHORTLISTED';
      case 'SHORTLISTED': return 'PREPARING';
      case 'PREPARING': return 'APPLIED';
      case 'APPLIED': return 'OA';
      case 'OA': return 'INTERVIEW';
      case 'INTERVIEW': return 'OFFER';
      default: return null;
    }
  };

  const handleAdvance = (app: ApplicationItem) => {
    const next = getNextStatus(app.status);
    if (!next) return;

    startTransition(async () => {
      const res = await upsertApplicationAction(app.opportunity.id, next, app.notes || '');
      if (res.success) {
        toast.success(`Application advanced to: ${next.toLowerCase()}`);
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteApplicationAction(id);
      if (res.success) {
        toast.success('Application untracked.');
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    startTransition(async () => {
      const res = await upsertApplicationAction(editingApp.opportunity.id, editStatus, editNotes);
      if (res.success) {
        toast.success('Application notes and status updated.');
        setEditingApp(null);
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  const openEditModal = (app: ApplicationItem) => {
    setEditingApp(app);
    setEditStatus(app.status as CandidateApplicationStatus);
    setEditNotes(app.notes || '');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">Applications Funnel</h2>
          <p className="text-xs text-zinc-400 mt-1">Track pipeline progress, log online assessments, and save interview preparation notes.</p>
        </div>
        <Link
          href="/internships"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-xs font-semibold text-white transition-all w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Track New Job</span>
        </Link>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const colApps = applications.filter((app) => app.status === column.id);

          return (
            <div key={column.id} className="space-y-3 min-w-[180px] flex-1">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${column.color}`}>
                  {column.label}
                </span>
                <span className="text-[10px] font-mono font-bold text-zinc-500">{colApps.length}</span>
              </div>

              {/* Column Cards */}
              <div className="space-y-2.5 min-h-[420px] bg-zinc-950/20 border border-zinc-900 rounded-xl p-2">
                {colApps.length > 0 ? (
                  colApps.map((app) => {
                    const next = getNextStatus(app.status);

                    return (
                      <div
                        key={app.id}
                        className={`bg-[#111113] border rounded-xl p-3 space-y-3 hover:border-zinc-800 hover:shadow-md transition-all duration-200 ${column.border}`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="truncate">
                            <Link href={`/jobs/${app.opportunity.id}`} className="text-xs font-bold text-zinc-200 hover:text-primary transition-colors block truncate max-w-[110px]" title={app.opportunity.title}>
                              {app.opportunity.title}
                            </Link>
                            <p className="text-[9px] text-zinc-500 font-semibold truncate max-w-[110px]">
                              {app.opportunity.company.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(app)}
                              className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950 transition-colors"
                              title="Edit Notes"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(app.id)}
                              className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-950 transition-colors"
                              title="Delete tracker"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {app.notes && (
                          <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                            <p className="text-[9px] text-zinc-400 leading-relaxed line-clamp-3">
                              {app.notes}
                            </p>
                          </div>
                        )}

                        <div className="text-[8px] text-zinc-500 font-mono flex items-center justify-between border-t border-zinc-900 pt-2">
                          <span>Updated: {new Date(app.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          {next && (
                            <button
                              onClick={() => handleAdvance(app)}
                              className="text-primary hover:text-blue-400 font-bold flex items-center gap-0.5"
                              title={`Advance stage`}
                            >
                              <span>Next</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-[9px] text-zinc-650 font-medium">
                    Empty Column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Notes & Stage Dialog */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <form
            onSubmit={handleEditSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-fade-in text-xs space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>Update Application Details</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">Configure status stage and timeline logs for: {editingApp.opportunity.title}</p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-400">Application Stage</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as CandidateApplicationStatus)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary"
              >
                <option value="DISCOVERED">Discovered</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="PREPARING">Preparing</option>
                <option value="APPLIED">Applied</option>
                <option value="OA">OA / Test</option>
                <option value="INTERVIEW">Interviewing</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-400">Personal Notes / Timeline Updates</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                placeholder="Update your interview schedule, contacts, or feedback notes here..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-white outline-none focus:border-primary placeholder-zinc-650 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="px-3.5 py-1.5 border border-zinc-800 bg-zinc-950 text-zinc-300 rounded-lg hover:bg-zinc-900 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg font-bold transition-all shadow-md flex items-center gap-1.5 hover:cursor-pointer"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Updates</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
