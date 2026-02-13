import { Entity, UniqueId, Result } from '@/shared/domain';
import { SectionType, SectionTypeValue } from '../value-objects/section-type.vo';

export interface SectionContent {
  [key: string]: unknown;
}

interface PageSectionProps {
  pageId: string;
  type: SectionType;
  title: string;
  content: SectionContent;
  position: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePageSectionProps {
  pageId: string;
  type: SectionType;
  title: string;
  content?: SectionContent;
  position: number;
  isVisible?: boolean;
}

interface ReconstitutePageSectionProps {
  id: string;
  pageId: string;
  type: SectionTypeValue;
  title: string;
  content: SectionContent;
  position: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PageSection Entity
 *
 * Represents a section within a creator page.
 */
export class PageSection extends Entity<PageSectionProps> {
  private constructor(props: PageSectionProps, id?: UniqueId) {
    super(props, id);
  }

  // Get ID as string
  get idString(): string {
    return this._id.toString();
  }

  // Getters
  get pageId(): string {
    return this.props.pageId;
  }

  get type(): SectionType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): SectionContent {
    return this.props.content;
  }

  get position(): number {
    return this.props.position;
  }

  get isVisible(): boolean {
    return this.props.isVisible;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Methods
  updateContent(content: SectionContent): Result<void> {
    this.props.content = content;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  updateTitle(title: string): Result<void> {
    if (!title.trim()) {
      return Result.fail('Le titre de la section est requis');
    }

    if (title.length > 200) {
      return Result.fail('Le titre ne peut pas depasser 200 caracteres');
    }

    this.props.title = title.trim();
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  updatePosition(position: number): Result<void> {
    if (position < 0) {
      return Result.fail('La position doit etre positive');
    }

    this.props.position = position;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  hide(): void {
    this.props.isVisible = false;
    this.props.updatedAt = new Date();
  }

  show(): void {
    this.props.isVisible = true;
    this.props.updatedAt = new Date();
  }

  // Factory methods
  static create(props: CreatePageSectionProps): Result<PageSection> {
    if (!props.pageId?.trim()) {
      return Result.fail('Page ID est requis');
    }

    if (!props.title?.trim()) {
      return Result.fail('Le titre de la section est requis');
    }

    if (props.title.length > 200) {
      return Result.fail('Le titre ne peut pas depasser 200 caracteres');
    }

    if (props.position < 0) {
      return Result.fail('La position doit etre positive');
    }

    const now = new Date();

    return Result.ok(
      new PageSection({
        pageId: props.pageId.trim(),
        type: props.type,
        title: props.title.trim(),
        content: props.content ?? {},
        position: props.position,
        isVisible: props.isVisible ?? true,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  static reconstitute(props: ReconstitutePageSectionProps): Result<PageSection> {
    const typeResult = SectionType.fromString(props.type);
    if (typeResult.isFailure) {
      return Result.fail(typeResult.error!);
    }

    return Result.ok(
      new PageSection(
        {
          pageId: props.pageId,
          type: typeResult.value,
          title: props.title,
          content: props.content,
          position: props.position,
          isVisible: props.isVisible,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
