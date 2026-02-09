/**
 * Account Repository port for managing auth accounts (OAuth, credentials).
 */

export interface AccountInfo {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
}

export interface UserWithAccounts {
  id: string;
  email: string;
  name: string | null;
  hashedPassword: string | null;
  accounts: AccountInfo[];
}

export interface AccountRepository {
  findUserWithAccountsByEmail(email: string): Promise<UserWithAccounts | null>;
  createUser(data: {
    email: string;
    name: string;
    hashedPassword: string;
  }): Promise<{ id: string }>;
  linkPassword(userId: string, hashedPassword: string, name?: string): Promise<void>;
  createCredentialsAccount(userId: string): Promise<void>;
}
