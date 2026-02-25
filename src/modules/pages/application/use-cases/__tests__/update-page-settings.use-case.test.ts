import { describe, it, expect, beforeEach } from 'vitest';
import {
  UpdatePageSettingsUseCase,
  UpdatePageSettingsInput,
} from '../update-page-settings.use-case';
import { PageRepository } from '../../ports/page.repository.interface';
import { CreatorPage } from '../../../domain/entities/creator-page.entity';
import { createMockPageRepo, type MockPageRepo } from './page-test.helpers';

describe('UpdatePageSettingsUseCase', () => {
  let useCase: UpdatePageSettingsUseCase;
  let mockRepo: MockPageRepo;

  const createMockPage = () => {
    return CreatorPage.create({
      creatorId: 'creator-123',
      slug: 'my-shop',
      title: 'Ma Boutique',
      description: 'Description originale',
    }).value;
  };

  beforeEach(() => {
    mockRepo = createMockPageRepo();
    mockRepo.slugExists.mockResolvedValue(false);
    useCase = new UpdatePageSettingsUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should update title successfully', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdatePageSettingsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        title: 'Nouveau Titre',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.title).toBe('Nouveau Titre');
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('should update description successfully', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdatePageSettingsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        description: 'Nouvelle description',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.description).toBe('Nouvelle description');
    });

    it('should update slug successfully', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdatePageSettingsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        slug: 'new-slug',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.slug).toBe('new-slug');
    });

    it('should fail when page not found', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      const input: UpdatePageSettingsInput = {
        pageId: 'non-existent',
        creatorId: 'creator-123',
        title: 'Nouveau Titre',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvee');
    });

    it('should fail when not owner', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdatePageSettingsInput = {
        pageId: page.idString,
        creatorId: 'other-creator',
        title: 'Nouveau Titre',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non autorise');
    });

    it('should fail when new slug already exists', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);
      mockRepo.slugExists.mockResolvedValue(true);

      const input: UpdatePageSettingsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        slug: 'existing-slug',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja utilise');
    });

    it('should not check slug uniqueness when slug is unchanged', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdatePageSettingsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        slug: 'my-shop', // Same slug
        title: 'Nouveau Titre',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepo.slugExists).not.toHaveBeenCalled();
    });

    it('should fail with empty title', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdatePageSettingsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        title: '',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should update multiple settings at once', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdatePageSettingsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        title: 'Nouveau Titre',
        description: 'Nouvelle description',
        slug: 'new-slug',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.title).toBe('Nouveau Titre');
      expect(result.value.description).toBe('Nouvelle description');
      expect(result.value.slug).toBe('new-slug');
    });

    it('should exclude current page when checking slug uniqueness', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdatePageSettingsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        slug: 'new-slug',
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockRepo.slugExists).toHaveBeenCalledWith('new-slug', page.idString);
    });
  });
});
