/**
 * Suspend Creator Use Case
 * Story 11-3: Desactivation compte
 *
 * Business rules:
 * - Creator must exist and be ACTIVE
 * - Reason is required
 * - Creates a CreatorSuspension audit record
 */

import type { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import type { CreatorRepository } from '../ports/analytics.repository.interface';

export interface SuspendCreatorInput {
  creatorId: string;
  adminId: string;
  reason: string;
}

export class SuspendCreatorUseCase
  implements UseCase<SuspendCreatorInput, void>
{
  constructor(private readonly creatorRepository: CreatorRepository) {}

  async execute(input: SuspendCreatorInput): Promise<Result<void>> {
    if (!input.reason.trim()) {
      return Result.fail('La raison de suspension est obligatoire');
    }

    await this.creatorRepository.suspendCreator(input.creatorId, input.adminId, input.reason);
    return Result.ok(undefined);
  }
}
