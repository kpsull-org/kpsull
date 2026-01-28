import type { User as PrismaUser, Role as PrismaRole } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { RoleType } from '../../domain/value-objects/role.vo';
import { UserDTO } from '../../application/dtos/user.dto';

/**
 * Mapper for converting between User domain entity and Prisma persistence model
 *
 * This mapper handles the transformation between the domain representation
 * and the database representation of a User.
 */
export class UserMapper {
  /**
   * Converts a Prisma User to a domain User entity
   */
  static toDomain(prismaUser: PrismaUser): User {
    const result = User.reconstitute({
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      image: prismaUser.image,
      role: this.prismaToDomainRole(prismaUser.role),
      emailVerified: prismaUser.emailVerified,
      accountTypeChosen: prismaUser.accountTypeChosen,
      wantsToBeCreator: prismaUser.wantsToBeCreator,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });

    if (result.isFailure) {
      throw new Error(`Failed to reconstitute user: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Converts a domain User entity to Prisma data for persistence
   */
  static toPersistence(user: User): Omit<PrismaUser, 'id'> & { id: string } {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      image: user.image,
      role: this.domainToPrismaRole(user.role.value),
      emailVerified: user.emailVerified,
      accountTypeChosen: user.accountTypeChosen,
      wantsToBeCreator: user.wantsToBeCreator,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Converts a domain User entity to a DTO
   */
  static toDTO(user: User): UserDTO {
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

  /**
   * Converts Prisma Role enum to domain RoleType
   */
  private static prismaToDomainRole(prismaRole: PrismaRole): RoleType {
    const roleMap: Record<PrismaRole, RoleType> = {
      CLIENT: RoleType.CLIENT,
      CREATOR: RoleType.CREATOR,
      ADMIN: RoleType.ADMIN,
    };
    return roleMap[prismaRole] ?? RoleType.CLIENT;
  }

  /**
   * Converts domain RoleType to Prisma Role enum
   */
  private static domainToPrismaRole(role: RoleType): PrismaRole {
    const roleMap: Record<RoleType, PrismaRole> = {
      [RoleType.CLIENT]: 'CLIENT',
      [RoleType.CREATOR]: 'CREATOR',
      [RoleType.ADMIN]: 'ADMIN',
    };
    return roleMap[role] ?? 'CLIENT';
  }
}
