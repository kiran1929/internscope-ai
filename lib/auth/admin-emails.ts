/**
 * Admin email allowlist — configure via env, never hardcode personal addresses in source.
 *
 * Server:  ADMIN_EMAILS=you@company.com,admin@internscope.ai
 * Client:  NEXT_PUBLIC_ADMIN_EMAILS=same list (for UI affordances only; routes still server-gated)
 */
export function getAdminEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    'admin@internscope.ai';

  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase().trim());
}
