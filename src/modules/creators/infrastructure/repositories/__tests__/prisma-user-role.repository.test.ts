import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @prisma/client to avoid needing generated client
vi.mock('@prisma/client', () => ({
  Role: {
    CLIENT: 'CLIENT',
    CREATOR: 'CREATOR',
    ADMIN: 'ADMIN',
  },
}));

// Mock prisma client
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { Role } from '@prisma/client';

import { prisma } from '@/lib/prisma/client';
import { PrismaUserRoleRepository } from '../prisma-user-role.repository';

describe('PrismaUserRoleRepository', () => {
  let repository: PrismaUserRoleRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaUserRoleRepository();
  });

  describe('updateRole', () => {
    it('should update user role when role is valid', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      await repository.updateRole('user-123', 'CREATOR');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { role: 'CREATOR' },
      });
    });

    it('should accept all valid Role enum values', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      for (const role of Object.values(Role)) {
        await repository.updateRole('user-123', role);
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: { role },
        });
      }
    });

    it('should reject invalid role SUPERADMIN', async () => {
      await expect(
        repository.updateRole('user-123', 'SUPERADMIN')
      ).rejects.toThrow(
        'Role invalide: SUPERADMIN. Roles autorises: CLIENT, CREATOR, ADMIN'
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should reject empty string role', async () => {
      await expect(repository.updateRole('user-123', '')).rejects.toThrow(
        'Role invalide: . Roles autorises: CLIENT, CREATOR, ADMIN'
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should reject lowercase role', async () => {
      await expect(
        repository.updateRole('user-123', 'admin')
      ).rejects.toThrow('Role invalide: admin');

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should reject unknown role', async () => {
      await expect(
        repository.updateRole('user-123', 'MODERATOR')
      ).rejects.toThrow('Role invalide: MODERATOR');

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
