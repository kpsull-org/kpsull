import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../ports/user.repository.interface';
import { UserDTO } from '../dtos/user.dto';

/**
 * Input for UpdateProfileUseCase
 */
export interface UpdateProfileInput {
  userId: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Use case for updating a user's profile
 *
 * This use case handles updating the user's name and/or profile image.
 * Email changes require verification and are handled separately.
 *
 * @example
 * ```typescript
 * const useCase = new UpdateProfileUseCase(userRepository);
 *
 * const result = await useCase.execute({
 *   userId: 'user-123',
 *   name: 'New Name',
 *   image: 'https://example.com/new-avatar.jpg',
 * });
 *
 * if (result.isSuccess) {
 *   console.log('Profile updated:', result.value);
 * }
 * ```
 */
export class UpdateProfileUseCase implements UseCase<UpdateProfileInput, UserDTO> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateProfileInput): Promise<Result<UserDTO>> {
    // Find the user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      return Result.fail('User not found');
    }

    // Update profile
    const updateResult = user.updateProfile({
      name: input.name,
      image: input.image,
    });

    if (updateResult.isFailure) {
      return Result.fail(updateResult.error!);
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
