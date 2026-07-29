'use client';

import React, { useState, useTransition, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  MoreVertical,
  Eye,
  Paperclip,
  Loader2,
  ChevronDown,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApplicationStatus } from '@/lib/generated/prisma/enums';
import { updateApplicationStatusAction } from '@/app/actions/applications';

export interface TableApplication {
  id: string;
  userId: string;
  opportunityId: string;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: Date;
  updatedAt: Date;
  user: {
    email: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      resumeUrl: string | null;
    } | null;
  };
  opportunity: {
    title: string;
    type: string;
    company: {
      name: string;
      logoUrl: string | null;
    };
  };
}

interface ApplicationsTableProps {
  data: TableApplication[];
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({ data }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeStatusSelectorId, setActiveStatusSelectorId] = useState<string | null>(null);

  const handleStatusChange = useCallback((id: string, newStatus: ApplicationStatus) => {
    setActiveStatusSelectorId(null);
    startTransition(async () => {
      const res = await updateApplicationStatusAction(id, newStatus);
      if (res.success) {
        toast.success(`Application status updated to ${newStatus}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }, [router]);

  const columns = React.useMemo<ColumnDef<TableApplication>[]>(
    () => [
      {
        accessorKey: 'applicant',
        header: 'Applicant',
        cell: ({ row }) => {
          const u = row.original.user;
          const displayName = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || 'Anonymous';
          const initials = u.profile?.firstName ? u.profile.firstName.charAt(0) : (displayName ? displayName.charAt(0) : u.email.charAt(0));
          const avatar = u.profile?.avatarUrl;

          return (
            <div className="flex items-center gap-3">
              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName}
                  className="w-8 h-8 rounded-full border border-zinc-800 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-850 border border-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-bold uppercase shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <Link
                  href={`/admin/users/${row.original.userId}`}
                  className="font-semibold text-white hover:text-primary transition-colors truncate text-xs block"
                >
                  {displayName}
                </Link>
                <span className="text-[10px] text-text-muted block truncate font-mono">
                  {u.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'opportunity',
        header: 'Opportunity',
        cell: ({ row }) => {
          const opp = row.original.opportunity;
          return (
            <div className="min-w-0 max-w-[200px]">
              <Link
                href={`/admin/opportunities/${row.original.opportunityId}`}
                className="font-semibold text-white hover:text-primary transition-colors truncate text-xs block"
              >
                {opp.title}
              </Link>
              <span className="text-[10px] text-text-muted block truncate uppercase tracking-wide">
                {opp.type.replace('_', ' ')}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ row }) => {
          const comp = row.original.opportunity.company;
          const name = comp.name;
          const logo = comp.logoUrl;

          return (
            <div className="flex items-center gap-2">
              {logo ? (
                <img
                  src={logo}
                  alt={name}
                  className="w-6 h-6 rounded border border-zinc-800 bg-white object-contain p-0.5 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded bg-zinc-850 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold uppercase shrink-0">
                  {name.charAt(0)}
                </div>
              )}
              <span className="text-xs text-zinc-300 truncate max-w-[120px]">{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const app = row.original;
          const status = app.status;
          const isSelectorOpen = activeStatusSelectorId === app.id;

          let badgeColor = 'border-zinc-800 bg-zinc-900 text-zinc-300';
          if (status === ApplicationStatus.APPLIED) badgeColor = 'border-blue-500/20 bg-blue-500/5 text-blue-400';
          if (status === ApplicationStatus.INTERVIEWING) badgeColor = 'border-amber-500/20 bg-amber-500/5 text-amber-400';
          if (status === ApplicationStatus.OFFERED) badgeColor = 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400';
          if (status === ApplicationStatus.REJECTED) badgeColor = 'border-red-500/20 bg-red-500/5 text-red-400';

          return (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStatusSelectorId(isSelectorOpen ? null : app.id);
                }}
                className={cn(
                  'px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:border-zinc-700 transition-all cursor-pointer',
                  badgeColor
                )}
              >
                {status} <ChevronDown className="w-3 h-3 text-text-muted" />
              </button>

              {isSelectorOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setActiveStatusSelectorId(null)}
                  />
                  <div className="absolute left-0 mt-1.5 w-36 bg-zinc-950 border border-zinc-850 rounded-lg shadow-xl py-1 z-20 animate-fade-in text-[10px] font-bold uppercase tracking-wider">
                    {Object.values(ApplicationStatus).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(app.id, st)}
                        className={cn(
                          'w-full text-left px-3 py-1.5 hover:bg-zinc-900 transition-colors cursor-pointer',
                          st === status ? 'text-primary' : 'text-zinc-400 hover:text-white'
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'resume',
        header: 'Resume',
        cell: ({ row }) => {
          const resume = row.original.user.profile?.resumeUrl;
          if (resume) {
            return (
              <a
                href={resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Paperclip className="w-3.5 h-3.5" /> Resume
              </a>
            );
          }
          return <span className="text-xs text-zinc-600">None</span>;
        },
      },
      {
        accessorKey: 'appliedAt',
        header: 'Applied Date',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs text-text-muted font-mono">
            <Calendar className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
            <span>{new Date(row.original.appliedAt).toLocaleDateString()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => (
          <span className="text-xs text-text-muted font-mono">
            {new Date(row.original.updatedAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const app = row.original;
          const isOpen = activeMenuId === app.id;
          return (
            <div className="relative flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(isOpen ? null : app.id);
                }}
                className="p-1 rounded hover:bg-zinc-850 text-text-muted hover:text-white transition-all cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setActiveMenuId(null)}
                  />
                  <div className="absolute right-0 mt-6 w-36 bg-zinc-950 border border-zinc-850 rounded-lg shadow-xl py-1 z-20 animate-fade-in text-xs">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
                      onClick={() => setActiveMenuId(null)}
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </Link>
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [activeMenuId, activeStatusSelectorId, handleStatusChange]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm relative text-white">
      {isPending && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-30">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-900 bg-zinc-950/40">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 text-[10px] uppercase font-bold text-text-muted tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-xs text-text-muted">
                  No applications matched the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}
