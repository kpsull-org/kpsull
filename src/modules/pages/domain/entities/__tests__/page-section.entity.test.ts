import { describe, it, expect } from 'vitest';
import { PageSection } from '../page-section.entity';
import { SectionType } from '../../value-objects/section-type.vo';

describe('PageSection Entity', () => {
  describe('create', () => {
    it('should create a valid section with required fields', () => {
      // Arrange
      const props = {
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Hero Section',
        position: 0,
      };

      // Act
      const result = PageSection.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.pageId).toBe('page-123');
      expect(result.value!.type.isHero).toBe(true);
      expect(result.value!.title).toBe('Hero Section');
      expect(result.value!.position).toBe(0);
      expect(result.value!.isVisible).toBe(true);
      expect(result.value!.content).toEqual({});
    });

    it('should create a section with optional fields', () => {
      // Arrange
      const props = {
        pageId: 'page-123',
        type: SectionType.about(),
        title: 'About Section',
        content: { text: 'About me', image: '/image.jpg' },
        position: 1,
        isVisible: false,
      };

      // Act
      const result = PageSection.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.content).toEqual({ text: 'About me', image: '/image.jpg' });
      expect(result.value!.isVisible).toBe(false);
    });

    it('should fail when pageId is empty', () => {
      // Arrange
      const props = {
        pageId: '',
        type: SectionType.hero(),
        title: 'Hero Section',
        position: 0,
      };

      // Act
      const result = PageSection.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Page ID');
    });

    it('should fail when title is empty', () => {
      // Arrange
      const props = {
        pageId: 'page-123',
        type: SectionType.hero(),
        title: '',
        position: 0,
      };

      // Act
      const result = PageSection.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when title exceeds 200 characters', () => {
      // Arrange
      const props = {
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'a'.repeat(201),
        position: 0,
      };

      // Act
      const result = PageSection.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200');
    });

    it('should fail when position is negative', () => {
      // Arrange
      const props = {
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Hero Section',
        position: -1,
      };

      // Act
      const result = PageSection.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('position');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a section from persistence', () => {
      // Arrange
      const props = {
        id: 'section-123',
        pageId: 'page-123',
        type: 'HERO' as const,
        title: 'Hero Section',
        content: { heading: 'Welcome' },
        position: 0,
        isVisible: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      // Act
      const result = PageSection.reconstitute(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.idString).toBe('section-123');
      expect(result.value!.type.isHero).toBe(true);
      expect(result.value!.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should fail with invalid type', () => {
      // Arrange
      const props = {
        id: 'section-123',
        pageId: 'page-123',
        type: 'INVALID' as 'HERO',
        title: 'Hero Section',
        content: {},
        position: 0,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = PageSection.reconstitute(props);

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('updateContent', () => {
    it('should update the content', () => {
      // Arrange
      const section = PageSection.create({
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Hero Section',
        position: 0,
      }).value!;
      const originalUpdatedAt = section.updatedAt;

      // Wait a bit to ensure updatedAt changes
      const newContent = { heading: 'New Heading', subheading: 'New Sub' };

      // Act
      const result = section.updateContent(newContent);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(section.content).toEqual(newContent);
      expect(section.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('updateTitle', () => {
    it('should update the title successfully', () => {
      // Arrange
      const section = PageSection.create({
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Old Title',
        position: 0,
      }).value!;

      // Act
      const result = section.updateTitle('New Title');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(section.title).toBe('New Title');
    });

    it('should fail with empty title', () => {
      // Arrange
      const section = PageSection.create({
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Old Title',
        position: 0,
      }).value!;

      // Act
      const result = section.updateTitle('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when title exceeds 200 characters', () => {
      // Arrange
      const section = PageSection.create({
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Old Title',
        position: 0,
      }).value!;

      // Act
      const result = section.updateTitle('a'.repeat(201));

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200');
    });
  });

  describe('updatePosition', () => {
    it('should update the position successfully', () => {
      // Arrange
      const section = PageSection.create({
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Hero Section',
        position: 0,
      }).value!;

      // Act
      const result = section.updatePosition(5);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(section.position).toBe(5);
    });

    it('should fail with negative position', () => {
      // Arrange
      const section = PageSection.create({
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Hero Section',
        position: 0,
      }).value!;

      // Act
      const result = section.updatePosition(-1);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('position');
    });
  });

  describe('hide and show', () => {
    it('should hide the section', () => {
      // Arrange
      const section = PageSection.create({
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Hero Section',
        position: 0,
        isVisible: true,
      }).value!;

      // Act
      section.hide();

      // Assert
      expect(section.isVisible).toBe(false);
    });

    it('should show the section', () => {
      // Arrange
      const section = PageSection.create({
        pageId: 'page-123',
        type: SectionType.hero(),
        title: 'Hero Section',
        position: 0,
        isVisible: false,
      }).value!;

      // Act
      section.show();

      // Assert
      expect(section.isVisible).toBe(true);
    });
  });
});
