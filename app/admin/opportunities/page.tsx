import React from 'react';
import { prisma } from '@/lib/db';
import { AlertCircle, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOpportunitiesPage() {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      company: true,
    },
  });

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Manage Opportunities
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Browse and coordinate all active, archived, or drafted postings in the database.
          </p>
        </div>
        <button
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-not-allowed opacity-50"
          disabled
          title="CRUD operations are disabled in this phase."
        >
          <Plus className="w-4 h-4" /> Add Opportunity
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase text-text-muted tracking-wider bg-zinc-900/10 font-bold">
                <th className="px-6 py-3.5">Opportunity</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Remote</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-xs">
              {opportunities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                    No opportunities found in the system database.
                  </td>
                </tr>
              ) : (
                opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-zinc-900/25 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white block">{opp.title}</span>
                      <span className="text-[10px] text-text-muted mt-0.5 block truncate max-w-xs">{opp.id}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-medium">{opp.company.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-[10px] text-text-muted font-medium">
                        {opp.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{opp.location}</td>
                    <td className="px-6 py-4 text-text-muted">{opp.remoteType}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${opp.isActive ? 'text-primary' : 'text-zinc-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${opp.isActive ? 'bg-primary' : 'bg-zinc-500'}`} />
                        {opp.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] text-text-muted hover:text-white cursor-not-allowed uppercase font-medium">
                        Edit
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
