import { ValueObject } from '@/shared/domain/value-object.base';
import { Result } from '@/shared/domain/result';

/**
 * Enum representing the possible user roles in the system
 */
export enum RoleType {
  CLIENT = 'CLIENT',
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN',
}

/**
 * Role hierarchy levels for permission checking
 * Higher number = higher privileges
 */
export const RoleHierarchy: Record<RoleType, number> = {
  [RoleType.CLIENT]: 1,
  [RoleType.CREATOR]: 2,
  [RoleType.ADMIN]: 3,
};

interface RoleProps {
  value: RoleType;
}

/**
 * Role Value Object
 *
 * Represents a user's role in the system. Roles determine what features
 * and actions a user can access.
 *
 * @example
 * ```typescript
 * const roleResult = Role.create(RoleType.CREATOR);
 * if (roleResult.isSuccess) {
 *   const role = roleResult.value;
 *   console.log(role.isCreator); // true
 *   console.log(role.canAccessCreatorFeatures); // true
 * }
 * ```
 */
export class Role extends ValueObject<RoleProps> {
  private constructor(props: RoleProps) {
    super(props);
  }

  /**
   * Creates a new Role value object
   * @param role - The RoleType enum value
   * @returns Result containing Role or error message
   */
  static create(role: RoleType): Result<Role> {
    if (!Object.values(RoleType).includes(role)) {
      return Result.fail(`Invalid role: ${role}`);
    }

    return Result.ok(new Role({ value: role }));
  }

  /**
   * Creates a Role from a string value
   * @param roleString - The role as a string (case insensitive)
   * @returns Result containing Role or error message
   */
  static fromString(roleString: string): Result<Role> {
    const normalizedRole = roleString.toUpperCase() as RoleType;
    return Role.create(normalizedRole);
  }

  /**
   * Creates the default CLIENT role
   * @returns A Role with CLIENT type
   */
  static default(): Role {
    return new Role({ value: RoleType.CLIENT });
  }

  /**
   * The role type value
   */
  get value(): RoleType {
    return this.props.value;
  }

  /**
   * Whether this role is CLIENT
   */
  get isClient(): boolean {
    return this.props.value === RoleType.CLIENT;
  }

  /**
   * Whether this role is CREATOR
   */
  get isCreator(): boolean {
    return this.props.value === RoleType.CREATOR;
  }

  /**
   * Whether this role is ADMIN
   */
  get isAdmin(): boolean {
    return this.props.value === RoleType.ADMIN;
  }

  /**
   * Whether this role can access creator-specific features
   * (CREATOR and ADMIN can)
   */
  get canAccessCreatorFeatures(): boolean {
    return (
      this.props.value === RoleType.CREATOR ||
      this.props.value === RoleType.ADMIN
    );
  }

  /**
   * Whether this role can access admin-specific features
   * (only ADMIN can)
   */
  get canAccessAdminFeatures(): boolean {
    return this.props.value === RoleType.ADMIN;
  }

  /**
   * Returns the role string representation
   */
  override toString(): string {
    return this.value;
  }
}
