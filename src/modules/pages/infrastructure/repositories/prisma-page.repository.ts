import { prisma } from '@/lib/prisma/client';
import { Prisma } from '@prisma/client';
import { PageRepository } from '../../application/ports/page.repository.interface';
import { CreatorPage } from '../../domain/entities/creator-page.entity';
import { PageSection, SectionContent } from '../../domain/entities/page-section.entity';
import { PageStatusValue } from '../../domain/value-objects/page-status.vo';
import { SectionTypeValue } from '../../domain/value-objects/section-type.vo';

type PrismaPageWithSections = Prisma.CreatorPageGetPayload<{
  include: { sections: true };
}>;

type PrismaSectionData = Prisma.PageSectionGetPayload<object>;

export class PrismaPageRepository implements PageRepository {
  async findById(id: string): Promise<CreatorPage | null> {
    const prismaPage = await prisma.creatorPage.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!prismaPage) {
      return null;
    }

    return this.toDomain(prismaPage);
  }

  async findBySlug(slug: string): Promise<CreatorPage | null> {
    const prismaPage = await prisma.creatorPage.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { position: 'asc' },
        },
      },
    });

    /* c8 ignore start */
    if (!prismaPage) {
      return null;
    }
    /* c8 ignore stop */

    return this.toDomain(prismaPage);
  }

  async findByCreatorId(creatorId: string): Promise<CreatorPage[]> {
    const prismaPages = await prisma.creatorPage.findMany({
      where: { creatorId },
      include: {
        sections: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return prismaPages.map((page) => this.toDomain(page));
  }

  async findPublishedBySlug(slug: string): Promise<CreatorPage | null> {
    const prismaPage = await prisma.creatorPage.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        sections: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!prismaPage) {
      return null;
    }

    return this.toDomain(prismaPage);
  }

  async save(page: CreatorPage): Promise<void> {
    const data = {
      creatorId: page.creatorId,
      slug: page.slug,
      title: page.title,
      description: page.description,
      bannerImage: page.bannerImage ?? null,
      bannerPosition: page.bannerPosition ?? null,
      tagline: page.tagline ?? null,
      titleFont: page.titleFont ?? null,
      titleColor: page.titleColor ?? null,
      /* c8 ignore start */
      socialLinks: page.socialLinks ? (page.socialLinks as Prisma.InputJsonValue) : Prisma.JsonNull,
      /* c8 ignore stop */
      templateId: page.templateId,
      status: page.status.value,
      publishedAt: page.publishedAt,
      updatedAt: page.updatedAt,
    };

    await prisma.creatorPage.upsert({
      where: { id: page.idString },
      create: {
        id: page.idString,
        ...data,
        createdAt: page.createdAt,
      },
      update: data,
    });

    // Sync sections
    const existingSectionIds = page.sections.map((s) => s.idString);

    // Delete removed sections
    await prisma.pageSection.deleteMany({
      where: {
        pageId: page.idString,
        id: { notIn: existingSectionIds },
      },
    });

    // Upsert sections
    for (const section of page.sections) {
      await prisma.pageSection.upsert({
        where: { id: section.idString },
        create: {
          id: section.idString,
          pageId: page.idString,
          type: section.type.value,
          title: section.title,
          content: section.content as object,
          position: section.position,
          isVisible: section.isVisible,
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
        },
        update: {
          type: section.type.value,
          title: section.title,
          content: section.content as object,
          position: section.position,
          isVisible: section.isVisible,
          updatedAt: section.updatedAt,
        },
      });
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.creatorPage.delete({
      where: { id },
    });
  }

  async slugExists(slug: string, excludePageId?: string): Promise<boolean> {
    const page = await prisma.creatorPage.findFirst({
      where: {
        slug,
        ...(excludePageId && { id: { not: excludePageId } }),
      },
      select: { id: true },
    });

    return page !== null;
  }

  async findSectionById(id: string): Promise<PageSection | null> {
    const prismaSection = await prisma.pageSection.findUnique({
      where: { id },
    });

    if (!prismaSection) {
      return null;
    }

    return this.sectionToDomain(prismaSection);
  }

  async saveSection(section: PageSection): Promise<void> {
    await prisma.pageSection.upsert({
      where: { id: section.idString },
      create: {
        id: section.idString,
        pageId: section.pageId,
        type: section.type.value,
        title: section.title,
        content: section.content as object,
        position: section.position,
        isVisible: section.isVisible,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      },
      update: {
        type: section.type.value,
        title: section.title,
        content: section.content as object,
        position: section.position,
        isVisible: section.isVisible,
        updatedAt: section.updatedAt,
      },
    });
  }

  async deleteSection(id: string): Promise<void> {
    await prisma.pageSection.delete({
      where: { id },
    });
  }

  async countByCreatorId(creatorId: string, status?: PageStatusValue): Promise<number> {
    return prisma.creatorPage.count({
      where: {
        creatorId,
        ...(status && { status }),
      },
    });
  }

  private toDomain(prismaPage: PrismaPageWithSections): CreatorPage {
    const result = CreatorPage.reconstitute({
      id: prismaPage.id,
      creatorId: prismaPage.creatorId,
      slug: prismaPage.slug,
      title: prismaPage.title,
      description: prismaPage.description ?? undefined,
      bannerImage: prismaPage.bannerImage ?? undefined,
      bannerPosition: prismaPage.bannerPosition ?? undefined,
      tagline: prismaPage.tagline ?? undefined,
      titleFont: prismaPage.titleFont ?? undefined,
      titleColor: prismaPage.titleColor ?? undefined,
      /* c8 ignore start */
      socialLinks: prismaPage.socialLinks
        ? (prismaPage.socialLinks as Record<string, string>)
        : undefined,
      /* c8 ignore stop */
      templateId: prismaPage.templateId ?? undefined,
      status: prismaPage.status as PageStatusValue,
      sections: prismaPage.sections.map((section) => ({
        id: section.id,
        pageId: section.pageId,
        type: section.type as SectionTypeValue,
        title: section.title,
        content: section.content as SectionContent,
        position: section.position,
        isVisible: section.isVisible,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      })),
      publishedAt: prismaPage.publishedAt ?? undefined,
      createdAt: prismaPage.createdAt,
      updatedAt: prismaPage.updatedAt,
    });

    if (result.isFailure) {
      throw new Error(`Failed to reconstitute CreatorPage: ${result.error}`);
    }

    return result.value;
  }

  private sectionToDomain(prismaSection: PrismaSectionData): PageSection {
    const result = PageSection.reconstitute({
      id: prismaSection.id,
      pageId: prismaSection.pageId,
      type: prismaSection.type as SectionTypeValue,
      title: prismaSection.title,
      content: prismaSection.content as SectionContent,
      position: prismaSection.position,
      isVisible: prismaSection.isVisible,
      createdAt: prismaSection.createdAt,
      updatedAt: prismaSection.updatedAt,
    });

    if (result.isFailure) {
      throw new Error(`Failed to reconstitute PageSection: ${result.error}`);
    }

    return result.value;
  }
}
