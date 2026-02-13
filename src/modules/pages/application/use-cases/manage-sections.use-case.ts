import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { PageRepository } from '../ports/page.repository.interface';
import { SectionType, SectionTypeValue } from '../../domain/value-objects/section-type.vo';
import { SectionContent } from '../../domain/entities/page-section.entity';

// Add Section
export interface AddSectionInput {
  pageId: string;
  creatorId: string;
  type: SectionTypeValue;
  title: string;
  content?: SectionContent;
  position?: number;
}

export interface AddSectionOutput {
  id: string;
  pageId: string;
  type: SectionTypeValue;
  title: string;
  content: SectionContent;
  position: number;
  isVisible: boolean;
}

export class AddSectionUseCase implements UseCase<AddSectionInput, AddSectionOutput> {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: AddSectionInput): Promise<Result<AddSectionOutput>> {
    // Find the page
    const page = await this.pageRepository.findById(input.pageId);
    if (!page) {
      return Result.fail('Page non trouvee');
    }

    // Check ownership
    if (page.creatorId !== input.creatorId) {
      return Result.fail('Acces non autorise');
    }

    // Create section type
    const typeResult = SectionType.fromString(input.type);
    if (typeResult.isFailure) {
      return Result.fail(typeResult.error!);
    }

    // Add section to page
    const sectionResult = page.addSection({
      type: typeResult.value,
      title: input.title,
      content: input.content,
      position: input.position,
    });

    if (sectionResult.isFailure) {
      return Result.fail(sectionResult.error!);
    }

    const section = sectionResult.value;

    // Persist changes
    await this.pageRepository.save(page);

    return Result.ok({
      id: section.idString,
      pageId: section.pageId,
      type: section.type.value,
      title: section.title,
      content: section.content,
      position: section.position,
      isVisible: section.isVisible,
    });
  }
}

// Update Section
export interface UpdateSectionInput {
  sectionId: string;
  pageId: string;
  creatorId: string;
  title?: string;
  content?: SectionContent;
  isVisible?: boolean;
}

export interface UpdateSectionOutput {
  id: string;
  pageId: string;
  type: SectionTypeValue;
  title: string;
  content: SectionContent;
  position: number;
  isVisible: boolean;
}

export class UpdateSectionUseCase implements UseCase<UpdateSectionInput, UpdateSectionOutput> {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: UpdateSectionInput): Promise<Result<UpdateSectionOutput>> {
    // Find the page
    const page = await this.pageRepository.findById(input.pageId);
    if (!page) {
      return Result.fail('Page non trouvee');
    }

    // Check ownership
    if (page.creatorId !== input.creatorId) {
      return Result.fail('Acces non autorise');
    }

    // Find the section
    const section = page.getSection(input.sectionId);
    if (!section) {
      return Result.fail('Section non trouvee');
    }

    // Update title if provided
    if (input.title !== undefined) {
      const titleResult = section.updateTitle(input.title);
      if (titleResult.isFailure) {
        return Result.fail(titleResult.error!);
      }
    }

    // Update content if provided
    if (input.content !== undefined) {
      section.updateContent(input.content);
    }

    // Update visibility if provided
    if (input.isVisible !== undefined) {
      if (input.isVisible) {
        section.show();
      } else {
        section.hide();
      }
    }

    // Persist changes
    await this.pageRepository.save(page);

    return Result.ok({
      id: section.idString,
      pageId: section.pageId,
      type: section.type.value,
      title: section.title,
      content: section.content,
      position: section.position,
      isVisible: section.isVisible,
    });
  }
}

// Remove Section
export interface RemoveSectionInput {
  sectionId: string;
  pageId: string;
  creatorId: string;
}

export class RemoveSectionUseCase implements UseCase<RemoveSectionInput, void> {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: RemoveSectionInput): Promise<Result<void>> {
    // Find the page
    const page = await this.pageRepository.findById(input.pageId);
    if (!page) {
      return Result.fail('Page non trouvee');
    }

    // Check ownership
    if (page.creatorId !== input.creatorId) {
      return Result.fail('Acces non autorise');
    }

    // Remove section
    const removeResult = page.removeSection(input.sectionId);
    if (removeResult.isFailure) {
      return Result.fail(removeResult.error!);
    }

    // Persist changes
    await this.pageRepository.save(page);

    return Result.ok();
  }
}

// Reorder Sections
export interface ReorderSectionsInput {
  pageId: string;
  creatorId: string;
  sectionIds: string[];
}

export interface ReorderSectionsOutput {
  pageId: string;
  sectionIds: string[];
}

export class ReorderSectionsUseCase implements UseCase<ReorderSectionsInput, ReorderSectionsOutput> {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: ReorderSectionsInput): Promise<Result<ReorderSectionsOutput>> {
    // Find the page
    const page = await this.pageRepository.findById(input.pageId);
    if (!page) {
      return Result.fail('Page non trouvee');
    }

    // Check ownership
    if (page.creatorId !== input.creatorId) {
      return Result.fail('Acces non autorise');
    }

    // Reorder sections
    const reorderResult = page.reorderSections(input.sectionIds);
    if (reorderResult.isFailure) {
      return Result.fail(reorderResult.error!);
    }

    // Persist changes
    await this.pageRepository.save(page);

    return Result.ok({
      pageId: page.idString,
      sectionIds: page.sections.map((s) => s.idString),
    });
  }
}
