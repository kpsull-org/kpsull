import type {
  CreatorRepository,
  CreatorSummary,
  ListCreatorsParams,
  ListCreatorsResult,
} from '../../application/ports';

/**
 * Mock creator data for development and testing
 *
 * Story 11-2: Liste gestion createurs
 */
const MOCK_CREATORS: CreatorSummary[] = [
  {
    id: 'creator-001',
    name: 'Atelier Parisien',
    email: 'contact@atelier-parisien.fr',
    registeredAt: new Date('2023-06-15'),
    status: 'ACTIVE',
    totalRevenue: 1250000, // 12,500.00 EUR
  },
  {
    id: 'creator-002',
    name: 'Maison Bordeaux',
    email: 'hello@maison-bordeaux.com',
    registeredAt: new Date('2023-08-22'),
    status: 'ACTIVE',
    totalRevenue: 890000, // 8,900.00 EUR
  },
  {
    id: 'creator-003',
    name: 'Studio Lyon',
    email: 'info@studio-lyon.fr',
    registeredAt: new Date('2023-10-05'),
    status: 'SUSPENDED',
    totalRevenue: 45000, // 450.00 EUR
  },
  {
    id: 'creator-004',
    name: 'Creations Marseille',
    email: 'contact@creations-marseille.com',
    registeredAt: new Date('2023-11-12'),
    status: 'ACTIVE',
    totalRevenue: 678000, // 6,780.00 EUR
  },
  {
    id: 'creator-005',
    name: 'Artisan Toulouse',
    email: 'artisan@toulouse-creations.fr',
    registeredAt: new Date('2023-12-01'),
    status: 'ACTIVE',
    totalRevenue: 345000, // 3,450.00 EUR
  },
  {
    id: 'creator-006',
    name: 'Boutique Nice',
    email: 'boutique@nice-artisans.com',
    registeredAt: new Date('2024-01-10'),
    status: 'ACTIVE',
    totalRevenue: 123000, // 1,230.00 EUR
  },
  {
    id: 'creator-007',
    name: 'Atelier Nantes',
    email: 'atelier@nantes-creations.fr',
    registeredAt: new Date('2024-01-15'),
    status: 'SUSPENDED',
    totalRevenue: 12000, // 120.00 EUR
  },
  {
    id: 'creator-008',
    name: 'Studio Strasbourg',
    email: 'hello@studio-strasbourg.com',
    registeredAt: new Date('2024-01-18'),
    status: 'ACTIVE',
    totalRevenue: 567000, // 5,670.00 EUR
  },
  {
    id: 'creator-009',
    name: 'Maison Lille',
    email: 'contact@maison-lille.fr',
    registeredAt: new Date('2024-01-20'),
    status: 'ACTIVE',
    totalRevenue: 234000, // 2,340.00 EUR
  },
  {
    id: 'creator-010',
    name: 'Creations Rennes',
    email: 'info@creations-rennes.com',
    registeredAt: new Date('2024-01-22'),
    status: 'ACTIVE',
    totalRevenue: 98000, // 980.00 EUR
  },
  {
    id: 'creator-011',
    name: 'Artisan Montpellier',
    email: 'artisan@montpellier-shop.fr',
    registeredAt: new Date('2024-01-24'),
    status: 'ACTIVE',
    totalRevenue: 156000, // 1,560.00 EUR
  },
  {
    id: 'creator-012',
    name: 'Boutique Grenoble',
    email: 'boutique@grenoble-makers.com',
    registeredAt: new Date('2024-01-25'),
    status: 'ACTIVE',
    totalRevenue: 45000, // 450.00 EUR
  },
];

/**
 * MockCreatorRepository
 *
 * Story 11-2: Liste gestion createurs
 *
 * Mock implementation of CreatorRepository for development and testing.
 * Provides realistic creator data with filtering, sorting, and pagination.
 */
export class MockCreatorRepository implements CreatorRepository {
  private creators: CreatorSummary[];

  constructor(creators: CreatorSummary[] = MOCK_CREATORS) {
    this.creators = creators;
  }

  async listCreators(params: ListCreatorsParams): Promise<ListCreatorsResult> {
    let filtered = [...this.creators];

    // Apply status filter (AC2)
    if (params.statusFilter && params.statusFilter !== 'ALL') {
      filtered = filtered.filter(
        (creator) => creator.status === params.statusFilter
      );
    }

    // Apply search filter (AC3)
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (creator) =>
          creator.name.toLowerCase().includes(searchLower) ||
          creator.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (params.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'registeredAt':
          comparison = a.registeredAt.getTime() - b.registeredAt.getTime();
          break;
        case 'totalRevenue':
          comparison = a.totalRevenue - b.totalRevenue;
          break;
      }

      return params.sortDirection === 'asc' ? comparison : -comparison;
    });

    const total = filtered.length;

    // Apply pagination (AC4)
    const startIndex = (params.page - 1) * params.pageSize;
    const endIndex = startIndex + params.pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      creators: paginated,
      total,
    };
  }

  async suspendCreator(creatorId: string): Promise<void> {
    const creator = this.creators.find((c) => c.id === creatorId);
    if (creator) {
      creator.status = 'SUSPENDED';
    }
  }

  async reactivateCreator(creatorId: string): Promise<void> {
    const creator = this.creators.find((c) => c.id === creatorId);
    if (creator) {
      creator.status = 'ACTIVE';
    }
  }
}
