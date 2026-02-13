import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { CreatorPage } from '../../domain/entities/creator-page.entity';
import { PageRepository } from '../ports/page.repository.interface';
import { PageStatusValue } from '../../domain/value-objects/page-status.vo';

export interface CreatePageInput {
  creatorId: string;
  slug: string;
  title: string;
  description?: string;
  templateId?: string;
}

export interface CreatePageOutput {
  id: string;
  creatorId: string;
  slug: string;
  title: string;
  description?: string;
  templateId?: string;
  status: PageStatusValue;
}

/**
 * Use Case: Create Page
 *
 * Creates a new page in DRAFT status for a creator.
 * The slug must be unique across all pages.
 */
export class CreatePageUseCase implements UseCase<CreatePageInput, CreatePageOutput> {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: CreatePageInput): Promise<Result<CreatePageOutput>> {
    // Check if slug already exists
    const slugExists = await this.pageRepository.slugExists(input.slug);
    if (slugExists) {
      return Result.fail('Ce slug est deja utilise');
    }

    // Create the page entity
    const pageResult = CreatorPage.create({
      creatorId: input.creatorId,
      slug: input.slug,
      title: input.title,
      description: input.description,
      templateId: input.templateId,
    });

    if (pageResult.isFailure) {
      return Result.fail(pageResult.error!);
    }

    const page = pageResult.value;

    // Persist the page
    await this.pageRepository.save(page);

    return Result.ok({
      id: page.idString,
      creatorId: page.creatorId,
      slug: page.slug,
      title: page.title,
      description: page.description,
      templateId: page.templateId,
      status: page.status.value,
    });
  }
}
