import { auth, currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { Role } from '@/lib/generated/prisma/enums';
import { isAllowedAdminEmail } from '@/lib/auth/admin-emails';

/**
 * Server-side guard for admin-only server actions.
 * Layout-level checks do not protect server actions invoked directly,
 * so every privileged action must call this first.
 *
 * Requires: authenticated + active + ADMIN/SUPER_ADMIN role + allowlisted email.
 */
export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const dbUser = await UserRepository.findByClerkId(userId);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    throw new Error('Forbidden: admin access required');
  }

  if (!dbUser.isActive) {
    throw new Error('Forbidden: user account is deactivated');
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    dbUser.email;

  if (!isAllowedAdminEmail(email)) {
    throw new Error('Forbidden: admin email not allowlisted');
  }

  return dbUser;
}
