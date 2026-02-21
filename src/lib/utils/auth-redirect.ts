import type { Role } from '@prisma/client';

/**
 * Returns the redirect URL based on the user's role.
 *
 * - ADMIN → /admin
 * - CREATOR → /dashboard
 * - CLIENT (or unknown) → /
 */
export function getRoleRedirectUrl(role: Role | undefined | null): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'CREATOR') return '/dashboard';
  return '/';
}
