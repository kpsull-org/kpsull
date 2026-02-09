/**
 * Register User Use Case
 *
 * Handles user registration with email/password.
 * Supports OAuth account linking: if a user exists from Google OAuth,
 * the password is linked to the existing account.
 */

import type { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import type { PasswordHasher } from '../ports/password-hasher.interface';
import type { AccountRepository } from '../ports/account.repository.interface';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserOutput {
  userId: string;
  linked: boolean;
  message: string;
}

export class RegisterUserUseCase
  implements UseCase<RegisterUserInput, RegisterUserOutput>
{
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(input: RegisterUserInput): Promise<Result<RegisterUserOutput>> {
    const { name, email, password } = input;

    // Check if user already exists
    const existingUser =
      await this.accountRepository.findUserWithAccountsByEmail(email);

    if (existingUser) {
      // If user exists with a password, reject registration
      if (existingUser.hashedPassword) {
        return Result.fail('Un compte existe deja avec cette adresse email');
      }

      // User exists from OAuth but has no password - link the password
      const hashedPassword = await this.passwordHasher.hash(password);
      await this.accountRepository.linkPassword(
        existingUser.id,
        hashedPassword,
        existingUser.name || name
      );
      await this.accountRepository.createCredentialsAccount(existingUser.id);

      return Result.ok({
        userId: existingUser.id,
        linked: true,
        message: 'Mot de passe ajoute a votre compte existant',
      });
    }

    // Create new user
    const hashedPassword = await this.passwordHasher.hash(password);
    const newUser = await this.accountRepository.createUser({
      email,
      name,
      hashedPassword,
    });
    await this.accountRepository.createCredentialsAccount(newUser.id);

    return Result.ok({
      userId: newUser.id,
      linked: false,
      message: 'Compte cree avec succes',
    });
  }
}
