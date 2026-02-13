import { Prisma, PrismaClient } from '@prisma/client';
import { ProjectRepository } from '../../application/ports/project.repository.interface';
import { Project } from '../../domain/entities/project.entity';

type PrismaProjectWithCount = Prisma.ProjectGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Project | null> {
    const prismaProject = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!prismaProject) {
      return null;
    }

    return this.toDomain(prismaProject);
  }

  async findByCreatorId(creatorId: string): Promise<Project[]> {
    const prismaProjects = await this.prisma.project.findMany({
      where: { creatorId },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return prismaProjects
      .map((p) => this.toDomain(p))
      .filter((p): p is Project => p !== null);
  }

  async save(project: Project): Promise<void> {
    const data = {
      creatorId: project.creatorId,
      name: project.name,
      description: project.description ?? null,
      coverImage: project.coverImage ?? null,
      updatedAt: project.updatedAt,
    };

    await this.prisma.project.upsert({
      where: { id: project.idString },
      create: {
        id: project.idString,
        ...data,
        createdAt: project.createdAt,
      },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  private toDomain(prismaProject: PrismaProjectWithCount): Project | null {
    const result = Project.reconstitute({
      id: prismaProject.id,
      creatorId: prismaProject.creatorId,
      name: prismaProject.name,
      description: prismaProject.description ?? undefined,
      coverImage: prismaProject.coverImage ?? undefined,
      productCount: prismaProject._count.products,
      createdAt: prismaProject.createdAt,
      updatedAt: prismaProject.updatedAt,
    });

    return result.isSuccess ? result.value! : null;
  }
}
