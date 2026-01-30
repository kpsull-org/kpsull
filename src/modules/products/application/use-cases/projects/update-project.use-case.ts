import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProjectRepository } from '../../ports/project.repository.interface';

export interface UpdateProjectInput {
  projectId: string;
  creatorId: string;
  name?: string;
  description?: string;
  coverImage?: string;
}

export interface UpdateProjectOutput {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  coverImage?: string;
  productCount: number;
}

/**
 * Use Case: Update Project
 *
 * Updates an existing project's name, description, or cover image.
 */
export class UpdateProjectUseCase implements UseCase<UpdateProjectInput, UpdateProjectOutput> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: UpdateProjectInput): Promise<Result<UpdateProjectOutput>> {
    // Find the project
    const project = await this.projectRepository.findById(input.projectId);

    if (!project) {
      return Result.fail('Projet non trouvé');
    }

    // Verify ownership
    if (project.creatorId !== input.creatorId) {
      return Result.fail('Non autorisé à modifier ce projet');
    }

    // Update fields
    if (input.name !== undefined) {
      const updateResult = project.updateName(input.name);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.error!);
      }
    }

    if (input.description !== undefined) {
      project.updateDescription(input.description);
    }

    if (input.coverImage !== undefined) {
      project.updateCoverImage(input.coverImage);
    }

    // Persist changes
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
