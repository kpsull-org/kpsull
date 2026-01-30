import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { PageRepository } from '../ports/page.repository.interface';
import { PageStatusValue } from '../../domain/value-objects/page-status.vo';

export interface PublishPageInput {
  pageId: string;
  creatorId: string;
}

export interface PublishPageOutput {
  id: string;
  creatorId: string;
  slug: string;
  title: string;
  status: PageStatusValue;
  publishedAt: Date;
}

/**
 * Use Case: Publish Page
 *
 * Publishes a draft page, making it publicly accessible.
 * Only the page owner can publish.
 */
export class PublishPageUseCase implements UseCase<PublishPageInput, PublishPageOutput> {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: PublishPageInput): Promise<Result<PublishPageOutput>> {
    // Find the page
    const page = await this.pageRepository.findById(input.pageId);
    if (!page) {
      return Result.fail('Page non trouvee');
    }

    // Check ownership
    if (page.creatorId !== input.creatorId) {
      return Result.fail('Acces non autorise');
    }

    // Publish the page
    const publishResult = page.publish();
    if (publishResult.isFailure) {
      return Result.fail(publishResult.error!);
    }

    // Persist changes
    await this.pageRepository.save(page);

    return Result.ok({
      id: page.idString,
      creatorId: page.creatorId,
      slug: page.slug,
      title: page.title,
      status: page.status.value,
      publishedAt: page.publishedAt!,
    });
  }
}

export interface UnpublishPageInput {
  pageId: string;
  creatorId: string;
}

export interface UnpublishPageOutput {
  id: string;
  creatorId: string;
  slug: string;
  title: string;
  status: PageStatusValue;
}

/**
 * Use Case: Unpublish Page
 *
 * Unpublishes a published page, making it a draft.
 * Only the page owner can unpublish.
 */
export class UnpublishPageUseCase implements UseCase<UnpublishPageInput, UnpublishPageOutput> {
  constructor(private readonly pageRepository: PageRepository) {}

  async execute(input: UnpublishPageInput): Promise<Result<UnpublishPageOutput>> {
    // Find the page
    const page = await this.pageRepository.findById(input.pageId);
    if (!page) {
      return Result.fail('Page non trouvee');
    }

    // Check ownership
    if (page.creatorId !== input.creatorId) {
      return Result.fail('Acces non autorise');
    }

    // Unpublish the page
    const unpublishResult = page.unpublish();
    if (unpublishResult.isFailure) {
      return Result.fail(unpublishResult.error!);
    }

    // Persist changes
    await this.pageRepository.save(page);

    return Result.ok({
      id: page.idString,
      creatorId: page.creatorId,
      slug: page.slug,
      title: page.title,
      status: page.status.value,
    });
  }
}
