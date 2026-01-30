import { describe, it, expect } from 'vitest';
import { Role, RoleType, RoleHierarchy } from '../role.vo';

describe('Role Value Object', () => {
  describe('create', () => {
    it('should create CLIENT role', () => {
      const result = Role.create(RoleType.CLIENT);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(RoleType.CLIENT);
    });

    it('should create CREATOR role', () => {
      const result = Role.create(RoleType.CREATOR);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(RoleType.CREATOR);
    });

    it('should create ADMIN role', () => {
      const result = Role.create(RoleType.ADMIN);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(RoleType.ADMIN);
    });

    it('should fail with invalid role', () => {
      const result = Role.create('INVALID' as RoleType);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid role: INVALID');
    });
  });

  describe('fromString', () => {
    it('should create role from lowercase string', () => {
      const result = Role.fromString('client');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(RoleType.CLIENT);
    });

    it('should create role from uppercase string', () => {
      const result = Role.fromString('CREATOR');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(RoleType.CREATOR);
    });

    it('should create role from mixed case string', () => {
      const result = Role.fromString('Admin');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(RoleType.ADMIN);
    });

    it('should fail with invalid string', () => {
      const result = Role.fromString('invalid');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid role: INVALID');
    });
  });

  describe('default', () => {
    it('should create default CLIENT role', () => {
      const role = Role.default();

      expect(role.value).toBe(RoleType.CLIENT);
    });
  });

  describe('isClient', () => {
    it('should return true for CLIENT role', () => {
      const role = Role.create(RoleType.CLIENT).value;

      expect(role.isClient).toBe(true);
    });

    it('should return false for non-CLIENT role', () => {
      const role = Role.create(RoleType.CREATOR).value;

      expect(role.isClient).toBe(false);
    });
  });

  describe('isCreator', () => {
    it('should return true for CREATOR role', () => {
      const role = Role.create(RoleType.CREATOR).value;

      expect(role.isCreator).toBe(true);
    });

    it('should return false for non-CREATOR role', () => {
      const role = Role.create(RoleType.CLIENT).value;

      expect(role.isCreator).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN role', () => {
      const role = Role.create(RoleType.ADMIN).value;

      expect(role.isAdmin).toBe(true);
    });

    it('should return false for non-ADMIN role', () => {
      const role = Role.create(RoleType.CREATOR).value;

      expect(role.isAdmin).toBe(false);
    });
  });

  describe('canAccessCreatorFeatures', () => {
    it('should return false for CLIENT', () => {
      const role = Role.create(RoleType.CLIENT).value;

      expect(role.canAccessCreatorFeatures).toBe(false);
    });

    it('should return true for CREATOR', () => {
      const role = Role.create(RoleType.CREATOR).value;

      expect(role.canAccessCreatorFeatures).toBe(true);
    });

    it('should return true for ADMIN', () => {
      const role = Role.create(RoleType.ADMIN).value;

      expect(role.canAccessCreatorFeatures).toBe(true);
    });
  });

  describe('canAccessAdminFeatures', () => {
    it('should return false for CLIENT', () => {
      const role = Role.create(RoleType.CLIENT).value;

      expect(role.canAccessAdminFeatures).toBe(false);
    });

    it('should return false for CREATOR', () => {
      const role = Role.create(RoleType.CREATOR).value;

      expect(role.canAccessAdminFeatures).toBe(false);
    });

    it('should return true for ADMIN', () => {
      const role = Role.create(RoleType.ADMIN).value;

      expect(role.canAccessAdminFeatures).toBe(true);
    });
  });

  describe('hierarchy', () => {
    it('should have CLIENT at level 1', () => {
      expect(RoleHierarchy[RoleType.CLIENT]).toBe(1);
    });

    it('should have CREATOR at level 2', () => {
      expect(RoleHierarchy[RoleType.CREATOR]).toBe(2);
    });

    it('should have ADMIN at level 3', () => {
      expect(RoleHierarchy[RoleType.ADMIN]).toBe(3);
    });
  });

  describe('equality', () => {
    it('should be equal for same roles', () => {
      const role1 = Role.create(RoleType.CLIENT).value;
      const role2 = Role.create(RoleType.CLIENT).value;

      expect(role1.equals(role2)).toBe(true);
    });

    it('should not be equal for different roles', () => {
      const role1 = Role.create(RoleType.CLIENT).value;
      const role2 = Role.create(RoleType.CREATOR).value;

      expect(role1.equals(role2)).toBe(false);
    });
  });
});
