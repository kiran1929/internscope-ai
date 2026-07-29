import React from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { NotificationRepository } from '@/lib/repositories/notification';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import { NotificationsCenter } from '@/components/NotificationsCenter';
import { Notification } from '@/lib/generated/prisma/client';

export const dynamic = 'force-dynamic';

async function getAdminUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const dbUser = await UserRepository.findByClerkId(clerkUser.id);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    redirect('/403');
  }
  return dbUser;
}

export default async function AdminNotificationsPage() {
  const dbUser = await getAdminUser();

  // Load user-specific notifications
  let paginatedResult = await NotificationRepository.findManyByUser(dbUser.id, { limit: 20 });

  // Self-seeding logic if database list is empty
  if (paginatedResult.meta.total === 0) {
    await Promise.all([
      NotificationRepository.create({
        userId: dbUser.id,
        type: 'SYSTEM',
        title: 'Neon DB Connection Synced',
        message: 'Successfully tested connection pools and latency test queries for neondb.',
      }),
      NotificationRepository.create({
        userId: dbUser.id,
        type: 'ALERT',
        title: 'New Student Candidate Registered',
        message: 'Jane Smith (janesmith@mit.edu) registered and populated major, graduation year, and skills index.',
      }),
      NotificationRepository.create({
        userId: dbUser.id,
        type: 'APPLICATION_DEADLINE',
        title: 'Internship Application Deadline Alert',
        message: 'Meta Production Engineering Intern applications closing in 24 hours. Verify matching scores pipeline.',
      }),
      NotificationRepository.create({
        userId: dbUser.id,
        type: 'ALERT',
        title: 'Scraper Target Triggered',
        message: 'Automatic crawler initialized. Successfully indexed 15 new internship postings from Stripe and Vercel.',
      }),
    ]);
    paginatedResult = await NotificationRepository.findManyByUser(dbUser.id, { limit: 20 });
  }

  // Cast type to fit the React interface correctly
  const notifications = (paginatedResult.data as Notification[]).map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: new Date(n.createdAt)
  }));

  return (
    <div className="space-y-6 select-none animate-fade-in text-white">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Notification Center
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Review system health alerts, user onboarding notifications, and application tracking milestones.
        </p>
      </div>

      <NotificationsCenter notifications={notifications} />
    </div>
  );
}
