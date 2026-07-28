'use client';

import React, { useState } from 'react';
import { Plus, Calendar, Trash2, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { Application, ApplicationStatus } from '@/types';
import { CompanyLogo } from './CompanyLogo';
import { cn } from '@/lib/utils';

interface DashboardApplicationsProps {
  applications: Application[];
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => void;
  onDeleteApplication: (id: string) => void;
  onAddApplication: (app: Omit<Application, 'id' | 'lastUpdated'>) => void;
}

export const DashboardApplications: React.FC<DashboardApplicationsProps> = ({
  applications,
  onUpdateStatus,
  onDeleteApplication,
  onAddApplication
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('saved');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [newNextStep, setNewNextStep] = useState('');

  const columns: { id: ApplicationStatus; label: string; color: string; border: string }[] = [
    { id: 'saved', label: 'Saved', color: 'bg-zinc-800/40 text-text-muted', border: 'border-zinc-800' },
    { id: 'applied', label: 'Applied', color: 'bg-indigo-500/10 text-indigo-400', border: 'border-indigo-500/20' },
    { id: 'interviewing', label: 'Interviewing', color: 'bg-primary/10 text-primary', border: 'border-primary/20' },
    { id: 'offered', label: 'Offered', color: 'bg-success/10 text-success', border: 'border-success/20' },
    { id: 'rejected', label: 'Rejected / Archived', color: 'bg-danger/10 text-danger', border: 'border-danger/20' },
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newRole) return;

    onAddApplication({
      internshipId: `custom_${Date.now()}`,
      companyName: newCompanyName,
      companyLogo: 'CUSTOM', // Trigger default logo initials
      role: newRole,
      status: newStatus,
      appliedDate: newDate,
      notes: newNotes || undefined,
      nextStep: newNextStep || undefined
    });

    // Reset Form
    setNewCompanyName('');
    setNewRole('');
    setNewStatus('saved');
    setNewNotes('');
    setNewNextStep('');
    setShowAddModal(false);
  };

  const getNextStatus = (current: ApplicationStatus): ApplicationStatus | null => {
    switch (current) {
      case 'saved': return 'applied';
      case 'applied': return 'interviewing';
      case 'interviewing': return 'offered';
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Application Pipeline</h2>
          <p className="text-xs text-text-muted">Track progress, interview notes, and upcoming milestones</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-700 text-xs font-semibold text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-primary/15"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Application</span>
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 select-none">
        {columns.map((column) => {
          const colApps = applications.filter((app) => app.status === column.id);

          return (
            <div key={column.id} className="space-y-3 min-w-[220px] flex-1">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md', column.color)}>
                  {column.label}
                </span>
                <span className="text-[10px] font-mono font-bold text-text-muted">{colApps.length}</span>
              </div>

              {/* Column Cards */}
              <div className="space-y-2.5 min-h-[400px] bg-zinc-950/40 border border-zinc-900 rounded-xl p-2">
                {colApps.length > 0 ? (
                  colApps.map((app) => {
                    const next = getNextStatus(app.status);

                    return (
                      <div
                        key={app.id}
                        className={cn(
                          'bg-[#18181B] border rounded-lg p-3.5 space-y-3 hover:border-zinc-700 transition-all duration-150',
                          column.border
                        )}
                      >
                        <div className="flex items-start gap-2.5 justify-between">
                          <div className="flex items-center gap-2">
                            <CompanyLogo logo={app.companyLogo} name={app.companyName} size="sm" />
                            <div>
                              <h4 className="text-xs font-bold text-white leading-tight truncate max-w-[100px]" title={app.role}>
                                {app.role}
                              </h4>
                              <p className="text-[9px] text-text-muted leading-none mt-0.5">{app.companyName}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteApplication(app.id)}
                            className="p-1 rounded text-text-muted hover:text-danger hover:bg-zinc-850 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {app.notes && (
                          <div className="bg-zinc-900/40 p-2 rounded border border-zinc-850/50">
                            <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2">
                              {app.notes}
                            </p>
                          </div>
                        )}

                        {app.nextStep && (
                          <div className="text-[9px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[130px]" title={app.nextStep}>Next: {app.nextStep}</span>
                          </div>
                        )}

                        <div className="text-[9px] text-text-muted font-mono flex items-center justify-between border-t border-zinc-900/60 pt-2">
                          <span>Date: {app.appliedDate}</span>
                          {next && (
                            <button
                              onClick={() => onUpdateStatus(app.id, next)}
                              className="text-[9px] text-primary hover:text-blue-400 font-bold flex items-center gap-0.5"
                              title={`Promote to ${next}`}
                            >
                              <span>Advance</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          {app.status === 'offered' && (
                            <span className="text-success font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Offered
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="text-danger font-bold">Archived</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-[10px] text-text-muted/60">
                    Empty column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-sm font-bold text-white mb-4">Add Custom Application</h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-text-muted">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, Airbnb"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-muted">Job Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backend Engineering Intern"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-text-muted">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected / Archived</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-text-muted">Action Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-muted font-display">Notes</label>
                <textarea
                  placeholder="Add notes about submission, links, or contact names..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-muted">Next Step (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule phone screen, tech challenge"
                  value={newNextStep}
                  onChange={(e) => setNewNextStep(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-zinc-800 rounded-lg font-semibold hover:bg-zinc-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md shadow-primary/10"
                >
                  Create Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardApplications;
