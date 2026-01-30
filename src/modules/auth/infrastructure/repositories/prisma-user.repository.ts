import { prisma } from '@/lib/prisma/client';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../application/ports/user.repository.interface';
import { UserMapper } from '../mappers/user.mapper';

/**
 * Prisma implementation of the UserRepository port
 *
 * This adapter implements the UserRepository interface using Prisma ORM
 * for persistence operations.
 *
 * @example
 * ```typescript
 * const userRepository = new PrismaUserRepository();
 * const user = await userRepository.findByEmail('user@example.com');
 * ```
 */
export class PrismaUserRepository implements UserRepository {
  /**
   * Finds a user by their unique ID
   */
  async findById(id: string): Promise<User | null> {
    const prismaUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!prismaUser) {
      return null;
    }

    return UserMapper.toDomain(prismaUser);
  }

  /**
   * Finds a user by their email address
   */
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();

    const prismaUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!prismaUser) {
      return null;
    }

    return UserMapper.toDomain(prismaUser);
  }

  /**
   * Saves a user (creates or updates)
   */
  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);

    await prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: {
        email: data.email,
        name: data.name,
        image: data.image,
        role: data.role,
        emailVerified: data.emailVerified,
        updatedAt: data.updatedAt,
      },
    });
  }

  /**
   * Checks if a user with the given email exists
   */
  async existsByEmail(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    const count = await prisma.user.count({
      where: { email: normalizedEmail },
    });

    return count > 0;
  }

  /**
   * Deletes a user by their ID
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}
