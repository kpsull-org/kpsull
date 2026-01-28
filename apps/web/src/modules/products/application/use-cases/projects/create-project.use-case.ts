import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { Project } from '../../../domain/entities/project.entity';
import { ProjectRepository } from '../../ports/project.repository.interface';

export interface CreateProjectInput {
  creatorId: string;
  name: string;
  description?: string;
  coverImage?: string;
}

export interface CreateProjectOutput {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  coverImage?: string;
  productCount: number;
}

/**
 * Use Case: Create Project
 *
 * Creates a new project for organizing products.
 */
export class CreateProjectUseCase implements UseCase<CreateProjectInput, CreateProjectOutput> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Result<CreateProjectOutput>> {
    // Create the project entity
    const projectResult = Project.create({
      creatorId: input.creatorId,
      name: input.name,
      description: input.description,
      coverImage: input.coverImage,
    });

    if (projectResult.isFailure) {
      return Result.fail(projectResult.error!);
    }

    const project = projectResult.value!;

    // Persist the project
    await this.projectRepository.save(project);

    return Result.ok({
      id: project.idString,
      creatorId: project.creatorId,
      name: project.name,
      description: project.description,
      coverImage: project.coverImage,
      productCount: project.productCount,
    });
  }
}
