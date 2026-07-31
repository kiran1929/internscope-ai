import React from 'react';
import { prisma } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import { MessageSquare, Star, CheckCircle, Clock } from 'lucide-react';
import AdminFeedbackClient from '@/components/AdminFeedbackClient';

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

export default async function AdminFeedbackPage() {
  await verifyAdminAccess();

  const feedbackList = await prisma.userFeedback.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const mappedFeedback = feedbackList.map(f => ({
    id: f.id,
    userId: f.userId,
    type: f.type,
    content: f.content,
    rating: f.rating,
    isResolved: f.isResolved,
    createdAt: f.createdAt,
  }));

  return (
    <div className="space-y-6 text-white animate-fade-in select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" /> Feedback Moderation CMS
        </h2>
        <p className="text-xs text-zinc-400 mt-1">Review bug reports, feature requests, general feedback, and AI quality ratings.</p>
      </div>

      <AdminFeedbackClient initialFeedback={mappedFeedback} />
    </div>
  );
}
