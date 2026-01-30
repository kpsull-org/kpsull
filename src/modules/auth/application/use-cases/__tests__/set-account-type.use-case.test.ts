import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SetAccountTypeUseCase, SetAccountTypeInput } from '../set-account-type.use-case';
import { UserRepository } from '../../ports/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { RoleType } from '../../../domain/value-objects/role.vo';

describe('SetAccountTypeUseCase', () => {
  let useCase: SetAccountTypeUseCase;
  let mockUserRepository: UserRepository;

  const userId = 'user-123';
  const validUser = () =>
    User.reconstitute({
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      role: RoleType.CLIENT,
      accountTypeChosen: false,
      wantsToBeCreator: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).value;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      existsByEmail: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new SetAccountTypeUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should set account type to CLIENT successfully', async () => {
      const user = validUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const input: SetAccountTypeInput = {
        userId,
        wantsToBeCreator: false,
      };

      const result = await useCase.execute(input);

      expect(result.isSuccess).toBe(true);
      expect(result.value.accountTypeChosen).toBe(true);
      expect(result.value.wantsToBeCreator).toBe(false);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('should set account type to CREATOR successfully', async () => {
      const user = validUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const input: SetAccountTypeInput = {
        userId,
        wantsToBeCreator: true,
      };

      const result = await useCase.execute(input);

      expect(result.isSuccess).toBe(true);
      expect(result.value.accountTypeChosen).toBe(true);
      expect(result.value.wantsToBeCreator).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('should fail if user not found', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const input: SetAccountTypeInput = {
        userId: 'non-existent',
        wantsToBeCreator: false,
      };

      const result = await useCase.execute(input);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('User not found');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should fail if account type already chosen', async () => {
      const user = User.reconstitute({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: RoleType.CLIENT,
        accountTypeChosen: true,
        wantsToBeCreator: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value;
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      const input: SetAccountTypeInput = {
        userId,
        wantsToBeCreator: true,
      };

      const result = await useCase.execute(input);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Account type has already been chosen');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should call repository findById with correct userId', async () => {
      const user = validUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      await useCase.execute({ userId, wantsToBeCreator: false });

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });
});
