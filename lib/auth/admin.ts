import { auth } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { Role } from '@/lib/generated/prisma/enums';

/**
 * Server-side guard for admin-only server actions.
 * Layout-level checks do not protect server actions invoked directly,
 * so every privileged action must call this first.
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

  return dbUser;
}
