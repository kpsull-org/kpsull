import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';

/**
 * Escrow release delay in milliseconds (48 hours)
 */
export const ESCROW_RELEASE_DELAY_MS = 48 * 60 * 60 * 1000;

/**
 * Escrow release delay in hours (for display purposes)
 */
export const ESCROW_RELEASE_DELAY_HOURS = 48;

export type EscrowStatus = 'NOT_DELIVERED' | 'PENDING_RELEASE' | 'RELEASED';

export interface CalculateEscrowReleaseInput {
  deliveredAt: Date | null;
  currentDate?: Date; // Optional for testing purposes
}

export interface CalculateEscrowReleaseOutput {
  status: EscrowStatus;
  releaseDate: Date | null;
  remainingHours: number | null;
  isReleased: boolean;
}

/**
 * Use Case: Calculate Escrow Release
 *
 * Story 9-2: Liberation fonds 48h
 *
 * Calculates when funds will be released to the creator after delivery confirmation.
 * Escrow funds are held for 48 hours after delivery to allow for disputes.
 *
 * Acceptance Criteria:
 * - AC1: Calculate release date as deliveredAt + 48 hours
 * - Returns status: NOT_DELIVERED | PENDING_RELEASE | RELEASED
 * - Returns remaining hours until release
 */
export class CalculateEscrowReleaseUseCase
  implements UseCase<CalculateEscrowReleaseInput, CalculateEscrowReleaseOutput>
{
  async execute(
    input: CalculateEscrowReleaseInput
  ): Promise<Result<CalculateEscrowReleaseOutput>> {
    const { deliveredAt, currentDate = new Date() } = input;

    // Order not yet delivered
    if (!deliveredAt) {
      return Result.ok({
        status: 'NOT_DELIVERED',
        releaseDate: null,
        remainingHours: null,
        isReleased: false,
      });
    }

    // Calculate release date (deliveredAt + 48h)
    const releaseDate = new Date(deliveredAt.getTime() + ESCROW_RELEASE_DELAY_MS);
    const now = currentDate;

    // Check if funds are already released
    if (now >= releaseDate) {
      return Result.ok({
        status: 'RELEASED',
        releaseDate,
        remainingHours: 0,
        isReleased: true,
      });
    }

    // Calculate remaining hours
    const remainingMs = releaseDate.getTime() - now.getTime();
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

    return Result.ok({
      status: 'PENDING_RELEASE',
      releaseDate,
      remainingHours,
      isReleased: false,
    });
  }
}
