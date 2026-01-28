import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma/client';
import { authConfig } from './config';

/**
 * Auth.js instance with Prisma adapter
 *
 * This file creates and exports the Auth.js handlers and utilities.
 *
 * @example
 * ```typescript
 * // In a Server Component or API Route
 * import { auth } from '@/lib/auth/auth';
 *
 * const session = await auth();
 * if (session?.user) {
 *   console.log('User:', session.user.email);
 *   console.log('Role:', session.user.role);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In a Client Component
 * import { signIn, signOut } from '@/lib/auth/auth';
 *
 * // Sign in with Google
 * await signIn('google');
 *
 * // Sign out
 * await signOut();
 * ```
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // @ts-expect-error - Type mismatch between @auth/prisma-adapter and next-auth versions
  adapter: PrismaAdapter(prisma),
  ...authConfig,
});
