// Value Objects
export { Email } from './value-objects/email.vo';
export { Role, RoleType, RoleHierarchy } from './value-objects/role.vo';

// Entities
export {
  User,
  type CreateUserProps,
  type ReconstituteUserProps,
  type UpdateProfileProps,
} from './entities/user.entity';

// Events
export { UserCreatedEvent, type UserCreatedPayload } from './events/user-created.event';
