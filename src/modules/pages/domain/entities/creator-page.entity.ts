import { Entity, UniqueId, Result } from '@/shared/domain';
import { PageStatus, PageStatusValue } from '../value-objects/page-status.vo';
import { SectionType, SectionTypeValue } from '../value-objects/section-type.vo';
import { PageSection, SectionContent } from './page-section.entity';

interface CreatorPageProps {
  creatorId: string;
  slug: string;
  title: string;
  description?: string;
  templateId?: string;
  status: PageStatus;
  sections: PageSection[];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCreatorPageProps {
  creatorId: string;
  slug: string;
  title: string;
  description?: string;
  templateId?: string;
}

interface ReconstituteCreatorPageProps {
  id: string;
  creatorId: string;
  slug: string;
  title: string;
  description?: string;
  templateId?: string;
  status: PageStatusValue;
  sections: Array<{
    id: string;
    pageId: string;
    type: SectionTypeValue;
    title: string;
    content: SectionContent;
    position: number;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateSettingsProps {
  title?: string;
  description?: string;
  slug?: string;
}

interface AddSectionProps {
  type: SectionType;
  title: string;
  content?: SectionContent;
  position?: number;
}

/**
 * CreatorPage Entity
 *
 * Represents a creator's public page with sections.
 */
export class CreatorPage extends Entity<CreatorPageProps> {
  private constructor(props: CreatorPageProps, id?: UniqueId) {
    super(props, id);
  }

  // Get ID as string
  get idString(): string {
    return this._id.toString();
  }

  // Getters
  get creatorId(): string {
    return this.props.creatorId;
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get templateId(): string | undefined {
    return this.props.templateId;
  }

  get status(): PageStatus {
    return this.props.status;
  }

  get sections(): PageSection[] {
    return [...this.props.sections].sort((a, b) => a.position - b.position);
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get isDraft(): boolean {
    return this.props.status.isDraft;
  }

  get isPublished(): boolean {
    return this.props.status.isPublished;
  }

  get visibleSections(): PageSection[] {
    return this.sections.filter((s) => s.isVisible);
  }

  // Methods
  publish(): Result<void> {
    if (this.isPublished) {
      return Result.fail('La page est deja publiee');
    }

    this.props.status = PageStatus.published();
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  unpublish(): Result<void> {
    if (this.isDraft) {
      return Result.fail('La page est deja en brouillon');
    }

    this.props.status = PageStatus.draft();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  updateSettings(settings: UpdateSettingsProps): Result<void> {
    if (settings.title !== undefined) {
      if (!settings.title.trim()) {
        return Result.fail('Le titre de la page est requis');
      }
      if (settings.title.length > 200) {
        return Result.fail('Le titre ne peut pas depasser 200 caracteres');
      }
      this.props.title = settings.title.trim();
    }

    if (settings.description !== undefined) {
      if (settings.description.length > 500) {
        return Result.fail('La description ne peut pas depasser 500 caracteres');
      }
      this.props.description = settings.description.trim() || undefined;
    }

    if (settings.slug !== undefined) {
      const slugValidation = this.validateSlug(settings.slug);
      if (slugValidation.isFailure) {
        return slugValidation;
      }
      this.props.slug = settings.slug.toLowerCase().trim();
    }

    this.props.updatedAt = new Date();
    return Result.ok();
  }

  addSection(props: AddSectionProps): Result<PageSection> {
    const position = props.position ?? this.props.sections.length;

    const sectionResult = PageSection.create({
      pageId: this.idString,
      type: props.type,
      title: props.title,
      content: props.content,
      position,
    });

    if (sectionResult.isFailure) {
      return Result.fail(sectionResult.error!);
    }

    const section = sectionResult.value!;

    // Shift positions of sections that come after
    for (const existingSection of this.props.sections) {
      if (existingSection.position >= position) {
        existingSection.updatePosition(existingSection.position + 1);
      }
    }

    this.props.sections.push(section);
    this.props.updatedAt = new Date();

    return Result.ok(section);
  }

  removeSection(sectionId: string): Result<void> {
    const sectionIndex = this.props.sections.findIndex((s) => s.idString === sectionId);

    if (sectionIndex === -1) {
      return Result.fail('Section non trouvee');
    }

    const sectionToRemove = this.props.sections[sectionIndex];
    const removedPosition = sectionToRemove!.position;
    this.props.sections.splice(sectionIndex, 1);

    // Shift positions of sections that came after
    for (const section of this.props.sections) {
      if (section.position > removedPosition) {
        section.updatePosition(section.position - 1);
      }
    }

    this.props.updatedAt = new Date();
    return Result.ok();
  }

  reorderSections(sectionIds: string[]): Result<void> {
    if (sectionIds.length !== this.props.sections.length) {
      return Result.fail('Le nombre de sections ne correspond pas');
    }

    const sectionMap = new Map(this.props.sections.map((s) => [s.idString, s]));

    for (const id of sectionIds) {
      if (!sectionMap.has(id)) {
        return Result.fail(`Section ${id} non trouvee`);
      }
    }

    // Update positions
    sectionIds.forEach((id, index) => {
      const section = sectionMap.get(id)!;
      section.updatePosition(index);
    });

    this.props.updatedAt = new Date();
    return Result.ok();
  }

  getSection(sectionId: string): PageSection | undefined {
    return this.props.sections.find((s) => s.idString === sectionId);
  }

  private validateSlug(slug: string): Result<void> {
    if (!slug.trim()) {
      return Result.fail('Le slug est requis');
    }

    if (slug.length < 3) {
      return Result.fail('Le slug doit contenir au moins 3 caracteres');
    }

    if (slug.length > 50) {
      return Result.fail('Le slug ne peut pas depasser 50 caracteres');
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      return Result.fail('Le slug ne peut contenir que des lettres, chiffres et tirets');
    }

    return Result.ok();
  }

  // Factory methods
  static create(props: CreateCreatorPageProps): Result<CreatorPage> {
    if (!props.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!props.title?.trim()) {
      return Result.fail('Le titre de la page est requis');
    }

    if (props.title.length > 200) {
      return Result.fail('Le titre ne peut pas depasser 200 caracteres');
    }

    // Validate slug
    if (!props.slug?.trim()) {
      return Result.fail('Le slug est requis');
    }

    if (props.slug.length < 3) {
      return Result.fail('Le slug doit contenir au moins 3 caracteres');
    }

    if (props.slug.length > 50) {
      return Result.fail('Le slug ne peut pas depasser 50 caracteres');
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(props.slug.toLowerCase())) {
      return Result.fail('Le slug ne peut contenir que des lettres, chiffres et tirets');
    }

    if (props.description && props.description.length > 500) {
      return Result.fail('La description ne peut pas depasser 500 caracteres');
    }

    const now = new Date();

    return Result.ok(
      new CreatorPage({
        creatorId: props.creatorId.trim(),
        slug: props.slug.toLowerCase().trim(),
        title: props.title.trim(),
        description: props.description?.trim(),
        templateId: props.templateId,
        status: PageStatus.draft(),
        sections: [],
        publishedAt: undefined,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(props: ReconstituteCreatorPageProps): Result<CreatorPage> {
    const statusResult = PageStatus.fromString(props.status);
    if (statusResult.isFailure) {
      return Result.fail(statusResult.error!);
    }

    const sections: PageSection[] = [];
    for (const sectionData of props.sections) {
      const sectionResult = PageSection.reconstitute(sectionData);
      if (sectionResult.isFailure) {
        return Result.fail(sectionResult.error!);
      }
      sections.push(sectionResult.value!);
    }

    return Result.ok(
      new CreatorPage(
        {
          creatorId: props.creatorId,
          slug: props.slug,
          title: props.title,
          description: props.description,
          templateId: props.templateId,
          status: statusResult.value!,
          sections,
          publishedAt: props.publishedAt,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
