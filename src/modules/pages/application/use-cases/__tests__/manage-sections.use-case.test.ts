import { describe, it, expect, beforeEach } from 'vitest';
import {
  AddSectionUseCase,
  AddSectionInput,
  UpdateSectionUseCase,
  UpdateSectionInput,
  RemoveSectionUseCase,
  RemoveSectionInput,
  ReorderSectionsUseCase,
  ReorderSectionsInput,
} from '../manage-sections.use-case';
import { PageRepository } from '../../ports/page.repository.interface';
import { CreatorPage } from '../../../domain/entities/creator-page.entity';
import { SectionType } from '../../../domain/value-objects/section-type.vo';
import { createMockPageRepo, type MockPageRepo } from './page-test.helpers';

describe('AddSectionUseCase', () => {
  let useCase: AddSectionUseCase;
  let mockRepo: MockPageRepo;

  const createMockPage = () => {
    return CreatorPage.create({
      creatorId: 'creator-123',
      slug: 'my-shop',
      title: 'Ma Boutique',
    }).value;
  };

  beforeEach(() => {
    mockRepo = createMockPageRepo();
    useCase = new AddSectionUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should add a section successfully', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: AddSectionInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        type: 'HERO',
        title: 'Hero Section',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.type).toBe('HERO');
      expect(result.value.title).toBe('Hero Section');
      expect(result.value.position).toBe(0);
      expect(result.value.isVisible).toBe(true);
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('should add a section with content', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: AddSectionInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        type: 'HERO',
        title: 'Hero Section',
        content: { heading: 'Welcome', subheading: 'To my shop' },
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.content).toEqual({
        heading: 'Welcome',
        subheading: 'To my shop',
      });
    });

    it('should add a section at specific position', async () => {
      // Arrange
      const page = createMockPage();
      page.addSection({ type: SectionType.hero(), title: 'Hero' });
      page.addSection({ type: SectionType.contact(), title: 'Contact' });
      mockRepo.findById.mockResolvedValue(page);

      const input: AddSectionInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        type: 'ABOUT',
        title: 'About Section',
        position: 1,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.position).toBe(1);
    });

    it('should fail when page not found', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      const input: AddSectionInput = {
        pageId: 'non-existent',
        creatorId: 'creator-123',
        type: 'HERO',
        title: 'Hero Section',
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

      const input: AddSectionInput = {
        pageId: page.idString,
        creatorId: 'other-creator',
        type: 'HERO',
        title: 'Hero Section',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non autorise');
    });

    it('should fail with invalid section type', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: AddSectionInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        type: 'INVALID' as 'HERO',
        title: 'Hero Section',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
    });

    it('should fail with empty title', async () => {
      // Arrange
      const page = createMockPage();
      mockRepo.findById.mockResolvedValue(page);

      const input: AddSectionInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        type: 'HERO',
        title: '',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });
});

