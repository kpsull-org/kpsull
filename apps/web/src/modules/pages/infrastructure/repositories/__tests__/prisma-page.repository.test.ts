import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client - use vi.hoisted to ensure the mock is available before imports
const mockPrisma = vi.hoisted(() => ({
  creatorPage: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  pageSection: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
});
