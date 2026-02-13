import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { AdminClientRepository, AdminClientSummary } from '../ports';

export interface ListAdminClientsInput {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAdminClientsOutput {
  clients: AdminClientSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class ListAdminClientsUseCase
  implements UseCase<ListAdminClientsInput, ListAdminClientsOutput>
{
  constructor(private readonly clientRepository: AdminClientRepository) {}

  async execute(
    input: ListAdminClientsInput,
  ): Promise<Result<ListAdminClientsOutput>> {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 10));
    const search = input.search?.trim() || undefined;

    const result = await this.clientRepository.listClients({ search, page, pageSize });
    const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

    return Result.ok({
      clients: result.clients,
      total: result.total,
      page,
      pageSize,
      totalPages,
    });
  }
}
