import React from 'react';
import { prisma } from '@/lib/db';
import { Plus, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { opportunities: true },
      },
    },
  });

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Manage Companies
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Browse and coordinate company profiles and linked postings in the system.
          </p>
        </div>
        <button
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-not-allowed opacity-50"
          disabled
        >
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase text-text-muted tracking-wider bg-zinc-900/10 font-bold">
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Industry</th>
                <th className="px-6 py-3.5">Opportunities Count</th>
                <th className="px-6 py-3.5">Website</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-xs">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    No companies tracked in the database.
                  </td>
                </tr>
              ) : (
                companies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-zinc-900/25 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {comp.logoUrl ? (
                        <img
                          src={comp.logoUrl}
                          alt={comp.name}
                          className="w-7 h-7 rounded bg-white object-contain p-0.5 border border-zinc-800"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white">
                          C
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-white block">{comp.name}</span>
                        <span className="text-[10px] text-text-muted block truncate max-w-xs">{comp.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-medium">{comp.industry || 'N/A'}</td>
                    <td className="px-6 py-4 text-text-muted font-mono">{comp._count.opportunities} roles</td>
                    <td className="px-6 py-4">
                      {comp.websiteUrl ? (
                        <a
                          href={comp.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visit site
                        </a>
                      ) : (
                        <span className="text-zinc-600">N/A</span>
                      )}
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
