import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateUserUseCase, CreateUserInput } from '../create-user.use-case';
import { UserRepository } from '../../ports/user.repository.interface';
import { RoleType } from '../../../domain/value-objects/role.vo';

/**
 * Creates a PostgreSQL unique constraint violation error
 * PostgreSQL error code 23505 = unique_violation
 */
function createUniqueConstraintError(): Error {
  const error = new Error('duplicate key value violates unique constraint "users_email_unique"');
  (error as Error & { code: string }).code = '23505';
  return error;
}

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      existsByEmail: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new CreateUserUseCase(mockUserRepository);
  });

  const validInput: CreateUserInput = {
    email: 'test@example.com',
    name: 'John Doe',
    image: 'https://example.com/avatar.jpg',
  };

  describe('execute', () => {
    it('should create a new user successfully', async () => {
      vi.mocked(mockUserRepository.save).mockResolvedValue();

      const result = await useCase.execute(validInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.email).toBe('test@example.com');
      expect(result.value.name).toBe('John Doe');
      expect(result.value.image).toBe('https://example.com/avatar.jpg');
      expect(result.value.role).toBe(RoleType.CLIENT);
    });

    it('should create a user with default CLIENT role', async () => {
      vi.mocked(mockUserRepository.save).mockResolvedValue();

      const result = await useCase.execute(validInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.role).toBe(RoleType.CLIENT);
    });

    it('should create a user with specified role', async () => {
      vi.mocked(mockUserRepository.save).mockResolvedValue();

      const result = await useCase.execute({
        ...validInput,
        role: RoleType.CREATOR,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.role).toBe(RoleType.CREATOR);
    });

    it('should fail if email already exists (unique constraint violation)', async () => {
      vi.mocked(mockUserRepository.save).mockRejectedValue(createUniqueConstraintError());

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Un utilisateur avec cet email existe deja');
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should rethrow non-unique-constraint database errors', async () => {
      const genericError = new Error('Database connection failed');
      vi.mocked(mockUserRepository.save).mockRejectedValue(genericError);

      await expect(useCase.execute(validInput)).rejects.toThrow('Database connection failed');
    });

    it('should fail with invalid email format', async () => {
      const result = await useCase.execute({
        ...validInput,
        email: 'invalid-email',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid email format');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should fail with empty email', async () => {
      const result = await useCase.execute({
        ...validInput,
        email: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Email cannot be empty');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should call repository save with the created user', async () => {
      vi.mocked(mockUserRepository.save).mockResolvedValue();

      await useCase.execute(validInput);

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            email: expect.objectContaining({
              props: { value: 'test@example.com' },
            }),
          }),
        })
      );
    });

    it('should generate a unique ID for the new user', async () => {
      vi.mocked(mockUserRepository.save).mockResolvedValue();

      const result1 = await useCase.execute(validInput);
      const result2 = await useCase.execute({ ...validInput, email: 'other@example.com' });

      expect(result1.value.id).toBeDefined();
      expect(result2.value.id).toBeDefined();
      expect(result1.value.id).not.toBe(result2.value.id);
    });

    it('should set emailVerified to null by default', async () => {
      vi.mocked(mockUserRepository.save).mockResolvedValue();

      const result = await useCase.execute(validInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.emailVerified).toBeNull();
    });

    it('should create user with provided emailVerified date', async () => {
      vi.mocked(mockUserRepository.save).mockResolvedValue();
      const verifiedDate = new Date('2024-01-01');

      const result = await useCase.execute({
        ...validInput,
        emailVerified: verifiedDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.emailVerified).toEqual(verifiedDate);
    });

    it('should not call existsByEmail (atomic transaction)', async () => {
      vi.mocked(mockUserRepository.save).mockResolvedValue();

      await useCase.execute(validInput);

      expect(mockUserRepository.existsByEmail).not.toHaveBeenCalled();
    });

    it('should rethrow non-object errors (string thrown)', async () => {
      vi.mocked(mockUserRepository.save).mockRejectedValue('raw string error');

      await expect(useCase.execute(validInput)).rejects.toBe('raw string error');
    });
  });
});
