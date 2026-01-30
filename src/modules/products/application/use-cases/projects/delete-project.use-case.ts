import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { ProjectRepository } from '../../ports/project.repository.interface';

export interface DeleteProjectInput {
  projectId: string;
  creatorId: string;
}

export interface DeleteProjectOutput {
  deleted: boolean;
  orphanedProducts: number;
}

/**
 * Use Case: Delete Project
 *
 * Deletes a project. Products in the project will have their projectId set to null.
 */
export class DeleteProjectUseCase implements UseCase<DeleteProjectInput, DeleteProjectOutput> {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: DeleteProjectInput): Promise<Result<DeleteProjectOutput>> {
    // Validate input
    if (!input.projectId?.trim()) {
      return Result.fail('Project ID est requis');
    }

    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    // Find the project
    const project = await this.projectRepository.findById(input.projectId);

    if (!project) {
      return Result.fail('Projet non trouvé');
    }

    // Verify ownership
    if (project.creatorId !== input.creatorId) {
      return Result.fail('Non autorisé à supprimer ce projet');
    }

    const orphanedProducts = project.productCount;

    // Delete the project
    await this.projectRepository.delete(input.projectId);

    return Result.ok({
      deleted: true,
      orphanedProducts,
    });
  }
}
