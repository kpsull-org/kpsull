import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import type { CustomerRepository, CustomerSummary, CustomerSortField, SortDirection } from '../ports';

export interface ListCustomersInput {
  /** Creator ID to filter customers */
  creatorId: string;
  /** Search query for name or email */
  search?: string;
  /** Field to sort by */
  sortBy?: CustomerSortField;
  /** Sort direction */
  sortDirection?: SortDirection;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

export interface ListCustomersOutput {
  /** List of customers */
  customers: CustomerSummary[];
  /** Total number of customers matching the query */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * ListCustomersUseCase
 *
 * Story 10-3: Liste historique clients
 *
 * Lists customers for a creator with their order history.
 * Supports searching by name/email and sorting by different fields.
 *
 * Acceptance Criteria:
 * - AC1: Liste des clients avec leurs commandes
 * - AC2: Tri par date, montant total, nombre de commandes
 * - AC3: Recherche par nom/email
 */
export class ListCustomersUseCase
  implements UseCase<ListCustomersInput, ListCustomersOutput>
{
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_PAGE_SIZE = 10;
  private static readonly MAX_PAGE_SIZE = 100;

  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(
    input: ListCustomersInput
  ): Promise<Result<ListCustomersOutput>> {
    // Validate creator ID
    if (!input.creatorId || input.creatorId.trim() === '') {
      return Result.fail('Creator ID est requis');
    }

    // Validate and normalize pagination
    const page = Math.max(ListCustomersUseCase.DEFAULT_PAGE, input.page ?? ListCustomersUseCase.DEFAULT_PAGE);
    const pageSize = Math.min(
      ListCustomersUseCase.MAX_PAGE_SIZE,
      Math.max(1, input.pageSize ?? ListCustomersUseCase.DEFAULT_PAGE_SIZE)
    );

    // Normalize sort parameters
    const sortBy: CustomerSortField = input.sortBy ?? 'lastOrderDate';
    const sortDirection: SortDirection = input.sortDirection ?? 'desc';

    // Normalize search query
    const search = input.search?.trim() || undefined;

    try {
      const result = await this.customerRepository.listCustomers({
        creatorId: input.creatorId,
        search,
        sortBy,
        sortDirection,
        page,
        pageSize,
      });

      const totalPages = Math.ceil(result.total / pageSize);

      return Result.ok<ListCustomersOutput>({
        customers: result.customers,
        total: result.total,
        page,
        pageSize,
        totalPages,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      return Result.fail(
        `Erreur lors de la recuperation des clients: ${message}`
      );
    }
  }
}
