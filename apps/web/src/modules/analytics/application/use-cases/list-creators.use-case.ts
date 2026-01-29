import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import type {
  CreatorRepository,
  CreatorSummary,
  CreatorSortField,
  CreatorStatus,
  SortDirection,
} from '../ports';

export interface ListCreatorsInput {
  /** Search query for name or email */
  search?: string;
  /** Filter by status */
  statusFilter?: CreatorStatus | 'ALL';
  /** Field to sort by */
  sortBy?: CreatorSortField;
  /** Sort direction */
  sortDirection?: SortDirection;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

export interface ListCreatorsOutput {
  /** List of creators */
  creators: CreatorSummary[];
  /** Total number of creators matching the query */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * ListCreatorsUseCase
 *
 * Story 11-2: Liste gestion createurs
 *
 * Lists creators for admin management with filtering and pagination.
 * Supports searching by name/email, filtering by status, and sorting.
 *
 * Acceptance Criteria:
 * - AC1: Table des createurs avec infos (nom, email, date inscription, statut, CA)
 * - AC2: Filtres par statut (actif, suspendu)
 * - AC3: Recherche par nom/email
 * - AC4: Pagination
 */
export class ListCreatorsUseCase
  implements UseCase<ListCreatorsInput, ListCreatorsOutput>
{
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_PAGE_SIZE = 10;
  private static readonly MAX_PAGE_SIZE = 100;

  constructor(private readonly creatorRepository: CreatorRepository) {}

  async execute(
    input: ListCreatorsInput
  ): Promise<Result<ListCreatorsOutput>> {
    // Validate and normalize pagination
    const page = Math.max(
      ListCreatorsUseCase.DEFAULT_PAGE,
      input.page ?? ListCreatorsUseCase.DEFAULT_PAGE
    );
    const pageSize = Math.min(
      ListCreatorsUseCase.MAX_PAGE_SIZE,
      Math.max(1, input.pageSize ?? ListCreatorsUseCase.DEFAULT_PAGE_SIZE)
    );

    // Normalize sort parameters
    const sortBy: CreatorSortField = input.sortBy ?? 'registeredAt';
    const sortDirection: SortDirection = input.sortDirection ?? 'desc';

    // Normalize search query
    const search = input.search?.trim() || undefined;

    // Normalize status filter
    const statusFilter: CreatorStatus | 'ALL' = input.statusFilter ?? 'ALL';

    try {
      const result = await this.creatorRepository.listCreators({
        search,
        statusFilter,
        sortBy,
        sortDirection,
        page,
        pageSize,
      });

      const totalPages = Math.ceil(result.total / pageSize);

      return Result.ok<ListCreatorsOutput>({
        creators: result.creators,
        total: result.total,
        page,
        pageSize,
        totalPages,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      return Result.fail(
        `Erreur lors de la recuperation des createurs: ${message}`
      );
    }
  }
}
