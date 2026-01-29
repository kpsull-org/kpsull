import { describe, it, expect } from 'vitest';
import { CreatorPage } from '../creator-page.entity';
import { SectionType } from '../../value-objects/section-type.vo';

describe('CreatorPage Entity', () => {
  describe('create', () => {
    it('should create a valid page with required fields', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.creatorId).toBe('creator-123');
      expect(result.value!.slug).toBe('my-shop');
      expect(result.value!.title).toBe('Ma Boutique');
      expect(result.value!.isDraft).toBe(true);
      expect(result.value!.isPublished).toBe(false);
      expect(result.value!.sections).toEqual([]);
    });

    it('should create a page with optional fields', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
        description: 'Bienvenue sur ma boutique',
        templateId: 'template-1',
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.description).toBe('Bienvenue sur ma boutique');
      expect(result.value!.templateId).toBe('template-1');
    });

    it('should fail when creatorId is empty', () => {
      // Arrange
      const props = {
        creatorId: '',
        slug: 'my-shop',
        title: 'Ma Boutique',
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when title is empty', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: '',
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('titre');
    });

    it('should fail when title exceeds 200 characters', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'a'.repeat(201),
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('200');
    });

    it('should fail when slug is empty', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: '',
        title: 'Ma Boutique',
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('slug');
    });

    it('should fail when slug is too short', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: 'ab',
        title: 'Ma Boutique',
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('3 caracteres');
    });

    it('should fail when slug exceeds 50 characters', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: 'a'.repeat(51),
        title: 'Ma Boutique',
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('50');
    });

    it('should fail when slug contains invalid characters', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: 'my_shop!',
        title: 'Ma Boutique',
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('lettres');
    });

    it('should normalize slug to lowercase', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: 'My-Shop',
        title: 'Ma Boutique',
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.slug).toBe('my-shop');
    });

    it('should fail when description exceeds 500 characters', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
        description: 'a'.repeat(501),
      };

      // Act
      const result = CreatorPage.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('500');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a page from persistence', () => {
      // Arrange
      const props = {
        id: 'page-123',
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
        description: 'Description',
        templateId: 'template-1',
        status: 'PUBLISHED' as const,
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
      };

      // Act
      const result = CreatorPage.reconstitute(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.idString).toBe('page-123');
      expect(result.value!.isPublished).toBe(true);
      expect(result.value!.sections).toHaveLength(1);
      expect(result.value!.sections[0]!.type.isHero).toBe(true);
    });
  });

  describe('publish', () => {
    it('should publish a draft page', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.publish();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.isPublished).toBe(true);
      expect(page.publishedAt).toBeDefined();
    });

    it('should fail to publish an already published page', () => {
      // Arrange
      const page = CreatorPage.reconstitute({
        id: 'page-123',
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
        status: 'PUBLISHED',
        sections: [],
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      // Act
      const result = page.publish();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('deja publiee');
    });
  });

  describe('unpublish', () => {
    it('should unpublish a published page', () => {
      // Arrange
      const page = CreatorPage.reconstitute({
        id: 'page-123',
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
        status: 'PUBLISHED',
        sections: [],
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      // Act
      const result = page.unpublish();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.isDraft).toBe(true);
    });

    it('should fail to unpublish a draft page', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.unpublish();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('brouillon');
    });
  });

  describe('updateSettings', () => {
    it('should update title successfully', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ancien Titre',
      }).value!;

      // Act
      const result = page.updateSettings({ title: 'Nouveau Titre' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.title).toBe('Nouveau Titre');
    });

    it('should update description successfully', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.updateSettings({ description: 'Nouvelle description' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.description).toBe('Nouvelle description');
    });

    it('should update slug successfully', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'old-slug',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.updateSettings({ slug: 'new-slug' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.slug).toBe('new-slug');
    });

    it('should fail with empty title', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.updateSettings({ title: '' });

      // Assert
      expect(result.isFailure).toBe(true);
    });

    it('should fail with invalid slug', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.updateSettings({ slug: 'invalid_slug!' });

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('addSection', () => {
    it('should add a section at the end', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.addSection({
        type: SectionType.hero(),
        title: 'Hero Section',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.sections).toHaveLength(1);
      expect(page.sections[0]!.type.isHero).toBe(true);
      expect(page.sections[0]!.position).toBe(0);
    });

    it('should add a section at specific position', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      page.addSection({ type: SectionType.hero(), title: 'Hero' });
      page.addSection({ type: SectionType.contact(), title: 'Contact' });

      // Act
      const result = page.addSection({
        type: SectionType.about(),
        title: 'About',
        position: 1,
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.sections).toHaveLength(3);
      expect(page.sections[0]!.type.isHero).toBe(true);
      expect(page.sections[1]!.type.isAbout).toBe(true);
      expect(page.sections[2]!.type.isContact).toBe(true);
    });

    it('should add a section with content', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.addSection({
        type: SectionType.hero(),
        title: 'Hero Section',
        content: { heading: 'Welcome', subheading: 'To my shop' },
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.sections[0]!.content).toEqual({
        heading: 'Welcome',
        subheading: 'To my shop',
      });
    });
  });

  describe('removeSection', () => {
    it('should remove a section', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      const section = page.addSection({
        type: SectionType.hero(),
        title: 'Hero Section',
      }).value!;

      // Act
      const result = page.removeSection(section.idString);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.sections).toHaveLength(0);
    });

    it('should fail when section not found', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.removeSection('non-existent');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvee');
    });

    it('should reorder remaining sections after removal', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      page.addSection({ type: SectionType.hero(), title: 'Hero' });
      const aboutSection = page.addSection({ type: SectionType.about(), title: 'About' }).value!;
      page.addSection({ type: SectionType.contact(), title: 'Contact' });

      // Act
      page.removeSection(aboutSection.idString);

      // Assert
      expect(page.sections).toHaveLength(2);
      expect(page.sections[0]!.position).toBe(0);
      expect(page.sections[1]!.position).toBe(1);
    });
  });

  describe('reorderSections', () => {
    it('should reorder sections successfully', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      const hero = page.addSection({ type: SectionType.hero(), title: 'Hero' }).value!;
      const about = page.addSection({ type: SectionType.about(), title: 'About' }).value!;
      const contact = page.addSection({ type: SectionType.contact(), title: 'Contact' }).value!;

      // Act
      const result = page.reorderSections([contact.idString, hero.idString, about.idString]);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.sections[0]!.type.isContact).toBe(true);
      expect(page.sections[1]!.type.isHero).toBe(true);
      expect(page.sections[2]!.type.isAbout).toBe(true);
    });

    it('should fail when section count does not match', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      const hero = page.addSection({ type: SectionType.hero(), title: 'Hero' }).value!;
      page.addSection({ type: SectionType.about(), title: 'About' });

      // Act
      const result = page.reorderSections([hero.idString]);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nombre');
    });

    it('should fail when section not found', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      const hero = page.addSection({ type: SectionType.hero(), title: 'Hero' }).value!;

      // Act
      const result = page.reorderSections([hero.idString, 'non-existent']);

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('getSection', () => {
    it('should get section by id', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      const section = page.addSection({
        type: SectionType.hero(),
        title: 'Hero Section',
      }).value!;

      // Act
      const result = page.getSection(section.idString);

      // Assert
      expect(result).toBeDefined();
      expect(result!.idString).toBe(section.idString);
    });

    it('should return undefined for non-existent section', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      // Act
      const result = page.getSection('non-existent');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('visibleSections', () => {
    it('should return only visible sections', () => {
      // Arrange
      const page = CreatorPage.create({
        creatorId: 'creator-123',
        slug: 'my-shop',
        title: 'Ma Boutique',
      }).value!;

      const hero = page.addSection({ type: SectionType.hero(), title: 'Hero' }).value!;
      const about = page.addSection({ type: SectionType.about(), title: 'About' }).value!;
      about.hide();
      page.addSection({ type: SectionType.contact(), title: 'Contact' });

      // Act
      const visibleSections = page.visibleSections;

      // Assert
      expect(visibleSections).toHaveLength(2);
      expect(visibleSections[0]!.idString).toBe(hero.idString);
    });
  });
});