describe('UpdateSectionUseCase', () => {
  let useCase: UpdateSectionUseCase;
  let mockRepo: MockPageRepo;

  const createMockPageWithSection = () => {
    const page = CreatorPage.create({
      creatorId: 'creator-123',
      slug: 'my-shop',
      title: 'Ma Boutique',
    }).value;
    const section = page.addSection({
      type: SectionType.hero(),
      title: 'Original Title',
      content: { heading: 'Original' },
    }).value;
    return { page, section };
  };

  beforeEach(() => {
    mockRepo = createMockPageRepo();
    useCase = new UpdateSectionUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should update section title successfully', async () => {
      // Arrange
      const { page, section } = createMockPageWithSection();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdateSectionInput = {
        sectionId: section.idString,
        pageId: page.idString,
        creatorId: 'creator-123',
        title: 'New Title',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.title).toBe('New Title');
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('should update section content successfully', async () => {
      // Arrange
      const { page, section } = createMockPageWithSection();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdateSectionInput = {
        sectionId: section.idString,
        pageId: page.idString,
        creatorId: 'creator-123',
        content: { heading: 'New Heading', subheading: 'New Sub' },
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.content).toEqual({
        heading: 'New Heading',
        subheading: 'New Sub',
      });
    });

    it('should show section successfully', async () => {
      const { page, section } = createMockPageWithSection();
      // Hide it first so we can show it
      section.hide();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdateSectionInput = {
        sectionId: section.idString,
        pageId: page.idString,
        creatorId: 'creator-123',
        isVisible: true,
      };

      const result = await useCase.execute(input);

      expect(result.isSuccess).toBe(true);
      expect(result.value.isVisible).toBe(true);
    });

    it('should fail when title is too long', async () => {
      const { page, section } = createMockPageWithSection();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdateSectionInput = {
        sectionId: section.idString,
        pageId: page.idString,
        creatorId: 'creator-123',
        title: 'a'.repeat(201),
      };

      const result = await useCase.execute(input);

      expect(result.isFailure).toBe(true);
    });

    it('should hide section successfully', async () => {
      // Arrange
      const { page, section } = createMockPageWithSection();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdateSectionInput = {
        sectionId: section.idString,
        pageId: page.idString,
        creatorId: 'creator-123',
        isVisible: false,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.isVisible).toBe(false);
    });

    it('should fail when page not found', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      const input: UpdateSectionInput = {
        sectionId: 'section-123',
        pageId: 'non-existent',
        creatorId: 'creator-123',
        title: 'New Title',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Page non trouvee');
    });

    it('should fail when not owner', async () => {
      // Arrange
      const { page, section } = createMockPageWithSection();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdateSectionInput = {
        sectionId: section.idString,
        pageId: page.idString,
        creatorId: 'other-creator',
        title: 'New Title',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non autorise');
    });

    it('should fail when section not found', async () => {
      // Arrange
      const { page } = createMockPageWithSection();
      mockRepo.findById.mockResolvedValue(page);

      const input: UpdateSectionInput = {
        sectionId: 'non-existent',
        pageId: page.idString,
        creatorId: 'creator-123',
        title: 'New Title',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Section non trouvee');
    });
  });
});

describe('RemoveSectionUseCase', () => {
  let useCase: RemoveSectionUseCase;
  let mockRepo: MockPageRepo;

  const createMockPageWithSection = () => {
    const page = CreatorPage.create({
      creatorId: 'creator-123',
      slug: 'my-shop',
      title: 'Ma Boutique',
    }).value;
    const section = page.addSection({
      type: SectionType.hero(),
      title: 'Hero Section',
    }).value;
    return { page, section };
  };

  beforeEach(() => {
    mockRepo = createMockPageRepo();
    useCase = new RemoveSectionUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should remove section successfully', async () => {
      // Arrange
      const { page, section } = createMockPageWithSection();
      mockRepo.findById.mockResolvedValue(page);

      const input: RemoveSectionInput = {
        sectionId: section.idString,
        pageId: page.idString,
        creatorId: 'creator-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(page.sections).toHaveLength(0);
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('should fail when page not found', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      const input: RemoveSectionInput = {
        sectionId: 'section-123',
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
      const { page, section } = createMockPageWithSection();
      mockRepo.findById.mockResolvedValue(page);

      const input: RemoveSectionInput = {
        sectionId: section.idString,
        pageId: page.idString,
        creatorId: 'other-creator',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non autorise');
    });

    it('should fail when section not found', async () => {
      // Arrange
      const { page } = createMockPageWithSection();
      mockRepo.findById.mockResolvedValue(page);

      const input: RemoveSectionInput = {
        sectionId: 'non-existent',
        pageId: page.idString,
        creatorId: 'creator-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });
});

describe('ReorderSectionsUseCase', () => {
  let useCase: ReorderSectionsUseCase;
  let mockRepo: MockPageRepo;

  const createMockPageWithSections = () => {
    const page = CreatorPage.create({
      creatorId: 'creator-123',
      slug: 'my-shop',
      title: 'Ma Boutique',
    }).value;
    const hero = page.addSection({ type: SectionType.hero(), title: 'Hero' }).value;
    const about = page.addSection({ type: SectionType.about(), title: 'About' }).value;
    const contact = page.addSection({ type: SectionType.contact(), title: 'Contact' }).value;
    return { page, hero, about, contact };
  };

  beforeEach(() => {
    mockRepo = createMockPageRepo();
    useCase = new ReorderSectionsUseCase(mockRepo as unknown as PageRepository);
  });

  describe('execute', () => {
    it('should reorder sections successfully', async () => {
      // Arrange
      const { page, hero, about, contact } = createMockPageWithSections();
      mockRepo.findById.mockResolvedValue(page);

      const input: ReorderSectionsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        sectionIds: [contact.idString, hero.idString, about.idString],
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.sectionIds[0]).toBe(contact.idString);
      expect(result.value.sectionIds[1]).toBe(hero.idString);
      expect(result.value.sectionIds[2]).toBe(about.idString);
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('should fail when page not found', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      const input: ReorderSectionsInput = {
        pageId: 'non-existent',
        creatorId: 'creator-123',
        sectionIds: ['section-1', 'section-2'],
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvee');
    });

    it('should fail when not owner', async () => {
      // Arrange
      const { page, hero, about, contact } = createMockPageWithSections();
      mockRepo.findById.mockResolvedValue(page);

      const input: ReorderSectionsInput = {
        pageId: page.idString,
        creatorId: 'other-creator',
        sectionIds: [contact.idString, hero.idString, about.idString],
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non autorise');
    });

    it('should fail when section count does not match', async () => {
      // Arrange
      const { page, hero } = createMockPageWithSections();
      mockRepo.findById.mockResolvedValue(page);

      const input: ReorderSectionsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        sectionIds: [hero.idString],
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
    });

    it('should fail when section not found in list', async () => {
      // Arrange
      const { page, hero, about } = createMockPageWithSections();
      mockRepo.findById.mockResolvedValue(page);

      const input: ReorderSectionsInput = {
        pageId: page.idString,
        creatorId: 'creator-123',
        sectionIds: [hero.idString, about.idString, 'non-existent'],
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });
});
