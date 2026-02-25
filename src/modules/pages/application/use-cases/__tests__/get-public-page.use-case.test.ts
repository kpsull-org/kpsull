import { describe, it, expect, beforeEach } from 'vitest';
import {
  GetPublicPageUseCase,
  type GetPublicPageInput,
} from '../get-public-page.use-case';
import { PageRepository } from '../../ports/page.repository.interface';
import { CreatorPage } from '../../../domain/entities/creator-page.entity';
import { SectionType } from '../../../domain/value-objects/section-type.vo';
import { createMockPageRepo, type MockPageRepo } from './page-test.helpers';

describe('GetPublicPageUseCase', () => {
  let useCase: GetPublicPageUseCase;
  let mockRepo: MockPageRepo;

  const createMockPage = (isPublished = true) => {
    const page = CreatorPage.create({
      creatorId: 'creator-123',
      slug: 'my-shop',
      title: 'Ma Boutique',
      description: 'Une description de ma boutique',
    }).value;

    // Add sections
    page.addSection({
      type: SectionType.hero(),
      title: 'Welcome',
      content: { heading: 'Bienvenue', subheading: 'Dans ma boutique' },
    });

    page.addSection({
      type: SectionType.productsGrid(),
      title: 'Produits',
      content: { productIds: ['prod-1', 'prod-2'] },
    });

    if (isPublished) {
      page.publish();
    }

    return page;
  };

  beforeEach(() => {
    mockRepo = createMockPageRepo();
    useCase = new GetPublicPageUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should return a published page with its sections', async () => {
      // Arrange
      const page = createMockPage(true);
      mockRepo.findPublishedBySlug.mockResolvedValue(page);

      const input: GetPublicPageInput = {
        slug: 'my-shop',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.slug).toBe('my-shop');
      expect(result.value.title).toBe('Ma Boutique');
      expect(result.value.description).toBe('Une description de ma boutique');
      expect(result.value.sections).toHaveLength(2);
      expect(result.value.publishedAt).toBeDefined();
      expect(mockRepo.findPublishedBySlug).toHaveBeenCalledWith('my-shop');
    });

    it('should not expose creatorId in public response', async () => {
      // Arrange
      const page = createMockPage(true);
      mockRepo.findPublishedBySlug.mockResolvedValue(page);

      const input: GetPublicPageInput = {
        slug: 'my-shop',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      // Verify that creatorId is not exposed
      expect('creatorId' in result.value).toBe(false);
    });

    it('should return only visible sections', async () => {
      // Arrange
      const page = createMockPage(true);
      // Get one section and hide it
      const sections = page.sections;
      if (sections[1]) {
        sections[1].hide();
      }
      mockRepo.findPublishedBySlug.mockResolvedValue(page);

      const input: GetPublicPageInput = {
        slug: 'my-shop',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.sections).toHaveLength(1);
      expect(result.value.sections[0]!.title).toBe('Welcome');
    });

    it('should fail when page not found', async () => {
      mockRepo.findPublishedBySlug.mockResolvedValue(null);

      const result = await useCase.execute({ slug: 'non-existent' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Page non trouvee');
    });

    it('should return sections in correct order by position', async () => {
      // Arrange
      const page = createMockPage(true);
      mockRepo.findPublishedBySlug.mockResolvedValue(page);

      // Act
      const result = await useCase.execute({ slug: 'my-shop' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.sections[0]!.position).toBe(0);
      expect(result.value.sections[1]!.position).toBe(1);
    });

    it('should include section content in response', async () => {
      // Arrange
      const page = createMockPage(true);
      mockRepo.findPublishedBySlug.mockResolvedValue(page);

      // Act
      const result = await useCase.execute({ slug: 'my-shop' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.sections[0]!.content).toEqual({
        heading: 'Bienvenue',
        subheading: 'Dans ma boutique',
      });
    });

    it.each([
      { label: 'slug is empty', slug: '' },
      { label: 'slug is whitespace only', slug: '   ' },
    ])('should fail when $label', async ({ slug }) => {
      const result = await useCase.execute({ slug });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Slug est requis');
    });
  });
});
