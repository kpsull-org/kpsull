import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  PublishPageUseCase,
  PublishPageInput,
  UnpublishPageUseCase,
  UnpublishPageInput,
} from '../publish-page.use-case';
import { PageRepository } from '../../ports/page.repository.interface';
import { CreatorPage } from '../../../domain/entities/creator-page.entity';

describe('PublishPageUseCase', () => {
  let useCase: PublishPageUseCase;
  let mockRepo: {
    findById: Mock;
    findBySlug: Mock;
    findByCreatorId: Mock;
    save: Mock;
    delete: Mock;
    slugExists: Mock;
    findSectionById: Mock;
    saveSection: Mock;
    deleteSection: Mock;
    findPublishedBySlug: Mock;
    countByCreatorId: Mock;
  };

  const createMockPage = (isPublished = false) => {
    const page = CreatorPage.create({
      creatorId: 'creator-123',
      slug: 'my-shop',
      title: 'Ma Boutique',
    }).value!;

    if (isPublished) {
      page.publish();
    }

    return page;
  };

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByCreatorId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
      findSectionById: vi.fn(),
      saveSection: vi.fn(),
      deleteSection: vi.fn(),
      findPublishedBySlug: vi.fn(),
      countByCreatorId: vi.fn(),
    };
    useCase = new PublishPageUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should publish a draft page successfully', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: PublishPageInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('PUBLISHED');
      expect(result.value!.publishedAt).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('should fail when page not found', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      const input: PublishPageInput = {
        pageId: 'non-existent',
        creatorId: 'creator-123',
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

      const input: PublishPageInput = {
        pageId: page.idString,
        creatorId: 'other-creator',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non autorise');
    });

    it('should fail when page is already published', async () => {
      // Arrange
      const page = createMockPage(true);
      mockRepo.findById.mockResolvedValue(page);

      const input: PublishPageInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja publiee');
    });
  });
});

describe('UnpublishPageUseCase', () => {
  let useCase: UnpublishPageUseCase;
  let mockRepo: {
    findById: Mock;
    findBySlug: Mock;
    findByCreatorId: Mock;
    save: Mock;
    delete: Mock;
    slugExists: Mock;
    findSectionById: Mock;
    saveSection: Mock;
    deleteSection: Mock;
    findPublishedBySlug: Mock;
    countByCreatorId: Mock;
  };

  const createMockPage = (isPublished = true) => {
    const page = CreatorPage.create({
      creatorId: 'creator-123',
      slug: 'my-shop',
      title: 'Ma Boutique',
    }).value!;

    if (isPublished) {
      page.publish();
    }

    return page;
  };

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findByCreatorId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      slugExists: vi.fn(),
      findSectionById: vi.fn(),
      saveSection: vi.fn(),
      deleteSection: vi.fn(),
      findPublishedBySlug: vi.fn(),
      countByCreatorId: vi.fn(),
    };
    useCase = new UnpublishPageUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should unpublish a published page successfully', async () => {
      // Arrange
      const page = createMockPage(true);
      mockRepo.findById.mockResolvedValue(page);

      const input: UnpublishPageInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe('DRAFT');
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('should fail when page not found', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      const input: UnpublishPageInput = {
        pageId: 'non-existent',
        creatorId: 'creator-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvee');
    });

    it('should fail when not owner', async () => {
      // Arrange
      const page = createMockPage(true);
      mockRepo.findById.mockResolvedValue(page);

      const input: UnpublishPageInput = {
        pageId: page.idString,
        creatorId: 'other-creator',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non autorise');
    });

    it('should fail when page is already a draft', async () => {
      // Arrange
      const page = createMockPage(false);
      mockRepo.findById.mockResolvedValue(page);

      const input: UnpublishPageInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('brouillon');
    });
  });
});
