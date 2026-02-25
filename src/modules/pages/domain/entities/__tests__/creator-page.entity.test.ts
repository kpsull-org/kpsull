import { describe, it, expect } from 'vitest';
import { CreatorPage } from '../creator-page.entity';
import { SectionType } from '../../value-objects/section-type.vo';

const VALID_PAGE_PROPS = { creatorId: 'creator-123', slug: 'my-shop', title: 'Ma Boutique' };

function createPage(overrides: Partial<typeof VALID_PAGE_PROPS> = {}) {
  return CreatorPage.create({ ...VALID_PAGE_PROPS, ...overrides });
}

function createPageValue(overrides: Partial<typeof VALID_PAGE_PROPS> = {}) {
  return createPage(overrides).value;
}

function reconstitutedPublishedPage() {
  return CreatorPage.reconstitute({
    id: 'page-123',
    ...VALID_PAGE_PROPS,
    status: 'PUBLISHED',
    sections: [],
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }).value;
}

describe('CreatorPage Entity', () => {
  describe('create', () => {
    it('should create a valid page with required fields', () => {
      const result = createPage();

      expect(result.isSuccess).toBe(true);
      expect(result.value.creatorId).toBe('creator-123');
      expect(result.value.slug).toBe('my-shop');
      expect(result.value.title).toBe('Ma Boutique');
      expect(result.value.isDraft).toBe(true);
      expect(result.value.isPublished).toBe(false);
      expect(result.value.sections).toEqual([]);
    });

    it('should create a page with optional fields', () => {
      const result = CreatorPage.create({
        ...VALID_PAGE_PROPS,
        description: 'Bienvenue sur ma boutique',
        templateId: 'template-1',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.description).toBe('Bienvenue sur ma boutique');
      expect(result.value.templateId).toBe('template-1');
    });

    it('should fail when creatorId is empty', () => {
      const result = createPage({ creatorId: '' });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when title is empty', () => {
      const result = createPage({ title: '' });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when title exceeds 200 characters', () => {
      const result = createPage({ title: 'a'.repeat(201) });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200');
    });

    it('should fail when slug is empty', () => {
      const result = createPage({ slug: '' });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('slug');
    });

    it('should fail when slug is too short', () => {
      const result = createPage({ slug: 'ab' });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('3 caracteres');
    });

    it('should fail when slug exceeds 50 characters', () => {
      const result = createPage({ slug: 'a'.repeat(51) });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('50');
    });

    it('should fail when slug contains invalid characters', () => {
      const result = createPage({ slug: 'my_shop!' });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('lettres');
    });

    it('should normalize slug to lowercase', () => {
      const result = createPage({ slug: 'My-Shop' });
      expect(result.isSuccess).toBe(true);
      expect(result.value.slug).toBe('my-shop');
    });

    it('should fail when description exceeds 500 characters', () => {
      const result = CreatorPage.create({
        ...VALID_PAGE_PROPS,
        description: 'a'.repeat(501),
      });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('500');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a page from persistence', () => {
      const result = CreatorPage.reconstitute({
        id: 'page-123',
        ...VALID_PAGE_PROPS,
        description: 'Description',
        templateId: 'template-1',
        status: 'PUBLISHED',
        sections: [
          {
            id: 'section-1',
            pageId: 'page-123',
            type: 'HERO' as const,
            title: 'Hero Section',
            content: { heading: 'Welcome' },
            position: 0,
            isVisible: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
        publishedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('page-123');
      expect(result.value.isPublished).toBe(true);
      expect(result.value.sections).toHaveLength(1);
      expect(result.value.sections[0]!.type.isHero).toBe(true);
    });

    it('should fail with invalid status', () => {
      const result = CreatorPage.reconstitute({
        id: 'page-123',
        ...VALID_PAGE_PROPS,
        status: 'INVALID_STATUS' as never,
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });

    it('should fail with invalid section type', () => {
      const result = CreatorPage.reconstitute({
        id: 'page-123',
        ...VALID_PAGE_PROPS,
        status: 'DRAFT',
        sections: [
          {
            id: 'section-1',
            pageId: 'page-123',
            type: 'INVALID_TYPE' as never,
            title: 'Bad Section',
            content: {},
            position: 0,
            isVisible: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });
  });

  describe('publish', () => {
    it('should publish a draft page', () => {
      const page = createPageValue();
      const result = page.publish();

      expect(result.isSuccess).toBe(true);
      expect(page.isPublished).toBe(true);
      expect(page.publishedAt).toBeDefined();
    });

    it('should fail to publish an already published page', () => {
      const page = reconstitutedPublishedPage();
      const result = page.publish();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja publiee');
    });
  });

  describe('unpublish', () => {
    it('should unpublish a published page', () => {
      const page = reconstitutedPublishedPage();
      const result = page.unpublish();

      expect(result.isSuccess).toBe(true);
      expect(page.isDraft).toBe(true);
    });

    it('should fail to unpublish a draft page', () => {
      const page = createPageValue();
      const result = page.unpublish();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('brouillon');
    });
  });

  describe('updateSettings', () => {
    it('should update title successfully', () => {
      const page = createPageValue();
      const result = page.updateSettings({ title: 'Nouveau Titre' });

      expect(result.isSuccess).toBe(true);
      expect(page.title).toBe('Nouveau Titre');
    });

    it('should update description successfully', () => {
      const page = createPageValue();
      const result = page.updateSettings({ description: 'Nouvelle description' });

      expect(result.isSuccess).toBe(true);
      expect(page.description).toBe('Nouvelle description');
    });

    it('should clear description when set to empty string', () => {
      const page = createPageValue();
      page.updateSettings({ description: 'Quelque chose' });
      const result = page.updateSettings({ description: '   ' });

      expect(result.isSuccess).toBe(true);
      expect(page.description).toBeUndefined();
    });

    it('should update slug successfully', () => {
      const page = createPageValue({ slug: 'old-slug' });
      const result = page.updateSettings({ slug: 'new-slug' });

      expect(result.isSuccess).toBe(true);
      expect(page.slug).toBe('new-slug');
    });

    it('should fail with empty title', () => {
      const page = createPageValue();
      const result = page.updateSettings({ title: '' });
      expect(result.isFailure).toBe(true);
    });

    it('should fail with invalid slug', () => {
      const page = createPageValue();
      const result = page.updateSettings({ slug: 'invalid_slug!' });
      expect(result.isFailure).toBe(true);
    });

    it('should fail when slug exceeds 50 characters', () => {
      const page = createPageValue();
      const result = page.updateSettings({ slug: 'a'.repeat(51) });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('50');
    });

    it('should fail when slug is empty string', () => {
      const page = createPageValue();
      const result = page.updateSettings({ slug: '' });
      expect(result.isFailure).toBe(true);
    });

    it('should fail when slug is too short', () => {
      const page = createPageValue();
      const result = page.updateSettings({ slug: 'ab' });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('3 caracteres');
    });

    it('should fail when title exceeds 200 characters', () => {
      const page = createPageValue();
      const result = page.updateSettings({ title: 'a'.repeat(201) });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200');
    });

    it('should fail when description exceeds 500 characters', () => {
      const page = createPageValue();
      const result = page.updateSettings({ description: 'a'.repeat(501) });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('500');
    });

    it('should update bannerImage', () => {
      const page = createPageValue();
      const result = page.updateSettings({ bannerImage: 'https://example.com/banner.jpg' });
      expect(result.isSuccess).toBe(true);
      expect(page.bannerImage).toBe('https://example.com/banner.jpg');
    });

    it('should clear bannerImage when empty string', () => {
      const page = createPageValue();
      page.updateSettings({ bannerImage: 'https://example.com/banner.jpg' });
      const result = page.updateSettings({ bannerImage: '' });
      expect(result.isSuccess).toBe(true);
      expect(page.bannerImage).toBeUndefined();
    });

    it('should update bannerPosition', () => {
      const page = createPageValue();
      const result = page.updateSettings({ bannerPosition: 'center' });
      expect(result.isSuccess).toBe(true);
      expect(page.bannerPosition).toBe('center');
    });

    it('should clear bannerPosition when empty string', () => {
      const page = createPageValue();
      const result = page.updateSettings({ bannerPosition: '' });
      expect(result.isSuccess).toBe(true);
      expect(page.bannerPosition).toBeUndefined();
    });

    it('should update tagline', () => {
      const page = createPageValue();
      const result = page.updateSettings({ tagline: 'My tagline' });
      expect(result.isSuccess).toBe(true);
      expect(page.tagline).toBe('My tagline');
    });

    it('should clear tagline when blank string', () => {
      const page = createPageValue();
      const result = page.updateSettings({ tagline: '   ' });
      expect(result.isSuccess).toBe(true);
      expect(page.tagline).toBeUndefined();
    });

    it('should update titleFont', () => {
      const page = createPageValue();
      const result = page.updateSettings({ titleFont: 'Inter' });
      expect(result.isSuccess).toBe(true);
      expect(page.titleFont).toBe('Inter');
    });

    it('should clear titleFont when blank string', () => {
      const page = createPageValue();
      const result = page.updateSettings({ titleFont: '  ' });
      expect(result.isSuccess).toBe(true);
      expect(page.titleFont).toBeUndefined();
    });

    it('should update titleColor', () => {
      const page = createPageValue();
      const result = page.updateSettings({ titleColor: '#ff0000' });
      expect(result.isSuccess).toBe(true);
      expect(page.titleColor).toBe('#ff0000');
    });

    it('should clear titleColor when blank string', () => {
      const page = createPageValue();
      const result = page.updateSettings({ titleColor: '  ' });
      expect(result.isSuccess).toBe(true);
      expect(page.titleColor).toBeUndefined();
    });

    it('should update socialLinks', () => {
      const page = createPageValue();
      const result = page.updateSettings({ socialLinks: { instagram: 'https://instagram.com/me' } });
      expect(result.isSuccess).toBe(true);
      expect(page.socialLinks).toEqual({ instagram: 'https://instagram.com/me' });
    });

    it('should clear socialLinks when empty object', () => {
      const page = createPageValue();
      const result = page.updateSettings({ socialLinks: {} });
      expect(result.isSuccess).toBe(true);
      expect(page.socialLinks).toBeUndefined();
    });
  });

  describe('addSection', () => {
    it('should add a section at the end', () => {
      const page = createPageValue();
      const result = page.addSection({ type: SectionType.hero(), title: 'Hero Section' });

      expect(result.isSuccess).toBe(true);
      expect(page.sections).toHaveLength(1);
      expect(page.sections[0]!.type.isHero).toBe(true);
      expect(page.sections[0]!.position).toBe(0);
    });

    it('should add a section at specific position', () => {
      const page = createPageValue();
      page.addSection({ type: SectionType.hero(), title: 'Hero' });
      page.addSection({ type: SectionType.contact(), title: 'Contact' });

      const result = page.addSection({ type: SectionType.about(), title: 'About', position: 1 });

      expect(result.isSuccess).toBe(true);
      expect(page.sections).toHaveLength(3);
      expect(page.sections[0]!.type.isHero).toBe(true);
      expect(page.sections[1]!.type.isAbout).toBe(true);
      expect(page.sections[2]!.type.isContact).toBe(true);
    });

    it('should add a section with content', () => {
      const page = createPageValue();
      const result = page.addSection({
        type: SectionType.hero(),
        title: 'Hero Section',
        content: { heading: 'Welcome', subheading: 'To my shop' },
      });

      expect(result.isSuccess).toBe(true);
      expect(page.sections[0]!.content).toEqual({ heading: 'Welcome', subheading: 'To my shop' });
    });
  });

  describe('removeSection', () => {
    it('should remove a section', () => {
      const page = createPageValue();
      const section = page.addSection({ type: SectionType.hero(), title: 'Hero Section' }).value;

      const result = page.removeSection(section.idString);

      expect(result.isSuccess).toBe(true);
      expect(page.sections).toHaveLength(0);
    });

    it('should fail when section not found', () => {
      const page = createPageValue();
      const result = page.removeSection('non-existent');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvee');
    });

    it('should reorder remaining sections after removal', () => {
      const page = createPageValue();
      page.addSection({ type: SectionType.hero(), title: 'Hero' });
      const aboutSection = page.addSection({ type: SectionType.about(), title: 'About' }).value;
      page.addSection({ type: SectionType.contact(), title: 'Contact' });

      page.removeSection(aboutSection.idString);

      expect(page.sections).toHaveLength(2);
      expect(page.sections[0]!.position).toBe(0);
      expect(page.sections[1]!.position).toBe(1);
    });
  });

  describe('reorderSections', () => {
    it('should reorder sections successfully', () => {
      const page = createPageValue();
      const hero = page.addSection({ type: SectionType.hero(), title: 'Hero' }).value;
      const about = page.addSection({ type: SectionType.about(), title: 'About' }).value;
      const contact = page.addSection({ type: SectionType.contact(), title: 'Contact' }).value;

      const result = page.reorderSections([contact.idString, hero.idString, about.idString]);

      expect(result.isSuccess).toBe(true);
      expect(page.sections[0]!.type.isContact).toBe(true);
      expect(page.sections[1]!.type.isHero).toBe(true);
      expect(page.sections[2]!.type.isAbout).toBe(true);
    });

    it('should fail when section count does not match', () => {
      const page = createPageValue();
      const hero = page.addSection({ type: SectionType.hero(), title: 'Hero' }).value;
      page.addSection({ type: SectionType.about(), title: 'About' });

      const result = page.reorderSections([hero.idString]);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nombre');
    });

    it('should fail when section not found', () => {
      const page = createPageValue();
      const hero = page.addSection({ type: SectionType.hero(), title: 'Hero' }).value;

      const result = page.reorderSections([hero.idString, 'non-existent']);
      expect(result.isFailure).toBe(true);
    });
  });

  describe('getSection', () => {
    it('should get section by id', () => {
      const page = createPageValue();
      const section = page.addSection({ type: SectionType.hero(), title: 'Hero Section' }).value;

      const result = page.getSection(section.idString);

      expect(result).toBeDefined();
      expect(result!.idString).toBe(section.idString);
    });

    it('should return undefined for non-existent section', () => {
      const page = createPageValue();
      const result = page.getSection('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('visibleSections', () => {
    it('should return only visible sections', () => {
      const page = createPageValue();
      const hero = page.addSection({ type: SectionType.hero(), title: 'Hero' }).value;
      const about = page.addSection({ type: SectionType.about(), title: 'About' }).value;
      about.hide();
      page.addSection({ type: SectionType.contact(), title: 'Contact' });

      const visibleSections = page.visibleSections;

      expect(visibleSections).toHaveLength(2);
      expect(visibleSections[0]!.idString).toBe(hero.idString);
    });
  });
});
