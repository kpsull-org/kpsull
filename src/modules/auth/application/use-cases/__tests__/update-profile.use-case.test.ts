import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateProfileUseCase, UpdateProfileInput } from '../update-profile.use-case';
import { UserRepository } from '../../ports/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { RoleType } from '../../../domain/value-objects/role.vo';

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
  let mockUserRepository: UserRepository;

  const userId = 'user-123';
  const validUser = () =>
    User.reconstitute({
      id: userId,
      email: 'test@example.com',
      name: 'Original Name',
      image: 'https://example.com/old-avatar.jpg',
      role: RoleType.CLIENT,
      accountTypeChosen: true,
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
    useCase = new UpdateProfileUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should update user name successfully', async () => {
      const user = validUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const input: UpdateProfileInput = {
        userId,
        name: 'New Name',
      };

      const result = await useCase.execute(input);

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('New Name');
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('should update user image successfully', async () => {
      const user = validUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const input: UpdateProfileInput = {
        userId,
        image: 'https://example.com/new-avatar.jpg',
      };

      const result = await useCase.execute(input);

      expect(result.isSuccess).toBe(true);
      expect(result.value.image).toBe('https://example.com/new-avatar.jpg');
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('should update both name and image', async () => {
      const user = validUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const input: UpdateProfileInput = {
        userId,
        name: 'New Name',
        image: 'https://example.com/new-avatar.jpg',
      };

      const result = await useCase.execute(input);

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('New Name');
      expect(result.value.image).toBe('https://example.com/new-avatar.jpg');
    });

    it('should fail if user not found', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const input: UpdateProfileInput = {
        userId: 'non-existent',
        name: 'New Name',
      };

      const result = await useCase.execute(input);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('User not found');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should allow setting name to null', async () => {
      const user = validUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      const input: UpdateProfileInput = {
        userId,
        name: null,
      };

      const result = await useCase.execute(input);

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBeNull();
    });

    it('should call repository findById with correct userId', async () => {
      const user = validUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(undefined);

      await useCase.execute({ userId, name: 'New Name' });

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });
});
