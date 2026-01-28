import { handlers } from '@/lib/auth/auth';

/**
 * Auth.js API route handlers
 *
 * This file exports the GET and POST handlers for Auth.js.
 * All authentication requests (signin, signout, callback, etc.)
 * are handled by these routes.
 *
 * @see https://authjs.dev/getting-started/installation?framework=Next.js#configure
 */
export const { GET, POST } = handlers;
