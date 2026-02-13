import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { AdminOrderRepository, AdminOrderSummary } from '../ports';

export interface ListAdminOrdersInput {
  search?: string;
  statusFilter?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAdminOrdersOutput {
  orders: AdminOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class ListAdminOrdersUseCase
  implements UseCase<ListAdminOrdersInput, ListAdminOrdersOutput>
{
  constructor(private readonly orderRepository: AdminOrderRepository) {}

  async execute(
    input: ListAdminOrdersInput,
  ): Promise<Result<ListAdminOrdersOutput>> {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const search = input.search?.trim() || undefined;
    const statusFilter = input.statusFilter || undefined;

    const result = await this.orderRepository.listOrders({
      search,
      statusFilter,
      page,
      pageSize,
    });
    const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

    return Result.ok({
      orders: result.orders,
      total: result.total,
      page,
      pageSize,
      totalPages,
    });
  }
}
