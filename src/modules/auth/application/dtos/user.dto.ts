import { RoleType } from '../../domain/value-objects/role.vo';

/**
 * Data Transfer Object for User
 *
 * Used to transfer user data between layers without exposing domain internals.
 */
export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: RoleType;
  emailVerified: Date | null;
  accountTypeChosen: boolean;
  wantsToBeCreator: boolean;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a new user
 */
export interface CreateUserDTO {
  email: string;
  name?: string | null;
  image?: string | null;
  role?: RoleType;
  emailVerified?: Date | null;
}

/**
 * DTO for updating user profile
 */
export interface UpdateUserProfileDTO {
  name?: string | null;
  image?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
}
