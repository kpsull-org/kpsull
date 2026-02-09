/**
 * Bcrypt implementation of PasswordHasher.
 */

import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.interface';

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
