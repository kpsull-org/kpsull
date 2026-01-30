import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { PageRepository } from '../ports/page.repository.interface';
import { PageStatusValue } from '../../domain/value-objects/page-status.vo';

export interface UpdatePageSettingsInput {
  pageId: string;
  creatorId: string;
  title?: string;
  description?: string;
  slug?: string;
}

export interface UpdatePageSettingsOutput {
  id: string;
  creatorId: string;
  slug: string;
  title: string;
  description?: string;
  status: PageStatusValue;
}

/**
 * Use Case: Update Page Settings
 *
 * Updates page title, description, or slug.
 * Only the page owner can update settings.
 */
export class UpdatePageSettingsUseCase
  implements UseCase<UpdatePageSettingsInput, UpdatePageSettingsOutput>
{
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: UpdatePageSettingsInput): Promise<Result<UpdatePageSettingsOutput>> {
    // Find the page
    const page = await this.pageRepository.findById(input.pageId);
    if (!page) {
      return Result.fail('Page non trouvee');
    }

    // Check ownership
    if (page.creatorId !== input.creatorId) {
      return Result.fail('Acces non autorise');
    }

    // Check if new slug is available (if changing slug)
    if (input.slug && input.slug.toLowerCase() !== page.slug) {
      const slugExists = await this.pageRepository.slugExists(input.slug, page.idString);
      if (slugExists) {
        return Result.fail('Ce slug est deja utilise');
      }
    }

    // Update settings
    const updateResult = page.updateSettings({
      title: input.title,
      description: input.description,
      slug: input.slug,
    });

    if (updateResult.isFailure) {
      return Result.fail(updateResult.error!);
    }

    // Persist changes
    await this.pageRepository.save(page);

    return Result.ok({
      id: page.idString,
      creatorId: page.creatorId,
      slug: page.slug,
      title: page.title,
      description: page.description,
      status: page.status.value,
    });
  }
}
