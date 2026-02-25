/**
 * Reactivate Creator Use Case
 * Story 11-3: Desactivation compte
 *
 * Business rules:
 * - Creator must exist and be SUSPENDED
 * - Updates the suspension record with reactivation info
 */

import type { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import type { CreatorRepository } from '../ports/analytics.repository.interface';

export interface ReactivateCreatorInput {
  creatorId: string;
  adminId: string;
  reason: string;
}

export class ReactivateCreatorUseCase
  implements UseCase<ReactivateCreatorInput, void>
{
  constructor(private readonly creatorRepository: CreatorRepository) {}

  async execute(input: ReactivateCreatorInput): Promise<Result<void>> {
    if (!input.reason.trim()) {
      return Result.fail('La raison de reactivation est obligatoire');
    }

    await this.creatorRepository.reactivateCreator(input.creatorId, input.adminId, input.reason);
    return Result.ok(undefined);
  }
}
