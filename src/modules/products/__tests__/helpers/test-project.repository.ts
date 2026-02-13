import type { ProjectRepository } from '../../application/ports/project.repository.interface';
import type { Project } from '../../domain/entities/project.entity';

export class TestProjectRepository implements ProjectRepository {
  public savedProject: Project | null = null;
  public deletedId: string | null = null;
  private projects: Map<string, Project> = new Map();
  private projectsByCreator: Map<string, Project[]> = new Map();

  set(project: Project): void {
    this.projects.set(project.idString, project);
  }

  setForCreator(creatorId: string, projects: Project[]): void {
    this.projectsByCreator.set(creatorId, projects);
    for (const p of projects) {
      this.projects.set(p.idString, p);
    }
  }

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) ?? null;
  }

  async findByCreatorId(creatorId: string): Promise<Project[]> {
    return this.projectsByCreator.get(creatorId) ?? [];
  }

  async save(project: Project): Promise<void> {
    this.savedProject = project;
    this.projects.set(project.idString, project);
  }

  async delete(id: string): Promise<void> {
    this.deletedId = id;
    this.projects.delete(id);
  }
}
