/** Seed/demo clerkIds created by prisma/seed.ts — not real Clerk accounts */
const SEED_CLERK_ID_PREFIX = 'user_clerk_';

export function isRealClerkUser(clerkId: string | null | undefined): boolean {
  if (!clerkId) return false;
  if (clerkId.startsWith(SEED_CLERK_ID_PREFIX)) return false;
  return clerkId.startsWith('user_');
}
