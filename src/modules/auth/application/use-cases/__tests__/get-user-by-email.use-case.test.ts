import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetUserByEmailUseCase } from '../get-user-by-email.use-case';
import { UserRepository } from '../../ports/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { RoleType } from '../../../domain/value-objects/role.vo';
import { UniqueId } from '@/shared/domain/unique-id.vo';

describe('GetUserByEmailUseCase', () => {
  let useCase: GetUserByEmailUseCase;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      existsByEmail: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new GetUserByEmailUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should return user when found by email', async () => {
      const userId = UniqueId.create();
      const user = User.reconstitute({
        id: userId.value,
        email: 'test@example.com',
        name: 'John Doe',
        image: 'https://example.com/avatar.jpg',
        role: RoleType.CLIENT,
        emailVerified: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }).value;

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const result = await useCase.execute({ email: 'test@example.com' });

      expect(result.isSuccess).toBe(true);
      expect(result.value!.email).toBe('test@example.com');
      expect(result.value!.name).toBe('John Doe');
      expect(result.value!.role).toBe(RoleType.CLIENT);
    });

    it('should return null when user not found', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const result = await useCase.execute({ email: 'nonexistent@example.com' });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should call repository with correct email', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      await useCase.execute({ email: 'test@example.com' });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should normalize email to lowercase', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      await useCase.execute({ email: 'TEST@EXAMPLE.COM' });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return user with CREATOR role', async () => {
      const userId = UniqueId.create();
      const user = User.reconstitute({
        id: userId.value,
        email: 'creator@example.com',
        name: 'Creator User',
        image: null,
        role: RoleType.CREATOR,
        emailVerified: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }).value;

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const result = await useCase.execute({ email: 'creator@example.com' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.role).toBe(RoleType.CREATOR);
      expect(result.value?.emailVerified).toEqual(new Date('2024-01-01'));
    });

    it('should return user with ADMIN role', async () => {
      const userId = UniqueId.create();
      const user = User.reconstitute({
        id: userId.value,
        email: 'admin@example.com',
        name: 'Admin User',
        image: null,
        role: RoleType.ADMIN,
        emailVerified: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }).value;

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const result = await useCase.execute({ email: 'admin@example.com' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.role).toBe(RoleType.ADMIN);
    });

    it('should return complete user DTO with all fields', async () => {
      const userId = UniqueId.create();
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const emailVerified = new Date('2024-01-01T12:00:00Z');

      const user = User.reconstitute({
        id: userId.value,
        email: 'complete@example.com',
        name: 'Complete User',
        image: 'https://example.com/avatar.jpg',
        role: RoleType.CREATOR,
        emailVerified,
        accountTypeChosen: true,
        wantsToBeCreator: true,
        createdAt,
        updatedAt,
      }).value;

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      const result = await useCase.execute({ email: 'complete@example.com' });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        id: userId.value,
        email: 'complete@example.com',
        name: 'Complete User',
        image: 'https://example.com/avatar.jpg',
        role: RoleType.CREATOR,
        emailVerified,
        accountTypeChosen: true,
        wantsToBeCreator: true,
        phone: null,
        address: null,
        city: null,
        postalCode: null,
        country: null,
        createdAt,
        updatedAt,
      });
    });
  });
});
