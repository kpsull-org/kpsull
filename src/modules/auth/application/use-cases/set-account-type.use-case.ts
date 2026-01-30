import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../ports/user.repository.interface';
import { UserDTO } from '../dtos/user.dto';

/**
 * Input for SetAccountTypeUseCase
 */
export interface SetAccountTypeInput {
  userId: string;
  wantsToBeCreator: boolean;
}

/**
 * Use case for setting the account type for a user
 *
 * This use case handles the business logic for setting whether a user
 * wants to be a CLIENT or a CREATOR. This is typically called after
 * initial registration.
 *
 * @example
 * ```typescript
 * const useCase = new SetAccountTypeUseCase(userRepository);
 *
 * const result = await useCase.execute({
 *   userId: 'user-123',
 *   wantsToBeCreator: true,
 * });
 *
 * if (result.isSuccess) {
 *   if (result.value.wantsToBeCreator) {
 *     // Redirect to creator onboarding
 *   }
 * }
 * ```
 */
export class SetAccountTypeUseCase implements UseCase<SetAccountTypeInput, UserDTO> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: SetAccountTypeInput): Promise<Result<UserDTO>> {
    // Find the user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      return Result.fail('User not found');
    }

    // Set the account type
    const setResult = user.setAccountType(input.wantsToBeCreator);
    if (setResult.isFailure) {
      return Result.fail(setResult.error!);
    }

    // Persist the changes
    await this.userRepository.save(user);

    // Return the updated user DTO
    return Result.ok(this.toDTO(user));
  }

  private toDTO(user: User): UserDTO {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      image: user.image,
      role: user.role.value,
      emailVerified: user.emailVerified,
      accountTypeChosen: user.accountTypeChosen,
      wantsToBeCreator: user.wantsToBeCreator,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
