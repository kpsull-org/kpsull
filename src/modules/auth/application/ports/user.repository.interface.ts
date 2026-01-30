import { User } from '../../domain/entities/user.entity';

/**
 * User Repository Interface (Port)
 *
 * This interface defines the contract for user persistence operations.
 * Following the hexagonal architecture pattern, this port is defined in
 * the application layer and implemented in the infrastructure layer.
 *
 * @example
 * ```typescript
 * // In use case
 * class CreateUserUseCase {
 *   constructor(private userRepository: UserRepository) {}
 *
 *   async execute(input: CreateUserInput): Promise<Result<UserDTO>> {
 *     const user = User.create(input);
 *     await this.userRepository.save(user);
 *     return Result.ok(UserMapper.toDTO(user));
 *   }
 * }
 * ```
 */
export interface UserRepository {
  /**
   * Finds a user by their unique ID
   * @param id - The user's unique identifier
   * @returns The user if found, null otherwise
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by their email address
   * @param email - The user's email address
   * @returns The user if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Saves a user (creates or updates)
   * @param user - The user entity to save
   */
  save(user: User): Promise<void>;

  /**
   * Checks if a user with the given email exists
   * @param email - The email to check
   * @returns True if a user with this email exists
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Deletes a user by their ID
   * @param id - The user's unique identifier
   */
  delete(id: string): Promise<void>;
}
