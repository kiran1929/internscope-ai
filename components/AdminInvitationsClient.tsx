'use client';

import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createBetaInvitationAction, deleteBetaInvitationAction } from '@/app/actions/invitations';
import { Mail, Trash2, Plus, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InvitationItem {
  id: string;
  email: string;
  token: string;
  status: string;
  createdAt: Date;
}

interface AdminInvitationsClientProps {
  initialInvitations: InvitationItem[];
}

export default function AdminInvitationsClient({
  initialInvitations,
}: AdminInvitationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [emailInput, setEmailInput] = useState('');

  const handleCreateInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.warning('Please enter an email address.');
      return;
    }

    startTransition(async () => {
      const res = await createBetaInvitationAction(emailInput);
      if (res.success) {
        toast.success('Invitation token created successfully!');
        setEmailInput('');
        router.refresh();
      } else {
        toast.error(`Error: ${res.error}`);
      }
    });
  };

  const handleDeleteInvitation = (id: string) => {
    if (!confirm('Are you sure you want to delete this beta invitation token?')) return;

    startTransition(async () => {
      const res = await deleteBetaInvitationAction(id);
      if (res.success) {
        toast.success('Invitation deleted.');
        router.refresh();
      } else {
        toast.error(`Delete failed: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-6 text-white font-sans text-xs">
      
      {/* Create form */}
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Invite Beta User</span>
        <form onSubmit={handleCreateInvitation} className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="candidate@university.edu"
            className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 focus:outline-none focus:border-primary placeholder:text-zinc-700"
            required
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-md"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Generate Token</span>
          </button>
        </form>
      </div>

      {/* Grid listing */}
      <div className="border border-zinc-850 bg-[#111113] rounded-xl overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/60 border-b border-zinc-900 text-[10px] uppercase font-bold text-zinc-400 font-mono">
              <th className="p-3">Email Address</th>
              <th className="p-3">Invite Token</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-zinc-350">
            {initialInvitations.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-zinc-550">No invitation tokens generated yet.</td>
              </tr>
            ) : (
              initialInvitations.map(inv => (
                <tr key={inv.id} className="hover:bg-zinc-900/30">
                  <td className="p-3 font-semibold text-zinc-200">{inv.email}</td>
                  <td className="p-3 font-mono text-[10px] text-zinc-400">{inv.token}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      inv.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteInvitation(inv.id)}
                      disabled={isPending}
                      className="p-1.5 hover:bg-zinc-850 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
