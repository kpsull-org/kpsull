import type { PrismaClient } from '@prisma/client';
import type {
  CustomerRepository,
  CustomerSummary,
  ListCustomersParams,
  ListCustomersResult,
} from '../../application/ports';

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listCustomers(params: ListCustomersParams): Promise<ListCustomersResult> {
    const { creatorId, search, sortBy, sortDirection, page, pageSize } = params;

    // Get all orders for this creator, grouped by customer
    const orders = await this.prisma.order.findMany({
      where: { creatorId },
      select: {
        customerId: true,
        customerName: true,
        customerEmail: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    // Aggregate by customer
    const customerMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        totalOrders: number;
        totalSpent: number;
        lastOrderDate: Date;
      }
    >();

    for (const order of orders) {
      const existing = customerMap.get(order.customerId);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += order.totalAmount;
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
          existing.name = order.customerName;
          existing.email = order.customerEmail;
        }
      } else {
        customerMap.set(order.customerId, {
          id: order.customerId,
          name: order.customerName,
          email: order.customerEmail,
          totalOrders: 1,
          totalSpent: order.totalAmount,
          lastOrderDate: order.createdAt,
        });
      }
    }

    let customers: CustomerSummary[] = Array.from(customerMap.values());

    // Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSearch) ||
          c.email.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    customers.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
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
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Paginate
    const total = customers.length;
    const start = (page - 1) * pageSize;
    const paginated = customers.slice(start, start + pageSize);

    return { customers: paginated, total };
  }
}
