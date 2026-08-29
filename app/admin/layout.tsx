import React from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserRepository } from '@/lib/repositories/user';
import { prisma } from '@/lib/db';
import { SidebarStateProvider } from '@/providers/SidebarStateProvider';
import { AdminLayoutContent } from './AdminLayoutContent';
import { Role } from '@/lib/generated/prisma/enums';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect('/sign-in');
  }

  // Find user in database by clerkId
  let dbUser = await UserRepository.findByClerkId(clerkUser.id);

  // Fallback: If not found, check by email (to link local Clerk logins to seeded user profiles)
  if (!dbUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (email) {
      dbUser = await UserRepository.findByEmail(email);
      if (dbUser && !dbUser.clerkId) {
        // Associate the Clerk user ID with this pre-seeded database record
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { clerkId: clerkUser.id },
          include: {
            profile: true,
            emailPreference: true,
          },
        });
      }
    }
  }

  const userEmail = (clerkUser.emailAddresses[0]?.emailAddress || '').toLowerCase();
  const allowedAdminEmails = ['gudepukirandeep@gmail.com', 'admin@internscope.ai'];

  // Authorize: Only permit authorized admin emails with ADMIN role access to CMS
  const hasAdminRole = dbUser && (dbUser.role === Role.ADMIN || dbUser.role === Role.SUPER_ADMIN);
  const isAllowedEmail = allowedAdminEmails.includes(userEmail);

  if (!hasAdminRole || !isAllowedEmail) {
    redirect('/403');
  }

  return (
    <SidebarStateProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarStateProvider>
  );
}
