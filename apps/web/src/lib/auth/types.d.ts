import { Role } from '@prisma/client';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extend the default Session type to include role, user id, and account type flags
   */
  interface Session {
    user: {
      id: string;
      role: Role;
      accountTypeChosen: boolean;
      wantsToBeCreator: boolean;
    } & DefaultSession['user'];
  }

  /**
   * Extend the default User type to include role and account type flags
   */
  interface User extends DefaultUser {
    role: Role;
    accountTypeChosen: boolean;
    wantsToBeCreator: boolean;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the default JWT type to include role, user id, account type flags, and token expiry
   */
  interface JWT extends DefaultJWT {
    id?: string;
    role?: Role;
    accountTypeChosen?: boolean;
    wantsToBeCreator?: boolean;
    accessTokenExpires?: number;
  }
}
