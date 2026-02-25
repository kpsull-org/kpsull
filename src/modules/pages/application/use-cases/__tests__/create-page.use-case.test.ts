import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePageUseCase, CreatePageInput } from '../create-page.use-case';
import { PageRepository } from '../../ports/page.repository.interface';
import { CreatorPage } from '../../../domain/entities/creator-page.entity';
import { createMockPageRepo, type MockPageRepo } from './page-test.helpers';

describe('CreatePageUseCase', () => {
  let useCase: CreatePageUseCase;
  let mockRepo: MockPageRepo;

  const defaultInput: CreatePageInput = {
    creatorId: 'creator-123',
    slug: 'my-shop',
    title: 'Ma Boutique',
  };

  beforeEach(() => {
    mockRepo = createMockPageRepo();
    mockRepo.slugExists.mockResolvedValue(false);
    useCase = new CreatePageUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should create a page successfully', async () => {
      // Arrange
      const input: CreatePageInput = {
        ...defaultInput,
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
        ...defaultInput,
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
        ...defaultInput,
        slug: 'existing-slug',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja utilise');
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should return page with id', async () => {
      const result = await useCase.execute(defaultInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBeDefined();
      expect(result.value.id.length).toBeGreaterThan(0);
    });

    it('should normalize slug to lowercase', async () => {
      const result = await useCase.execute({ ...defaultInput, slug: 'My-Shop' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.slug).toBe('my-shop');
    });

    it('should save the correct page to repository', async () => {
      await useCase.execute(defaultInput);

      expect(mockRepo.save).toHaveBeenCalledWith(expect.any(CreatorPage));
      const savedPage = mockRepo.save.mock.calls[0]![0] as CreatorPage;
      expect(savedPage.slug).toBe('my-shop');
      expect(savedPage.title).toBe('Ma Boutique');
    });

    it.each([
      { label: 'title is empty', input: { ...defaultInput, title: '' }, errorContains: 'titre' },
      { label: 'slug is invalid', input: { ...defaultInput, slug: 'invalid_slug!' }, errorContains: undefined },
      { label: 'creatorId is empty', input: { ...defaultInput, creatorId: '' }, errorContains: 'Creator ID' },
    ])('should fail when $label', async ({ input, errorContains }) => {
      const result = await useCase.execute(input);

      expect(result.isFailure).toBe(true);
      if (errorContains) {
        expect(result.error).toContain(errorContains);
      }
    });
  });
});
