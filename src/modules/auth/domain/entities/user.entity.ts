import { AggregateRoot } from '@/shared/domain/aggregate-root.base';
import { UniqueId } from '@/shared/domain/unique-id.vo';
import { Result } from '@/shared/domain/result';
import { Email } from '../value-objects/email.vo';
import { Role, RoleType } from '../value-objects/role.vo';
import { UserCreatedEvent } from '../events/user-created.event';

/**
 * Props required to create a new User
 */
export interface CreateUserProps {
  email: string;
  name?: string | null;
  image?: string | null;
  role?: RoleType;
  emailVerified?: Date | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

/**
 * Props required to reconstitute a User from persistence
 */
export interface ReconstituteUserProps {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: RoleType;
  emailVerified?: Date | null;
  accountTypeChosen?: boolean;
  wantsToBeCreator?: boolean;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props for updating user profile
 */
export interface UpdateProfileProps {
  name?: string | null;
  image?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

/**
 * Internal props for User entity
 */
interface UserProps {
  email: Email;
  name: string | null;
  image: string | null;
  role: Role;
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
 * User Entity (Aggregate Root)
 *
 * Represents a user in the system. Users can have different roles (CLIENT, CREATOR, ADMIN)
 * that determine their access to features.
 *
 * @example
 * ```typescript
 * const userResult = User.create({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 * });
 *
 * if (userResult.isSuccess) {
 *   const user = userResult.value;
 *   console.log(user.email.value); // 'user@example.com'
 *   console.log(user.role.isClient); // true (default role)
 * }
 * ```
 */
export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueId) {
    super(props, id);
  }

  /**
   * Creates a new User entity
   *
   * @param props - The properties to create the user with
   * @param id - Optional ID (generated if not provided)
   * @returns Result containing User or error message
   */
  static create(props: CreateUserProps, id?: UniqueId): Result<User> {
    // Validate and create Email value object
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error!);
    }

    // Create Role (default to CLIENT)
    const roleResult = props.role
      ? Role.create(props.role)
      : Result.ok(Role.default());

    if (roleResult.isFailure) {
      return Result.fail(roleResult.error!);
    }

    const now = new Date();

    const user = new User(
      {
        email: emailResult.value,
        name: props.name ?? null,
        image: props.image ?? null,
        role: roleResult.value,
        emailVerified: props.emailVerified ?? null,
        accountTypeChosen: false,
        wantsToBeCreator: false,
        phone: props.phone ?? null,
        address: props.address ?? null,
        city: props.city ?? null,
        postalCode: props.postalCode ?? null,
        country: props.country ?? null,
        createdAt: now,
        updatedAt: now,
      },
      id
    );

    // Add domain event for new user creation
    user.addDomainEvent(
      new UserCreatedEvent({
        userId: user.id.value,
        email: user.email.value,
        role: user.role.value,
      })
    );

    return Result.ok(user);
  }

  /**
   * Reconstitutes a User entity from persistence data
   *
   * This method is used when loading a user from the database.
   * It does NOT emit domain events since this is not a new creation.
   *
   * @param props - The properties from persistence
   * @returns Result containing User or error message
   */
  static reconstitute(props: ReconstituteUserProps): Result<User> {
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error!);
    }

    const roleResult = Role.create(props.role);
    if (roleResult.isFailure) {
      return Result.fail(roleResult.error!);
    }

    const id = UniqueId.fromString(props.id);

    const user = new User(
      {
        email: emailResult.value,
        name: props.name ?? null,
        image: props.image ?? null,
        role: roleResult.value,
        emailVerified: props.emailVerified ?? null,
        accountTypeChosen: props.accountTypeChosen ?? false,
        wantsToBeCreator: props.wantsToBeCreator ?? false,
        phone: props.phone ?? null,
        address: props.address ?? null,
        city: props.city ?? null,
        postalCode: props.postalCode ?? null,
        country: props.country ?? null,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      id
    );

    // Do NOT emit events when reconstituting from persistence

    return Result.ok(user);
  }

  /**
   * The user's email address
   */
  get email(): Email {
    return this.props.email;
  }

  /**
   * The user's display name
   */
  get name(): string | null {
    return this.props.name;
  }

  /**
   * The user's profile image URL
   */
  get image(): string | null {
    return this.props.image;
  }

  /**
   * The user's phone number
   */
  get phone(): string | null {
    return this.props.phone;
  }

  /**
   * The user's address
   */
  get address(): string | null {
    return this.props.address;
  }

  /**
   * The user's city
   */
  get city(): string | null {
    return this.props.city;
  }

  /**
   * The user's postal code
   */
  get postalCode(): string | null {
    return this.props.postalCode;
  }

  /**
   * The user's country
   */
  get country(): string | null {
    return this.props.country;
  }

  /**
   * The user's role
   */
  get role(): Role {
    return this.props.role;
  }

  /**
   * The date the user's email was verified
   */
  get emailVerified(): Date | null {
    return this.props.emailVerified;
  }

  /**
   * Whether the user's email has been verified
   */
  get isEmailVerified(): boolean {
    return this.props.emailVerified !== null;
  }

  /**
   * The date the user was created
   */
  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * The date the user was last updated
   */
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Updates the user's profile information
   *
   * @param props - The profile properties to update
   * @returns Result indicating success or failure
   */
  updateProfile(props: UpdateProfileProps): Result<void> {
    if (props.name !== undefined) {
      this.props.name = props.name;
    }

    if (props.image !== undefined) {
      this.props.image = props.image;
    }

    if (props.phone !== undefined) {
      this.props.phone = props.phone;
    }

    if (props.address !== undefined) {
      this.props.address = props.address;
    }

    if (props.city !== undefined) {
      this.props.city = props.city;
    }

    if (props.postalCode !== undefined) {
      this.props.postalCode = props.postalCode;
    }

    if (props.country !== undefined) {
      this.props.country = props.country;
    }

    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Changes the user's role
   *
   * @param newRole - The new role to assign
   * @returns Result indicating success or failure
   */
  changeRole(newRole: RoleType): Result<void> {
    const roleResult = Role.create(newRole);
    if (roleResult.isFailure) {
      return Result.fail(roleResult.error!);
    }

    this.props.role = roleResult.value;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Marks the user's email as verified
   */
  verifyEmail(): void {
    this.props.emailVerified = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Whether the user has chosen their account type
   */
  get accountTypeChosen(): boolean {
    return this.props.accountTypeChosen;
  }

  /**
   * Whether the user wants to become a creator
   */
  get wantsToBeCreator(): boolean {
    return this.props.wantsToBeCreator;
  }

  /**
   * Sets the account type for the user
   *
   * @param wantsToBeCreator - Whether the user wants to be a creator
   * @returns Result indicating success or failure
   */
  setAccountType(wantsToBeCreator: boolean): Result<void> {
    if (this.props.accountTypeChosen) {
      return Result.fail('Account type has already been chosen');
    }

    this.props.accountTypeChosen = true;
    this.props.wantsToBeCreator = wantsToBeCreator;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }
}
