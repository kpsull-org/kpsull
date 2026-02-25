import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePageUseCase, CreatePageInput } from '../create-page.use-case';
import { PageRepository } from '../../ports/page.repository.interface';
import { CreatorPage } from '../../../domain/entities/creator-page.entity';
import { createMockPageRepo, type MockPageRepo } from './page-test.helpers';

describe('CreatePageUseCase', () => {
  let useCase: CreatePageUseCase;
  let mockRepo: MockPageRepo;

  beforeEach(() => {
    mockRepo = createMockPageRepo();
    mockRepo.slugExists.mockResolvedValue(false);
    useCase = new CreatePageUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should create a page successfully', async () => {
      // Arrange
      const input: CreatePageInput = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
        description: 'Description de ma boutique',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.slug).toBe('my-shop');
      expect(result.value.title).toBe('Ma Boutique');
      expect(result.value.description).toBe('Description de ma boutique');
      expect(result.value.status).toBe('DRAFT');
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('should create a page with template', async () => {
      // Arrange
      const input: CreatePageInput = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
        templateId: 'template-1',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.templateId).toBe('template-1');
    });

    it('should fail when slug already exists', async () => {
      // Arrange
      mockRepo.slugExists.mockResolvedValue(true);

      const input: CreatePageInput = {
        creatorId: 'creator-123',
        slug: 'existing-slug',
        title: 'Ma Boutique',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja utilise');
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should fail when title is empty', async () => {
      // Arrange
      const input: CreatePageInput = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: '',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when slug is invalid', async () => {
      // Arrange
      const input: CreatePageInput = {
        creatorId: 'creator-123',
        slug: 'invalid_slug!',
        title: 'Ma Boutique',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
    });

    it('should fail when creatorId is empty', async () => {
      // Arrange
      const input: CreatePageInput = {
        creatorId: '',
        slug: 'my-shop',
        title: 'Ma Boutique',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should return page with id', async () => {
      // Arrange
      const input: CreatePageInput = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBeDefined();
      expect(result.value.id.length).toBeGreaterThan(0);
    });

    it('should normalize slug to lowercase', async () => {
      // Arrange
      const input: CreatePageInput = {
        creatorId: 'creator-123',
        slug: 'My-Shop',
        title: 'Ma Boutique',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.slug).toBe('my-shop');
    });

    it('should save the correct page to repository', async () => {
      // Arrange
      const input: CreatePageInput = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockRepo.save).toHaveBeenCalledWith(expect.any(CreatorPage));
      const savedPage = mockRepo.save.mock.calls[0]![0] as CreatorPage;
      expect(savedPage.slug).toBe('my-shop');
      expect(savedPage.title).toBe('Ma Boutique');
    });
  });
});
