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
  Shield,
  UserX,
  UserCheck,
  RefreshCw,
  Loader2,
  Bookmark,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Role } from '@/lib/generated/prisma/enums';
import { changeUserRoleAction, deactivateUserAction, reactivateUserAction } from '@/app/actions/users';

export interface TableUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    resumeUrl: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    graduationYear: number | null;
    major: string | null;
    skills: string[];
  } | null;
  _count: {
    savedOpportunities: number;
    applications: number;
  };
}

interface UsersTableProps {
  data: TableUser[];
}

export const UsersTable: React.FC<UsersTableProps> = ({ data }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Compute profile completion percentage
  const getProfileCompletion = (profile: TableUser['profile']) => {
    if (!profile) return 0;
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.avatarUrl,
      profile.resumeUrl,
      profile.githubUrl,
      profile.linkedinUrl,
      profile.portfolioUrl,
      profile.graduationYear,
      profile.major,
      profile.skills && profile.skills.length > 0 ? profile.skills : null,
    ];
    const filled = fields.filter((x) => x !== null && x !== undefined && x !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const handleRoleChange = useCallback((id: string, newRole: Role) => {
    setActiveMenuId(null);
    startTransition(async () => {
      const res = await changeUserRoleAction(id, newRole);
      if (res.success) {
        toast.success(`User role updated to ${newRole}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }, [router]);

  const handleToggleActive = useCallback((id: string, currentlyActive: boolean) => {
    setActiveMenuId(null);
    startTransition(async () => {
      let res;
      if (currentlyActive) {
        res = await deactivateUserAction(id);
      } else {
        res = await reactivateUserAction(id);
      }

      if (res.success) {
        toast.success(currentlyActive ? 'User profile deactivated' : 'User profile reactivated');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }, [router]);

  const handleResetProfile = () => {
    setActiveMenuId(null);
    toast.info('Profile reset placeholder action clicked');
  };

  const columns = React.useMemo<ColumnDef<TableUser>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => {
          const u = row.original;
          const displayName = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || 'Anonymous User';
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
                <span className="font-semibold text-white truncate text-xs block">{displayName}</span>
                <span className="text-[10px] text-text-muted block truncate font-mono">
                  {u.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = row.original.role;
          return (
            <span className={cn(
              'px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider',
              role === Role.ADMIN || role === Role.SUPER_ADMIN
                ? 'border-red-500/20 bg-red-500/5 text-red-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-300'
            )}>
              {role}
            </span>
          );
        },
      },
      {
        accessorKey: 'profileCompletion',
        header: 'Profile Completion',
        cell: ({ row }) => {
          const pct = getProfileCompletion(row.original.profile);
          return (
            <div className="w-28 space-y-1">
              <div className="flex items-center justify-between text-[9px] text-text-muted font-mono font-semibold">
                <span>Completed</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-950">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'savedOpportunities',
        header: 'Saved',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
            <Bookmark className="w-3.5 h-3.5 text-zinc-500" />
            <span>{row.original._count.savedOpportunities}</span>
          </div>
        ),
      },
      {
        accessorKey: 'applicationsCount',
        header: 'Applications',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
            <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
            <span>{row.original._count.applications}</span>
          </div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => {
          const active = row.original.isActive;
          return (
            <span className={cn(
              'px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider',
              active
                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                : 'border-zinc-800 bg-zinc-950 text-zinc-500'
            )}>
              {active ? 'Active' : 'Suspended'}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-xs text-text-muted font-mono">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const u = row.original;
          const isOpen = activeMenuId === u.id;
          return (
            <div className="relative flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(isOpen ? null : u.id);
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
                  <div className="absolute right-0 mt-6 w-44 bg-zinc-950 border border-zinc-850 rounded-lg shadow-xl py-1 z-20 animate-fade-in text-xs">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
                      onClick={() => setActiveMenuId(null)}
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </Link>
                    
                    {/* Role changer toggles */}
                    {u.role === Role.USER ? (
                      <button
                        onClick={() => handleRoleChange(u.id, Role.ADMIN)}
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" /> Make Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(u.id, Role.USER)}
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" /> Make User
                      </button>
                    )}

                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {u.isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-red-400">Deactivate</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Reactivate</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleResetProfile}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white border-t border-zinc-900 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [activeMenuId, handleRoleChange, handleToggleActive]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm relative">
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
                  No users matched search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper utility function for conditional classes
function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}
