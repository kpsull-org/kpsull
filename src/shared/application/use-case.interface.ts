import { Result } from "../domain/result";

/**
 * Interface for Use Cases in the Application layer.
 *
 * Use Cases represent application-specific business rules and orchestrate
 * the flow of data to and from entities. They implement the application's
 * features and coordinate between the domain and infrastructure layers.
 *
 * @template TInput - The input DTO type
 * @template TOutput - The output DTO type
 *
 * @example
 * ```typescript
 * interface CreateUserInput {
 *   email: string;
 *   name: string;
 * }
 *
 * interface CreateUserOutput {
 *   id: string;
 *   email: string;
 * }
 *
 * class CreateUserUseCase implements UseCase<CreateUserInput, CreateUserOutput> {
 *   constructor(private userRepository: UserRepository) {}
 *
 *   async execute(input: CreateUserInput): Promise<Result<CreateUserOutput>> {
 *     const user = User.create(input);
 *     await this.userRepository.save(user);
 *     return Result.ok({ id: user.id.value, email: input.email });
 *   }
 * }
 * ```
 */
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<Result<TOutput>>;
}

/**
 * Interface for Use Cases that don't require input.
 */
export interface UseCaseWithoutInput<TOutput> {
  execute(): Promise<Result<TOutput>>;
}

/**
 * Interface for Use Cases that don't return output.
 */
export interface UseCaseWithoutOutput<TInput> {
  execute(input: TInput): Promise<Result<void>>;
}
