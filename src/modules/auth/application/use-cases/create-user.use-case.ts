import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { User } from '../../domain/entities/user.entity';
import { RoleType } from '../../domain/value-objects/role.vo';
import { UserRepository } from '../ports/user.repository.interface';
import { UserDTO } from '../dtos/user.dto';

/**
 * Input for CreateUserUseCase
 */
export interface CreateUserInput {
  email: string;
  name?: string | null;
  image?: string | null;
  role?: RoleType;
  emailVerified?: Date | null;
}

/**
 * Use case for creating a new user
 *
 * This use case handles the business logic for creating a new user account.
 * It validates the input and persists the user atomically, relying on the
 * database unique constraint for email to prevent race conditions.
 *
 * @example
 * ```typescript
 * const useCase = new CreateUserUseCase(userRepository);
 *
 * const result = await useCase.execute({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 * });
 *
 * if (result.isSuccess) {
 *   console.log('User created:', result.value.id);
 * }
 * ```
 */
export class CreateUserUseCase implements UseCase<CreateUserInput, UserDTO> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<Result<UserDTO>> {
    // First validate the email format
    // This is done by attempting to create the user entity
    const userResult = User.create({
      email: input.email,
      name: input.name,
      image: input.image,
      role: input.role,
      emailVerified: input.emailVerified,
    });

    if (userResult.isFailure) {
      return Result.fail(userResult.error!);
    }

    const user = userResult.value;

    // Persist the user - rely on database unique constraint for atomicity
    // This eliminates the race condition between check and insert
    try {
      await this.userRepository.save(user);
      return Result.ok(this.toDTO(user));
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return Result.fail('Un utilisateur avec cet email existe deja');
      }
      throw error;
    }
  }

  /**
   * Checks if the error is a PostgreSQL unique constraint violation
   * PostgreSQL error code 23505 = unique_violation
   */
  private isUniqueConstraintError(error: unknown): boolean {
    if (error === null || typeof error !== 'object') {
      return false;
    }

    const pgError = error as { code?: string };
    return pgError.code === '23505';
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
