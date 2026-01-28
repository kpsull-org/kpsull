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
 * It validates the input, checks for duplicate emails, and persists the user.
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
    // First validate the email format before checking existence
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

    // Check if email already exists
    const emailExists = await this.userRepository.existsByEmail(input.email);
    if (emailExists) {
      return Result.fail('User with this email already exists');
    }

    const user = userResult.value;

    // Persist the user
    await this.userRepository.save(user);

    // Return the user DTO
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
