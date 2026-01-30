# Story 4.1: Création et Gestion des Projets

Status: ready-for-dev

## Story

As a Créateur,
I want créer des projets pour organiser mes produits,
so that je puisse présenter mes collections de manière structurée.

## Acceptance Criteria

1. **AC1 - Bouton création de projet**
   - **Given** un Créateur sur la page produits
   - **When** il clique sur "Nouveau projet"
   - **Then** un formulaire s'affiche avec : nom, description, image de couverture

2. **AC2 - Création de projet validée**
   - **Given** un Créateur qui remplit le formulaire projet
   - **When** il valide
   - **Then** le projet est créé et visible dans la liste
   - **And** il peut y ajouter des produits

3. **AC3 - Modification de projet**
   - **Given** un Créateur qui modifie un projet existant
   - **When** il effectue les modifications
   - **Then** les modifications sont enregistrées
   - **And** un message de confirmation s'affiche

4. **AC4 - Suppression de projet**
   - **Given** un Créateur qui supprime un projet
   - **When** il confirme la suppression
   - **Then** le projet est supprimé
   - **And** les produits du projet passent sans projet (projectId = null)

## Tasks / Subtasks

- [ ] **Task 1: Créer le module Products** (AC: #1-4)
  - [ ] 1.1 Créer la structure hexagonale `src/modules/products/`
  - [ ] 1.2 Créer `Project` entity
  - [ ] 1.3 Créer le repository interface et implémentation

- [ ] **Task 2: Créer la page des projets** (AC: #1, #2)
  - [ ] 2.1 Créer `src/app/(dashboard)/projects/page.tsx`
  - [ ] 2.2 Afficher la liste des projets avec images
  - [ ] 2.3 Ajouter le bouton "Nouveau projet"

- [ ] **Task 3: Implémenter le formulaire de projet** (AC: #1, #2, #3)
  - [ ] 3.1 Créer le composant `ProjectForm`
  - [ ] 3.2 Gérer l'upload d'image de couverture (Cloudinary)
  - [ ] 3.3 Valider les champs (nom requis, etc.)

- [ ] **Task 4: Implémenter les use cases** (AC: #2, #3, #4)
  - [ ] 4.1 Créer `CreateProjectUseCase`
  - [ ] 4.2 Créer `UpdateProjectUseCase`
  - [ ] 4.3 Créer `DeleteProjectUseCase`

- [ ] **Task 5: Gérer la suppression et les produits orphelins** (AC: #4)
  - [ ] 5.1 Dissocier les produits du projet avant suppression
  - [ ] 5.2 Confirmer avec l'utilisateur si produits associés

- [ ] **Task 6: Écrire les tests** (AC: #1-4)
  - [ ] 6.1 Tests unitaires pour Project entity
  - [ ] 6.2 Tests unitaires pour les use cases
  - [ ] 6.3 Tests d'intégration

## Dev Notes

### Structure Module Products

```
src/modules/products/
├── domain/
│   ├── entities/
│   │   ├── project.entity.ts
│   │   ├── product.entity.ts
│   │   ├── product-variant.entity.ts
│   │   └── product-image.entity.ts
│   ├── value-objects/
│   │   ├── money.vo.ts
│   │   ├── product-status.vo.ts
│   │   └── variant-type.vo.ts
│   └── errors/
│       └── product.errors.ts
├── application/
│   ├── ports/
│   │   ├── project.repository.interface.ts
│   │   ├── product.repository.interface.ts
│   │   └── image-upload.service.interface.ts
│   ├── use-cases/
│   │   ├── projects/
│   │   │   ├── create-project.use-case.ts
│   │   │   ├── update-project.use-case.ts
│   │   │   ├── delete-project.use-case.ts
│   │   │   └── list-projects.use-case.ts
│   │   └── products/
│   │       └── ...
│   └── dtos/
│       ├── project.dto.ts
│       └── product.dto.ts
└── infrastructure/
    ├── repositories/
    │   ├── prisma-project.repository.ts
    │   └── prisma-product.repository.ts
    └── services/
        └── cloudinary-image.service.ts
```

### Entity Project

```typescript
// src/modules/products/domain/entities/project.entity.ts
import { Entity, UniqueId, Result } from "@/shared/domain";

interface ProjectProps {
  creatorId: string;
  name: string;
  description?: string;
  coverImage?: string;
  productCount: number;
}

export class Project extends Entity<ProjectProps> {
  private constructor(props: ProjectProps, id?: UniqueId) {
    super(props, id);
  }

  get creatorId(): string { return this.props.creatorId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get coverImage(): string | undefined { return this.props.coverImage; }
  get productCount(): number { return this.props.productCount; }

  static create(props: Omit<ProjectProps, "productCount">, id?: UniqueId): Result<Project> {
    if (!props.name.trim()) {
      return Result.fail("Le nom du projet est requis");
    }

    if (props.name.length > 100) {
      return Result.fail("Le nom ne peut pas dépasser 100 caractères");
    }

    return Result.ok(new Project({ ...props, productCount: 0 }, id));
  }

  updateName(name: string): Result<void> {
    if (!name.trim()) {
      return Result.fail("Le nom du projet est requis");
    }
    this.props.name = name;
    return Result.ok();
  }

  updateDescription(description: string): void {
    this.props.description = description;
  }

  updateCoverImage(coverImage: string): void {
    this.props.coverImage = coverImage;
  }
}
```

### Use Case CreateProject

```typescript
// src/modules/products/application/use-cases/projects/create-project.use-case.ts
export class CreateProjectUseCase implements IUseCase<CreateProjectDTO, ProjectDTO> {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly imageService: IImageUploadService
  ) {}

  async execute(dto: CreateProjectDTO): Promise<Result<ProjectDTO>> {
    // Upload image si fournie
    let coverImageUrl: string | undefined;
    if (dto.coverImage) {
      const uploadResult = await this.imageService.upload(dto.coverImage, {
        folder: `projects/${dto.creatorId}`,
        transformation: { width: 800, height: 600, crop: "fill" },
      });

      if (uploadResult.isFailure) {
        return Result.fail(uploadResult.error!);
      }
      coverImageUrl = uploadResult.value;
    }

    // Créer l'entity
    const projectResult = Project.create({
      creatorId: dto.creatorId,
      name: dto.name,
      description: dto.description,
      coverImage: coverImageUrl,
    });

    if (projectResult.isFailure) {
      return Result.fail(projectResult.error!);
    }

    // Persister
    const saved = await this.projectRepo.save(projectResult.value);

    return Result.ok(ProjectMapper.toDTO(saved));
  }
}
```

### Schéma Prisma Project

```prisma
model Project {
  id          String    @id @default(cuid())
  creatorId   String
  creator     Creator   @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  name        String
  description String?
  coverImage  String?

  products    Product[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([creatorId])
  @@map("projects")
}
```

### Références

- [Source: architecture.md#Products Module]
- [Source: prd.md#FR15]
- [Source: epics.md#Story 4.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
