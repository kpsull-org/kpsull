/**
 * Authorization Service Interface (Port)
 *
 * Defines the contract for authorization operations.
 * This interface allows verifying user permissions without
 * coupling to specific infrastructure implementations.
 */
export interface IAuthorizationService {
  /**
   * Checks if a user has admin privileges
   * @param userId - The user's unique identifier
   * @returns True if the user is an admin, false otherwise
   */
  isAdmin(userId: string): Promise<boolean>;
}
