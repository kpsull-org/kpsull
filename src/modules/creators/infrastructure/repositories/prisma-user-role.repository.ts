import { prisma } from '@/lib/prisma/client';
import { Role } from '@prisma/client';
import { UserRoleRepository } from '../../application/use-cases/activate-creator-account.use-case';

/**
 * Prisma implementation of UserRoleRepository
 *
 * Simple adapter for updating user roles during creator activation.
 */
export class PrismaUserRoleRepository implements UserRoleRepository {
  async updateRole(userId: string, role: string): Promise<void> {
    // Validation du role avant cast
    const validRoles = Object.values(Role);
    if (!validRoles.includes(role as Role)) {
      throw new Error(
        `Role invalide: ${role}. Roles autorises: ${validRoles.join(', ')}`
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });
  }
}
