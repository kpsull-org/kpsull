import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { PageRepository } from '../ports/page.repository.interface';
import { SectionTypeValue } from '../../domain/value-objects/section-type.vo';
import { SectionContent } from '../../domain/entities/page-section.entity';

export interface GetPublicPageInput {
  slug: string;
}

export interface PublicSectionOutput {
  id: string;
  type: SectionTypeValue;
  title: string;
  content: SectionContent;
  position: number;
}

export interface GetPublicPageOutput {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sections: PublicSectionOutput[];
  publishedAt?: Date;
}

/**
 * Use Case: Get Public Page
 *
 * Retrieves a published page by its slug for public display.
 * Only returns published pages and visible sections.
 * Does not expose sensitive data like creatorId.
 */
export class GetPublicPageUseCase implements UseCase<GetPublicPageInput, GetPublicPageOutput> {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: GetPublicPageInput): Promise<Result<GetPublicPageOutput>> {
    // Validate input
    if (!input.slug?.trim()) {
      return Result.fail('Slug est requis');
    }

    const slug = input.slug.trim().toLowerCase();

    // Find published page by slug
    const page = await this.pageRepository.findPublishedBySlug(slug);

    if (!page) {
      return Result.fail('Page non trouvee');
    }

    // Get only visible sections, sorted by position
    const visibleSections = page.visibleSections;

    // Map sections to public DTOs
    const sectionDtos: PublicSectionOutput[] = visibleSections.map((section) => ({
      id: section.idString,
      type: section.type.value,
      title: section.title,
      content: section.content,
      position: section.position,
    }));

    // Build public page response (without creatorId)
    const output: GetPublicPageOutput = {
      id: page.idString,
      slug: page.slug,
      title: page.title,
      description: page.description,
      sections: sectionDtos,
      publishedAt: page.publishedAt,
    };

    return Result.ok(output);
  }
}
