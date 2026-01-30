import { CreatorPage } from '../../domain/entities/creator-page.entity';
import { PageSection } from '../../domain/entities/page-section.entity';
import { PageStatusValue } from '../../domain/value-objects/page-status.vo';

export interface PageRepository {
  findById(id: string): Promise<CreatorPage | null>;
  findBySlug(slug: string): Promise<CreatorPage | null>;
  findByCreatorId(creatorId: string): Promise<CreatorPage[]>;
  save(page: CreatorPage): Promise<void>;
  delete(id: string): Promise<void>;
  slugExists(slug: string, excludePageId?: string): Promise<boolean>;

  // Section methods
  findSectionById(id: string): Promise<PageSection | null>;
  saveSection(section: PageSection): Promise<void>;
  deleteSection(id: string): Promise<void>;

  // Query methods
  findPublishedBySlug(slug: string): Promise<CreatorPage | null>;
  countByCreatorId(creatorId: string, status?: PageStatusValue): Promise<number>;
}
