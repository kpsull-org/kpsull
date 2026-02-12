import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../ports/user.repository.interface';
import { UserDTO } from '../dtos/user.dto';

/**
 * Input for GetUserByEmailUseCase
 */
export interface GetUserByEmailInput {
  email: string;
}

/**
 * Use case for finding a user by their email address
 *
 * This use case retrieves a user from the repository by their email address.
 * Returns null if no user is found with the given email.
 *
 * @example
 * ```typescript
 * const useCase = new GetUserByEmailUseCase(userRepository);
 *
 * const result = await useCase.execute({ email: 'user@example.com' });
 *
 * if (result.isSuccess && result.value) {
 *   console.log('User found:', result.value.name);
 * } else {
 *   console.log('User not found');
 * }
 * ```
 */
export class GetUserByEmailUseCase
  implements UseCase<GetUserByEmailInput, UserDTO | null>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetUserByEmailInput): Promise<Result<UserDTO | null>> {
    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      return Result.ok(null);
    }

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
      phone: user.phone,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
