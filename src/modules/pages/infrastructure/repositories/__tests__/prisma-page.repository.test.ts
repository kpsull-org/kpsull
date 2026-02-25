import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client - use vi.hoisted to ensure the mock is available before imports
const mockPrisma = vi.hoisted(() => ({
  creatorPage: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  pageSection: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

import { PrismaPageRepository } from '../prisma-page.repository';

describe('PrismaPageRepository', () => {
  let repository: PrismaPageRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaPageRepository();
  });

  describe('findPublishedBySlug', () => {
    it('should return page with sections when found and published', async () => {
      const mockPrismaPage = {
        id: 'page-123',
        creatorId: 'creator-456',
        slug: 'my-shop',
        title: 'My Shop',
        description: 'Welcome to my shop',
        templateId: null,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        sections: [
          {
            id: 'section-1',
            pageId: 'page-123',
            type: 'HERO',
            title: 'Welcome',
            content: { headline: 'Welcome!' },
            position: 0,
            isVisible: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'section-2',
            pageId: 'page-123',
            type: 'PRODUCTS_GRID',
            title: 'Products',
            content: { columns: 3 },
            position: 1,
            isVisible: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      };

      mockPrisma.creatorPage.findFirst.mockResolvedValue(mockPrismaPage);

      const result = await repository.findPublishedBySlug('my-shop');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('my-shop');
      expect(result!.title).toBe('My Shop');
      expect(result!.isPublished).toBe(true);
      expect(result!.sections).toHaveLength(2);
      expect(result!.visibleSections).toHaveLength(2);

      expect(mockPrisma.creatorPage.findFirst).toHaveBeenCalledWith({
        where: {
          slug: 'my-shop',
          status: 'PUBLISHED',
        },
        include: {
          sections: {
            orderBy: { position: 'asc' },
          },
        },
      });
    });

    it('should return null when page is not published', async () => {
      mockPrisma.creatorPage.findFirst.mockResolvedValue(null);

      const result = await repository.findPublishedBySlug('draft-page');

      expect(result).toBeNull();
    });

    it('should return null when slug does not exist', async () => {
      mockPrisma.creatorPage.findFirst.mockResolvedValue(null);

      const result = await repository.findPublishedBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('should filter out invisible sections in visibleSections getter', async () => {
      const mockPrismaPage = {
        id: 'page-123',
        creatorId: 'creator-456',
        slug: 'my-shop',
        title: 'My Shop',
        description: null,
        templateId: null,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        sections: [
          {
            id: 'section-1',
            pageId: 'page-123',
            type: 'HERO',
            title: 'Welcome',
            content: {},
            position: 0,
            isVisible: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'section-2',
            pageId: 'page-123',
            type: 'ABOUT',
            title: 'Hidden',
            content: {},
            position: 1,
            isVisible: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      };

      mockPrisma.creatorPage.findFirst.mockResolvedValue(mockPrismaPage);

      const result = await repository.findPublishedBySlug('my-shop');

      expect(result).not.toBeNull();
      expect(result!.sections).toHaveLength(2);
      expect(result!.visibleSections).toHaveLength(1);
      const firstVisibleSection = result!.visibleSections[0];
      expect(firstVisibleSection?.title).toBe('Welcome');
    });
  });

  describe('findBySlug', () => {
    it('should return page regardless of status', async () => {
      const mockPrismaPage = {
        id: 'page-123',
        creatorId: 'creator-456',
        slug: 'draft-shop',
        title: 'Draft Shop',
        description: null,
        templateId: null,
        status: 'DRAFT',
        publishedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        sections: [],
      };

      mockPrisma.creatorPage.findUnique.mockResolvedValue(mockPrismaPage);

      const result = await repository.findBySlug('draft-shop');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('draft-shop');
      expect(result!.isDraft).toBe(true);
    });
  });

  describe('slugExists', () => {
    it('should return true when slug exists', async () => {
      mockPrisma.creatorPage.findFirst.mockResolvedValue({ id: 'page-123' });

      const result = await repository.slugExists('existing-slug');

      expect(result).toBe(true);
    });

    it('should return false when slug does not exist', async () => {
      mockPrisma.creatorPage.findFirst.mockResolvedValue(null);

      const result = await repository.slugExists('new-slug');

      expect(result).toBe(false);
    });

    it('should exclude specific page when checking', async () => {
      mockPrisma.creatorPage.findFirst.mockResolvedValue(null);

      await repository.slugExists('my-slug', 'page-123');

      expect(mockPrisma.creatorPage.findFirst).toHaveBeenCalledWith({
        where: {
          slug: 'my-slug',
          id: { not: 'page-123' },
        },
        select: { id: true },
      });
    });
  });

  // Helper to build a minimal valid Prisma page
  function buildPage(overrides: Record<string, unknown> = {}) {
    return {
      id: 'page-123',
      creatorId: 'creator-456',
      slug: 'my-shop',
      title: 'My Shop',
      description: null,
      bannerImage: null,
      bannerPosition: null,
      tagline: null,
      titleFont: null,
      titleColor: null,
      socialLinks: null,
      templateId: null,
      status: 'DRAFT',
      publishedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      sections: [],
      ...overrides,
    };
  }

  function buildSection(overrides: Record<string, unknown> = {}) {
    return {
      id: 'section-1',
      pageId: 'page-123',
      type: 'HERO',
      title: 'Hero',
      content: {},
      position: 0,
      isVisible: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    };
  }

  describe('findById', () => {
    it('should return null when page not found', async () => {
      mockPrisma.creatorPage.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should return a CreatorPage domain entity when found', async () => {
      mockPrisma.creatorPage.findUnique.mockResolvedValue(buildPage({ status: 'PUBLISHED' }));

      const result = await repository.findById('page-123');

      expect(result).not.toBeNull();
      expect(result!.idString).toBe('page-123');
      expect(result!.slug).toBe('my-shop');
    });

    it('should throw when toDomain fails due to invalid status', async () => {
      mockPrisma.creatorPage.findUnique.mockResolvedValue(
        buildPage({ status: 'INVALID_STATUS' })
      );

      await expect(repository.findById('page-123')).rejects.toThrow(
        'Failed to reconstitute CreatorPage'
      );
    });
  });

  describe('findByCreatorId', () => {
    it('should return list of pages for a creator', async () => {
      mockPrisma.creatorPage.findMany.mockResolvedValue([
        buildPage({ id: 'page-1', slug: 'shop-1' }),
        buildPage({ id: 'page-2', slug: 'shop-2' }),
      ]);

      const result = await repository.findByCreatorId('creator-456');

      expect(result).toHaveLength(2);
      expect(result[0]!.slug).toBe('shop-1');
      expect(result[1]!.slug).toBe('shop-2');
    });

    it('should return empty array when no pages found', async () => {
      mockPrisma.creatorPage.findMany.mockResolvedValue([]);

      const result = await repository.findByCreatorId('creator-456');

      expect(result).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should upsert the page and sync sections', async () => {
      mockPrisma.creatorPage.upsert.mockResolvedValue({});
      mockPrisma.pageSection.deleteMany.mockResolvedValue({});
      mockPrisma.pageSection.upsert.mockResolvedValue({});

      // Create a page via findPublishedBySlug (to get a real domain entity)
      mockPrisma.creatorPage.findFirst.mockResolvedValue(
        buildPage({ status: 'PUBLISHED', publishedAt: new Date('2024-01-15') })
      );
      const page = await repository.findPublishedBySlug('my-shop');

      await repository.save(page!);

      expect(mockPrisma.creatorPage.upsert).toHaveBeenCalledOnce();
      expect(mockPrisma.pageSection.deleteMany).toHaveBeenCalledOnce();
    });

    it('should upsert sections when page has sections', async () => {
      mockPrisma.creatorPage.upsert.mockResolvedValue({});
      mockPrisma.pageSection.deleteMany.mockResolvedValue({});
      mockPrisma.pageSection.upsert.mockResolvedValue({});

      mockPrisma.creatorPage.findFirst.mockResolvedValue(
        buildPage({
          status: 'PUBLISHED',
          publishedAt: new Date('2024-01-15'),
          sections: [buildSection()],
        })
      );
      const page = await repository.findPublishedBySlug('my-shop');

      await repository.save(page!);

      expect(mockPrisma.pageSection.upsert).toHaveBeenCalledOnce();
    });
  });

  describe('delete', () => {
    it('should delete a page by id', async () => {
      mockPrisma.creatorPage.delete.mockResolvedValue({});

      await repository.delete('page-123');

      expect(mockPrisma.creatorPage.delete).toHaveBeenCalledWith({
        where: { id: 'page-123' },
      });
    });
  });

  describe('countByCreatorId', () => {
    it('should count all pages for a creator', async () => {
      mockPrisma.creatorPage.count.mockResolvedValue(5);

      const result = await repository.countByCreatorId('creator-456');

      expect(result).toBe(5);
      expect(mockPrisma.creatorPage.count).toHaveBeenCalledWith({
        where: { creatorId: 'creator-456' },
      });
    });

    it('should count pages with status filter', async () => {
      mockPrisma.creatorPage.count.mockResolvedValue(2);

      const result = await repository.countByCreatorId('creator-456', 'PUBLISHED');

      expect(result).toBe(2);
      expect(mockPrisma.creatorPage.count).toHaveBeenCalledWith({
        where: { creatorId: 'creator-456', status: 'PUBLISHED' },
      });
    });
  });

  describe('findSectionById', () => {
    it('should return null when section not found', async () => {
      mockPrisma.pageSection.findUnique.mockResolvedValue(null);

      const result = await repository.findSectionById('non-existent');

      expect(result).toBeNull();
    });

    it('should return a PageSection domain entity when found', async () => {
      mockPrisma.pageSection.findUnique.mockResolvedValue(buildSection());

      const result = await repository.findSectionById('section-1');

      expect(result).not.toBeNull();
      expect(result!.idString).toBe('section-1');
      expect(result!.title).toBe('Hero');
    });

    it('should throw when sectionToDomain fails due to invalid type', async () => {
      mockPrisma.pageSection.findUnique.mockResolvedValue(
        buildSection({ type: 'INVALID_SECTION_TYPE' })
      );

      await expect(repository.findSectionById('section-1')).rejects.toThrow(
        'Failed to reconstitute PageSection'
      );
    });
  });

  describe('saveSection', () => {
    it('should upsert a section', async () => {
      mockPrisma.pageSection.upsert.mockResolvedValue({});
      mockPrisma.pageSection.findUnique.mockResolvedValue(buildSection());

      const section = await repository.findSectionById('section-1');
      await repository.saveSection(section!);

      expect(mockPrisma.pageSection.upsert).toHaveBeenCalledOnce();
    });
  });

  describe('deleteSection', () => {
    it('should delete a section by id', async () => {
      mockPrisma.pageSection.delete.mockResolvedValue({});

      await repository.deleteSection('section-1');

      expect(mockPrisma.pageSection.delete).toHaveBeenCalledWith({
        where: { id: 'section-1' },
      });
    });
  });
});
