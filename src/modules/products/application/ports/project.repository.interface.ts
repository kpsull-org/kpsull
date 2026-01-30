import { Project } from '../../domain/entities/project.entity';

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByCreatorId(creatorId: string): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
