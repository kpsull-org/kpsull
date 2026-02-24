import { Result } from '@/shared/domain';
import type { ReturnRepository, ReturnRequest } from '../ports/return.repository.interface';
import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';

/**
 * Shared helper for return use cases.
 *
 * Validates inputs, fetches the return request, checks creator ownership,
 * and verifies the current status. Returns the return request on success
 * or a failure Result.
 */
export async function findAndValidateReturn(
  returnRepository: ReturnRepository,
  returnId: string,
  creatorId: string,
  expectedStatus: ReturnStatusValue,
  statusErrorMessage: string
): Promise<Result<ReturnRequest>> {
  if (!returnId?.trim()) {
    return Result.fail('Return ID est requis');
  }

  if (!creatorId?.trim()) {
    return Result.fail('Creator ID est requis');
  }

  const returnRequest = await returnRepository.findById(returnId);

  if (!returnRequest) {
    return Result.fail('Demande de retour non trouvee');
  }

  if (returnRequest.creatorId !== creatorId) {
    return Result.fail("Vous n'etes pas autorise a modifier cette demande de retour");
  }

  if (returnRequest.status !== expectedStatus) {
    return Result.fail(statusErrorMessage);
  }

  return Result.ok(returnRequest);
}
