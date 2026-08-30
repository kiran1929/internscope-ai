'use client';

import React, { useState, useTransition, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Compass,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  AlertTriangle,
  Loader2,
  Archive,
  CheckCircle,
  Building,
  ExternalLink,
  Briefcase,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  archiveCompanyAction,
  deleteCompanyAction,
  duplicateCompanyAction,
  verifyCompanyAction,
} from '@/app/actions/companies';

export interface TableCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  careerPageUrl: string | null;
  industry: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  companySize: string | null;
  isVerified: boolean;
  hiringStatus: string;
  isArchived: boolean;
  createdAt: Date;
  _count: {
    opportunities: number;
  };
}

interface CompaniesTableProps {
  data: TableCompany[];
}

export const CompaniesTable: React.FC<CompaniesTableProps> = ({ data }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleVerify = useCallback((id: string, currentVal: boolean) => {
    setActiveMenuId(null);
    startTransition(async () => {
      const res = await verifyCompanyAction(id, currentVal);
      if (res.success) {
        toast.success(currentVal ? 'Company unverified' : 'Company verified successfully');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }, [router]);

  const handleArchive = useCallback((id: string) => {
    setActiveMenuId(null);
    startTransition(async () => {
      const res = await archiveCompanyAction(id);
      if (res.success) {
        toast.success('Company archived successfully');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }, [router]);

  const handleDuplicate = useCallback((id: string) => {
    setActiveMenuId(null);
    startTransition(async () => {
      const res = await duplicateCompanyAction(id);
      if (res.success) {
        toast.success('Company duplicated successfully');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }, [router]);

  const handleDelete = useCallback((id: string) => {
    setConfirmDeleteId(null);
    startTransition(async () => {
      const res = await deleteCompanyAction(id);
      if (res.success) {
        toast.success('Company soft deleted successfully');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }, [router]);

  // Columns definition
  const columns = React.useMemo<ColumnDef<TableCompany>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Company',
        cell: ({ row }) => {
          const name = row.original.name;
          const logo = row.original.logoUrl;
          const isVerified = row.original.isVerified;
          return (
            <div className="flex items-center gap-3">
              {logo ? (
                <img
                  src={logo}
                  alt={name}
                  className="w-8 h-8 rounded-lg border border-zinc-800 bg-white object-contain p-0.5 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-center text-xs text-zinc-400 font-bold uppercase shrink-0">
                  {name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white truncate text-xs">{name}</span>
                  {isVerified && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 fill-emerald-400/10" />
                  )}
                </div>
                <span className="text-[10px] text-text-muted block truncate">
                  {row.original.industry || 'No Industry'}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'headquarters',
        header: 'Headquarters',
        cell: ({ row }) => {
          const parts = [row.original.city, row.original.state, row.original.country].filter(Boolean);
          return (
            <span className="text-xs text-zinc-300 truncate max-w-[120px] block">
              {parts.join(', ') || 'N/A'}
            </span>
          );
        },
      },
      {
        accessorKey: 'companySize',
        header: 'Size',
        cell: ({ row }) => (
          <span className="text-xs text-zinc-300 font-medium">
            {row.original.companySize || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'websiteUrl',
        header: 'Links',
        cell: ({ row }) => {
          const web = row.original.websiteUrl;
          const career = row.original.careerPageUrl;
          return (
            <div className="flex items-center gap-3">
              {web && (
                <a
                  href={web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-white transition-colors"
                  title="Website"
                >
                  <Compass className="w-3.5 h-3.5" />
                </a>
              )}
              {career && (
                <a
                  href={career}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-white transition-colors"
                  title="Careers"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'opportunitiesCount',
        header: 'Opportunities',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-mono font-bold text-zinc-300">
              {row.original._count.opportunities}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'hiringStatus',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.hiringStatus;
          const archived = row.original.isArchived;

          if (archived) {
            return (
              <span className="px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Archived
              </span>
            );
          }

          if (status === 'HIRING') {
            return (
              <span className="px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold text-primary uppercase tracking-wider">
                Hiring
              </span>
            );
          } else if (status === 'FREEZE') {
            return (
              <span className="px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Freeze
              </span>
            );
          } else {
            return (
              <span className="px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-950 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Closed
              </span>
            );
          }
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-xs text-text-muted font-mono">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const c = row.original;
          const isOpen = activeMenuId === c.id;
          return (
            <div className="relative flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(isOpen ? null : c.id);
                }}
                className="p-1 rounded hover:bg-zinc-850 text-text-muted hover:text-white transition-all cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isOpen && (
                <>
                  {/* Overlay blocker */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setActiveMenuId(null)}
                  />
                  <div className="absolute right-0 mt-6 w-40 bg-zinc-950 border border-zinc-850 rounded-lg shadow-xl py-1 z-20 animate-fade-in text-xs">
                    <Link
                      href={`/admin/companies/${c.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
                      onClick={() => setActiveMenuId(null)}
                    >
                      <Eye className="w-3.5 h-3.5" /> View details
                    </Link>
                    <Link
                      href={`/admin/companies/${c.id}/edit`}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
                      onClick={() => setActiveMenuId(null)}
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit company
                    </Link>
                    <button
                      onClick={() => handleDuplicate(c.id)}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>
                    <button
                      onClick={() => handleVerify(c.id, c.isVerified)}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {c.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                    {!c.isArchived && (
                      <button
                        onClick={() => handleArchive(c.id)}
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveMenuId(null);
                        setConfirmDeleteId(c.id);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors border-t border-zinc-900 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Soft Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [activeMenuId, handleVerify, handleArchive, handleDuplicate]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm relative">
      {/* Pending Loader overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-30">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Main Table view */}
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
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Building className="w-8 h-8 text-zinc-700" />
                    <div>
                      <p className="font-semibold text-white">No companies found</p>
                      <p className="text-[10px] mt-1">Try refining search parameters or filters.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Soft Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-[#111113] border border-zinc-800 rounded-xl p-5 shadow-2xl max-w-md w-full relative">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h3 className="text-sm font-bold text-white">Soft Delete Company</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Are you sure you want to soft delete this company? This will mark the record as archived and suspend live matching.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-850 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-3.5 py-1.5 rounded-lg bg-danger hover:bg-red-700 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                Soft Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
