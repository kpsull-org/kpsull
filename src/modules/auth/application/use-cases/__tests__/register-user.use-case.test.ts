import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUserUseCase } from '../register-user.use-case';
import type { AccountRepository } from '../../ports/account.repository.interface';
import type { PasswordHasher } from '../../ports/password-hasher.interface';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockAccountRepo: AccountRepository;
  let mockHasher: PasswordHasher;

  beforeEach(() => {
    mockAccountRepo = {
      findUserWithAccountsByEmail: vi.fn(),
      createUser: vi.fn(),
      linkPassword: vi.fn(),
      createCredentialsAccount: vi.fn(),
    };
    mockHasher = {
      hash: vi.fn().mockResolvedValue('hashed-password'),
      compare: vi.fn(),
    };
    useCase = new RegisterUserUseCase(mockAccountRepo, mockHasher);
  });

  it('should create a new user when email does not exist', async () => {
    vi.mocked(mockAccountRepo.findUserWithAccountsByEmail).mockResolvedValue(null);
    vi.mocked(mockAccountRepo.createUser).mockResolvedValue({ id: 'new-user-id' });

    const result = await useCase.execute({
      name: 'Jean Dupont',
      email: 'jean@example.com',
      password: 'StrongPass123!',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.userId).toBe('new-user-id');
    expect(result.value.linked).toBe(false);
    expect(mockHasher.hash).toHaveBeenCalledWith('StrongPass123!');
    expect(mockAccountRepo.createUser).toHaveBeenCalledWith({
      email: 'jean@example.com',
      name: 'Jean Dupont',
      hashedPassword: 'hashed-password',
    });
    expect(mockAccountRepo.createCredentialsAccount).toHaveBeenCalledWith('new-user-id');
  });

  it('should link password when user exists from OAuth without password', async () => {
    vi.mocked(mockAccountRepo.findUserWithAccountsByEmail).mockResolvedValue({
      id: 'oauth-user-id',
      email: 'jean@example.com',
      name: 'Jean',
      hashedPassword: null,
      accounts: [{ userId: 'oauth-user-id', type: 'oauth', provider: 'google', providerAccountId: 'g-123' }],
    });

    const result = await useCase.execute({
      name: 'Jean Dupont',
      email: 'jean@example.com',
      password: 'MyPassword!',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.linked).toBe(true);
    expect(mockAccountRepo.linkPassword).toHaveBeenCalledWith(
      'oauth-user-id',
      'hashed-password',
      'Jean'
    );
    expect(mockAccountRepo.createCredentialsAccount).toHaveBeenCalledWith('oauth-user-id');
  });

  it('should fail when user exists with password already', async () => {
    vi.mocked(mockAccountRepo.findUserWithAccountsByEmail).mockResolvedValue({
      id: 'existing-user-id',
      email: 'jean@example.com',
      name: 'Jean',
      hashedPassword: 'already-hashed',
      accounts: [],
    });

    const result = await useCase.execute({
      name: 'Jean Dupont',
      email: 'jean@example.com',
      password: 'Password123!', // NOSONAR - test fixture, not a real credential
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('existe deja');
    expect(mockAccountRepo.createUser).not.toHaveBeenCalled();
  });

  it('should use existing name when OAuth user already has one', async () => {
    vi.mocked(mockAccountRepo.findUserWithAccountsByEmail).mockResolvedValue({
      id: 'oauth-user-id',
      email: 'jean@example.com',
      name: 'Jean OAuth',
      hashedPassword: null,
      accounts: [],
    });

    await useCase.execute({
      name: 'Jean Nouveau',
      email: 'jean@example.com',
      password: 'Password123!', // NOSONAR - test fixture, not a real credential
    });

    expect(mockAccountRepo.linkPassword).toHaveBeenCalledWith(
      'oauth-user-id',
      'hashed-password',
      'Jean OAuth' // keeps existing name
    );
  });

  it('should use provided name when OAuth user has no existing name', async () => {
    vi.mocked(mockAccountRepo.findUserWithAccountsByEmail).mockResolvedValue({
      id: 'oauth-user-id',
      email: 'jean@example.com',
      name: null,
      hashedPassword: null,
      accounts: [],
    });

    await useCase.execute({
      name: 'Jean Nouveau',
      email: 'jean@example.com',
      password: 'Password123!', // NOSONAR - test fixture, not a real credential
    });

    expect(mockAccountRepo.linkPassword).toHaveBeenCalledWith(
      'oauth-user-id',
      'hashed-password',
      'Jean Nouveau' // falls back to provided name
    );
  });
});
