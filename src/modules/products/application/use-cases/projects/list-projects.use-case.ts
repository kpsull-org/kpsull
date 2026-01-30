import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProjectRepository } from '../../ports/project.repository.interface';

export interface ListProjectsInput {
  creatorId: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProjectsOutput {
  projects: ProjectListItem[];
  total: number;
}

/**
 * Use Case: List Projects
 *
 * Lists all projects for a given creator.
 */
export class ListProjectsUseCase implements UseCase<ListProjectsInput, ListProjectsOutput> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: ListProjectsInput): Promise<Result<ListProjectsOutput>> {
    // Validate input
    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    // Fetch projects
    const projects = await this.projectRepository.findByCreatorId(input.creatorId);

    // Map to DTOs
    const projectList: ProjectListItem[] = projects.map((project) => ({
      id: project.idString,
      name: project.name,
      description: project.description,
      coverImage: project.coverImage,
      productCount: project.productCount,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return Result.ok({
      projects: projectList,
      total: projectList.length,
    });
  }
}
