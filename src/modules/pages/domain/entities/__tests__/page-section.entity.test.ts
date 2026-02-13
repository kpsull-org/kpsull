import { describe, it, expect } from 'vitest';
import { PageSection } from '../page-section.entity';
import { SectionType } from '../../value-objects/section-type.vo';

const VALID_SECTION_PROPS = {
  pageId: 'page-123',
  type: SectionType.hero(),
  title: 'Hero Section',
  position: 0,
};

function createSection(overrides: Partial<typeof VALID_SECTION_PROPS> = {}) {
  return PageSection.create({ ...VALID_SECTION_PROPS, ...overrides });
}

function createSectionValue(overrides: Partial<typeof VALID_SECTION_PROPS> = {}) {
  return createSection(overrides).value;
}

describe('PageSection Entity', () => {
  describe('create', () => {
    it('should create a valid section with required fields', () => {
      const result = createSection();

      expect(result.isSuccess).toBe(true);
      expect(result.value.pageId).toBe('page-123');
      expect(result.value.type.isHero).toBe(true);
      expect(result.value.title).toBe('Hero Section');
      expect(result.value.position).toBe(0);
      expect(result.value.isVisible).toBe(true);
      expect(result.value.content).toEqual({});
    });

    it('should create a section with optional fields', () => {
      const result = PageSection.create({
        pageId: 'page-123',
        type: SectionType.about(),
        title: 'About Section',
        content: { text: 'About me', image: '/image.jpg' },
        position: 1,
        isVisible: false,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.content).toEqual({ text: 'About me', image: '/image.jpg' });
      expect(result.value.isVisible).toBe(false);
    });

    it('should fail when pageId is empty', () => {
      const result = createSection({ pageId: '' });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Page ID');
    });

    it('should fail when title is empty', () => {
      const result = createSection({ title: '' });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when title exceeds 200 characters', () => {
      const result = createSection({ title: 'a'.repeat(201) });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200');
    });

    it('should fail when position is negative', () => {
      const result = createSection({ position: -1 });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('position');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a section from persistence', () => {
      const result = PageSection.reconstitute({
        id: 'section-123',
        pageId: 'page-123',
        type: 'HERO' as const,
        title: 'Hero Section',
        content: { heading: 'Welcome' },
        position: 0,
        isVisible: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('section-123');
      expect(result.value.type.isHero).toBe(true);
      expect(result.value.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should fail with invalid type', () => {
      const result = PageSection.reconstitute({
        id: 'section-123',
        pageId: 'page-123',
        type: 'INVALID' as 'HERO',
        title: 'Hero Section',
        content: {},
        position: 0,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('updateContent', () => {
    it('should update the content', () => {
      const section = createSectionValue();
      const originalUpdatedAt = section.updatedAt;
      const newContent = { heading: 'New Heading', subheading: 'New Sub' };

      const result = section.updateContent(newContent);

      expect(result.isSuccess).toBe(true);
      expect(section.content).toEqual(newContent);
      expect(section.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('updateTitle', () => {
    it('should update the title successfully', () => {
      const section = createSectionValue({ title: 'Old Title' });
      const result = section.updateTitle('New Title');

      expect(result.isSuccess).toBe(true);
      expect(section.title).toBe('New Title');
    });

    it('should fail with empty title', () => {
      const section = createSectionValue();
      const result = section.updateTitle('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when title exceeds 200 characters', () => {
      const section = createSectionValue();
      const result = section.updateTitle('a'.repeat(201));

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200');
    });
  });

  describe('updatePosition', () => {
    it('should update the position successfully', () => {
      const section = createSectionValue();
      const result = section.updatePosition(5);

      expect(result.isSuccess).toBe(true);
      expect(section.position).toBe(5);
    });

    it('should fail with negative position', () => {
      const section = createSectionValue();
      const result = section.updatePosition(-1);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('position');
    });
  });

  describe('hide and show', () => {
    it('should hide the section', () => {
      const section = createSectionValue();
      section.hide();
      expect(section.isVisible).toBe(false);
    });

    it('should show the section', () => {
      const section = PageSection.create({
        ...VALID_SECTION_PROPS,
        isVisible: false,
      }).value;
      section.show();
      expect(section.isVisible).toBe(true);
    });
  });
});
