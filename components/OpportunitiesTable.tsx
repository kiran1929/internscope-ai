'use client';

import React, { useState, useTransition } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Compass,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  UploadCloud,
  DownloadCloud,
  Trash2,
  AlertTriangle,
  Loader2,
  Archive
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  togglePublishOpportunityAction,
  archiveOpportunityAction,
  deleteOpportunityAction,
} from '@/app/actions/opportunities';

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Opportunity {
  id: string;
  title: string;
  type: string;
  location: string;
  remoteType: string;
  deadline: Date | null;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  company: Company;
}

interface OpportunitiesTableProps {
  data: Opportunity[];
}

export const OpportunitiesTable: React.FC<OpportunitiesTableProps> = ({ data }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Define table columns
  const columns = React.useMemo<ColumnDef<Opportunity>[]>(
    () => [
      {
        id: 'companyLogo',
        header: '',
        accessorFn: (row) => row.company.logoUrl,
        cell: (info) => {
          const logo = info.getValue() as string | null;
          const name = info.row.original.company.name;
          return (
            <div className="flex items-center justify-center shrink-0">
              {logo ? (
                <img
                  src={logo}
                  alt={name}
                  className="w-7 h-7 rounded-md border border-zinc-800 bg-white object-contain p-0.5"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-zinc-850 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold font-display uppercase">
                  {name.charAt(0)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => (
          <div className="max-w-[200px] truncate">
            <span className="font-semibold text-white block truncate">{info.getValue() as string}</span>
            <span className="text-[9px] text-text-muted font-mono block mt-0.5">{info.row.original.id}</span>
          </div>
        ),
      },
      {
        id: 'company',
        accessorFn: (row) => row.company.name,
        header: 'Company',
        cell: (info) => <span className="text-zinc-300 font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: (info) => (
          <span className="px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-[9px] text-text-muted font-semibold uppercase tracking-wider">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'remoteType',
        header: 'Remote',
        cell: (info) => (
          <span className="text-[11px] text-text-muted uppercase font-medium">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: (info) => <span className="text-text-muted truncate max-w-[120px] block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'deadline',
        header: 'Deadline',
        cell: (info) => {
          const date = info.getValue() as Date | null;
          if (!date) return <span className="text-zinc-600">No deadline</span>;
          const isExpired = new Date(date) < new Date();
          return (
            <span className={cn('text-[11px] font-medium flex items-center gap-1', isExpired ? 'text-red-400' : 'text-zinc-300')}>
              <Calendar className="w-3 h-3 shrink-0" />
              {new Date(date).toLocaleDateString()}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const row = info.row.original;
          const isExpired = row.deadline && new Date(row.deadline) < new Date();

          if (row.isArchived) {
            return (
              <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/30 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                Archived
              </span>
            );
          }
          if (isExpired) {
            return (
              <span className="px-2 py-0.5 rounded border border-red-500/10 bg-red-500/5 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                Expired
              </span>
            );
          }
          if (!row.isActive) {
            return (
              <span className="px-2 py-0.5 rounded border border-amber-500/10 bg-amber-500/5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                Draft
              </span>
            );
          }
          return (
            <span className="px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-wider">
              Published
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: (info) => (
          <span className="text-text-muted text-[11px]">
            {new Date(info.getValue() as Date).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => {
          const row = info.row.original;
          const isOpen = activeDropdownId === row.id;

          const handleTogglePublish = () => {
            setActiveDropdownId(null);
            startTransition(async () => {
              const res = await togglePublishOpportunityAction(row.id, row.isActive);
              if (res.success) {
                toast.success(row.isActive ? 'Opportunity set to draft' : 'Opportunity published successfully');
                router.refresh();
              } else {
                toast.error(res.error);
              }
            });
          };

          const handleArchive = () => {
            setActiveDropdownId(null);
            startTransition(async () => {
              const res = await archiveOpportunityAction(row.id);
              if (res.success) {
                toast.success('Opportunity archived successfully');
                router.refresh();
              } else {
                toast.error(res.error);
              }
            });
          };

          const handleDeleteClick = () => {
            setActiveDropdownId(null);
            setDeleteConfirmId(row.id);
          };

          return (
            <div className="text-right relative">
              <button
                onClick={() => setActiveDropdownId(isOpen ? null : row.id)}
                className="p-1 rounded-md text-text-muted hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Toggle dropdown"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                  <div className="absolute right-0 mt-1 w-44 bg-[#111113] border border-zinc-800 rounded-lg shadow-xl py-1 z-20 text-left overflow-hidden">
                    <Link
                      href={`/admin/opportunities/${row.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </Link>
                    <Link
                      href={`/admin/opportunities/${row.id}/edit`}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Job
                    </Link>
                    <Link
                      href={`/admin/opportunities/new?duplicate=${row.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </Link>
                    <button
                      onClick={handleTogglePublish}
                      disabled={isPending}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors text-left"
                    >
                      {row.isActive ? <DownloadCloud className="w-3.5 h-3.5" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      {row.isActive ? 'Unpublish (Draft)' : 'Publish Job'}
                    </button>
                    {!row.isArchived && (
                      <button
                        onClick={handleArchive}
                        disabled={isPending}
                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors text-left"
                      >
                        <Archive className="w-3.5 h-3.5" /> Archive Job
                      </button>
                    )}
                    <button
                      onClick={handleDeleteClick}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-zinc-850"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete (Archive)
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [activeDropdownId, isPending, router]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;
    const targetId = deleteConfirmId;
    setDeleteConfirmId(null);
    startTransition(async () => {
      const res = await deleteOpportunityAction(targetId);
      if (res.success) {
        toast.success('Opportunity soft-deleted (archived)');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden relative">
      {/* Pending Loader overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      )}

      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-800 bg-zinc-900/10">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-3.5 text-[10px] uppercase font-bold text-text-muted tracking-wider">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-850 text-xs">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-text-muted font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <Compass className="w-8 h-8 text-zinc-700 animate-pulse" />
                    <span>No opportunities match your current filter parameters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/25 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-3.5 align-middle text-text-muted">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Confirmation Modal */}
      {deleteConfirmId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-xl p-6 shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Confirm Soft Delete</h4>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Are you sure you want to delete this opportunity? It will be marked as Archived and hidden from active candidates.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500 hover:text-white transition-colors"
              >
                Delete Job
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
