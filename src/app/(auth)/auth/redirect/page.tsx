import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getRoleRedirectUrl } from '@/lib/utils/auth-redirect';

/**
 * Role-based redirect page for OAuth flows (e.g. Google Sign-In).
 *
 * After a successful OAuth sign-in, NextAuth redirects to this page.
 * The server reads the session and immediately redirects the user to the
 * appropriate destination based on their role:
 *
 * - ADMIN   → /admin
 * - CREATOR → /dashboard
 * - CLIENT  → /
 *
 * This page is never rendered to the user — it always produces a redirect.
 */
export default async function AuthRedirectPage() {
  const session = await auth();
  redirect(getRoleRedirectUrl(session?.user?.role));
}
