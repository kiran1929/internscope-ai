import React from 'react';
import { prisma } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import { Mail, Clock, ShieldAlert } from 'lucide-react';
import AdminInvitationsClient from '@/components/AdminInvitationsClient';

export const dynamic = 'force-dynamic';

async function verifyAdminAccess() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const dbUser = await UserRepository.findByClerkId(clerkUser.id);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    redirect('/403');
  }
  return dbUser;
}

export default async function AdminInvitationsPage() {
  await verifyAdminAccess();

  const invitations = await prisma.betaInvitation.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const mappedInvitations = invitations.map(inv => ({
    id: inv.id,
    email: inv.email,
    token: inv.token,
    status: inv.status,
    createdAt: inv.createdAt,
  }));

  return (
    <div className="space-y-6 text-white animate-fade-in select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display flex items-center gap-2">
          <Mail className="w-6 h-6 text-primary" /> Beta Invitations CMS
        </h2>
        <p className="text-xs text-zinc-400 mt-1">Generate and distribute beta launch tokens to candidate email lists.</p>
      </div>

      <AdminInvitationsClient initialInvitations={mappedInvitations} />
    </div>
  );
}
