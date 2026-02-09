/**
 * Password Hasher port - abstracts the hashing mechanism.
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
