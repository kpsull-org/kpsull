import type {
  CustomerRepository,
  CustomerSummary,
  ListCustomersParams,
  ListCustomersResult,
} from '../../application/ports';

/**
 * Mock customer data for development and testing
 */
const MOCK_CUSTOMERS: CustomerSummary[] = [
  {
    id: 'cust-001',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    totalOrders: 12,
    totalSpent: 89500, // 895.00 EUR
    lastOrderDate: new Date('2024-01-15'),
  },
  {
    id: 'cust-002',
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    totalOrders: 8,
    totalSpent: 45200, // 452.00 EUR
    lastOrderDate: new Date('2024-01-12'),
  },
  {
    id: 'cust-003',
    name: 'Pierre Bernard',
    email: 'pierre.bernard@example.com',
    totalOrders: 5,
    totalSpent: 32100, // 321.00 EUR
    lastOrderDate: new Date('2024-01-10'),
  },
  {
    id: 'cust-004',
    name: 'Sophie Petit',
    email: 'sophie.petit@example.com',
    totalOrders: 15,
    totalSpent: 125000, // 1250.00 EUR
    lastOrderDate: new Date('2024-01-14'),
  },
  {
    id: 'cust-005',
    name: 'Lucas Moreau',
    email: 'lucas.moreau@example.com',
    totalOrders: 3,
    totalSpent: 18900, // 189.00 EUR
    lastOrderDate: new Date('2024-01-08'),
  },
  {
    id: 'cust-006',
    name: 'Emma Leroy',
    email: 'emma.leroy@example.com',
    totalOrders: 7,
    totalSpent: 56700, // 567.00 EUR
    lastOrderDate: new Date('2024-01-11'),
  },
  {
    id: 'cust-007',
    name: 'Thomas Roux',
    email: 'thomas.roux@example.com',
    totalOrders: 2,
    totalSpent: 12400, // 124.00 EUR
    lastOrderDate: new Date('2024-01-05'),
  },
  {
    id: 'cust-008',
    name: 'Camille Simon',
    email: 'camille.simon@example.com',
    totalOrders: 9,
    totalSpent: 67800, // 678.00 EUR
    lastOrderDate: new Date('2024-01-13'),
  },
  {
    id: 'cust-009',
    name: 'Hugo Laurent',
    email: 'hugo.laurent@example.com',
    totalOrders: 4,
    totalSpent: 29500, // 295.00 EUR
    lastOrderDate: new Date('2024-01-09'),
  },
  {
    id: 'cust-010',
    name: 'Lea Michel',
    email: 'lea.michel@example.com',
    totalOrders: 6,
    totalSpent: 43200, // 432.00 EUR
    lastOrderDate: new Date('2024-01-07'),
  },
  {
    id: 'cust-011',
    name: 'Nathan Garcia',
    email: 'nathan.garcia@example.com',
    totalOrders: 11,
    totalSpent: 98700, // 987.00 EUR
    lastOrderDate: new Date('2024-01-14'),
  },
  {
    id: 'cust-012',
    name: 'Chloe Martinez',
    email: 'chloe.martinez@example.com',
    totalOrders: 1,
    totalSpent: 8500, // 85.00 EUR
    lastOrderDate: new Date('2024-01-03'),
  },
];

/**
 * MockCustomerRepository
 *
 * Mock implementation of CustomerRepository for development and testing.
 * Provides realistic customer data with filtering, sorting, and pagination.
 */
export class MockCustomerRepository implements CustomerRepository {
  private customers: CustomerSummary[];

  constructor(customers: CustomerSummary[] = MOCK_CUSTOMERS) {
    this.customers = customers;
  }

  async listCustomers(params: ListCustomersParams): Promise<ListCustomersResult> {
    let filtered = [...this.customers];

    // Apply search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (params.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'totalOrders':
          comparison = a.totalOrders - b.totalOrders;
          break;
        case 'totalSpent':
          comparison = a.totalSpent - b.totalSpent;
          break;
        case 'lastOrderDate':
          comparison = a.lastOrderDate.getTime() - b.lastOrderDate.getTime();
          break;
      }

      return params.sortDirection === 'asc' ? comparison : -comparison;
    });

    const total = filtered.length;

    // Apply pagination
    const startIndex = (params.page - 1) * params.pageSize;
    const endIndex = startIndex + params.pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      customers: paginated,
      total,
    };
  }
}
