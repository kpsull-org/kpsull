import type {
  ReturnRepository,
  ReturnRequest,
  ReturnFilters,
  PaginationOptions,
} from '../../application/ports/return.repository.interface';

/**
 * Mock Return Repository for development/testing
 *
 * Story 9-5: Validation retour remboursement
 *
 * This mock repository provides sample data for development
 * until Prisma schema is extended with ReturnRequest model.
 */
export class MockReturnRepository implements ReturnRepository {
  private static returnRequests: Map<string, ReturnRequest> = MockReturnRepository.initializeMockData();

  private static initializeMockData(): Map<string, ReturnRequest> {
    const data = new Map<string, ReturnRequest>();
    const now = new Date();

    // Sample return requests for testing
    const sampleReturns: ReturnRequest[] = [
      {
        id: 'return-1',
        orderId: 'order-1',
        orderNumber: 'KPS-2024-001',
        creatorId: 'creator-123',
        customerId: 'customer-1',
        customerName: 'Jean Dupont',
        customerEmail: 'jean@example.com',
        reason: 'DEFECTIVE',
        reasonDetails: 'Le produit presente un defaut de fabrication',
        status: 'REQUESTED',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'return-2',
        orderId: 'order-2',
        orderNumber: 'KPS-2024-002',
        creatorId: 'creator-123',
        customerId: 'customer-2',
        customerName: 'Marie Martin',
        customerEmail: 'marie@example.com',
        reason: 'NOT_AS_DESCRIBED',
        reasonDetails: 'La couleur ne correspond pas a la photo',
        status: 'REQUESTED',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'return-3',
        orderId: 'order-3',
        orderNumber: 'KPS-2024-003',
        creatorId: 'creator-123',
        customerId: 'customer-3',
        customerName: 'Pierre Durand',
        customerEmail: 'pierre@example.com',
        reason: 'CHANGED_MIND',
        status: 'APPROVED',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'return-4',
        orderId: 'order-4',
        orderNumber: 'KPS-2024-004',
        creatorId: 'creator-123',
        customerId: 'customer-4',
        customerName: 'Sophie Lefebvre',
        customerEmail: 'sophie@example.com',
        reason: 'OTHER',
        reasonDetails: 'Commande en double',
        status: 'REJECTED',
        rejectionReason: 'Delai de retour depasse (plus de 14 jours)',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        rejectedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const returnRequest of sampleReturns) {
      data.set(returnRequest.id, returnRequest);
    }

    return data;
  }

  async save(returnRequest: ReturnRequest): Promise<void> {
    MockReturnRepository.returnRequests.set(returnRequest.id, { ...returnRequest });
  }

  async findById(id: string): Promise<ReturnRequest | null> {
    return MockReturnRepository.returnRequests.get(id) ?? null;
  }

  async findByOrderId(orderId: string): Promise<ReturnRequest | null> {
    for (const returnRequest of MockReturnRepository.returnRequests.values()) {
      if (returnRequest.orderId === orderId) {
        return returnRequest;
      }
    }
    return null;
  }

  async findByCreatorId(
    creatorId: string,
    filters?: ReturnFilters,
    pagination?: PaginationOptions
  ): Promise<{ returns: ReturnRequest[]; total: number }> {
    let results = Array.from(MockReturnRepository.returnRequests.values())
      .filter((r) => r.creatorId === creatorId);

    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }

    if (filters?.customerId) {
      results = results.filter((r) => r.customerId === filters.customerId);
    }

    // Sort by createdAt descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;

    if (pagination) {
      results = results.slice(pagination.skip, pagination.skip + pagination.take);
    }

    return { returns: results, total };
  }

  async findByCustomerId(
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<{ returns: ReturnRequest[]; total: number }> {
    let results = Array.from(MockReturnRepository.returnRequests.values())
      .filter((r) => r.customerId === customerId);

    // Sort by createdAt descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;

    if (pagination) {
      results = results.slice(pagination.skip, pagination.skip + pagination.take);
    }

    return { returns: results, total };
  }

  async delete(id: string): Promise<void> {
    MockReturnRepository.returnRequests.delete(id);
  }

  /**
   * Reset mock data (useful for testing)
   */
  static reset(): void {
    MockReturnRepository.returnRequests = MockReturnRepository.initializeMockData();
  }
}
