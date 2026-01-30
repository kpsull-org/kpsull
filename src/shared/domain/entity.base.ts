import { UniqueId } from "./unique-id.vo";

/**
 * Base class for Entities in Domain-Driven Design.
 *
 * Entities are objects that have a distinct identity that runs through time
 * and different states. Two entities are equal if they have the same identity,
 * regardless of their properties.
 *
 * @example
 * ```typescript
 * interface UserProps {
 *   name: string;
 *   email: string;
 * }
 *
 * class User extends Entity<UserProps> {
 *   private constructor(props: UserProps, id?: UniqueId) {
 *     super(props, id);
 *   }
 *
 *   static create(props: UserProps): User {
 *     return new User(props);
 *   }
 * }
 * ```
 */
export abstract class Entity<T> {
  protected readonly _id: UniqueId;
  protected props: T;

  protected constructor(props: T, id?: UniqueId) {
    this._id = id ?? UniqueId.create();
    this.props = props;
  }

  get id(): UniqueId {
    return this._id;
  }

  /**
   * Compares two Entities for equality based on their identity.
   * Two entities are equal if they have the same unique identifier.
   */
  public equals(entity?: Entity<T>): boolean {
    if (!entity) {
      return false;
    }
    if (this === entity) {
      return true;
    }
    return this._id.equals(entity._id);
  }
}
