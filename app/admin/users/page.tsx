import React from 'react';
import { prisma } from '@/lib/db';
import { AlertCircle, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      profile: true,
    },
  });

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Manage Users
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Browse and coordinate user registration roles and account states.
          </p>
        </div>
        <button
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-not-allowed opacity-50"
          disabled
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-[#111113] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase text-text-muted tracking-wider bg-zinc-900/10 font-bold">
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Registration Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-xs">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    No users registered in the database.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-900/25 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {user.profile?.avatarUrl ? (
                        <img
                          src={user.profile.avatarUrl}
                          alt="Avatar"
                          className="w-7 h-7 rounded-full border border-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white">
                          {user.profile?.firstName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-white block">
                          {user.profile?.firstName || 'Candidate'} {user.profile?.lastName || ''}
                        </span>
                        <span className="text-[10px] text-text-muted block truncate max-w-xs">{user.clerkId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-medium">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider ${
                        user.role === 'SUPER_ADMIN' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                        user.role === 'ADMIN' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                        'text-zinc-400 bg-zinc-900 border-zinc-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{user.createdAt.toLocaleDateString()}</td>
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
