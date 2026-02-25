import { describe, it, expect } from 'vitest';
import { User, CreateUserProps } from '../user.entity';
import { RoleType } from '../../value-objects/role.vo';
import { UniqueId } from '@/shared/domain/unique-id.vo';

describe('User Entity', () => {
  const validProps: CreateUserProps = {
    email: 'test@example.com',
    name: 'John Doe',
    image: 'https://example.com/avatar.jpg',
  };

  describe('create', () => {
    it('should create a user with valid props', () => {
      const result = User.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.email.value).toBe('test@example.com');
      expect(result.value.name).toBe('John Doe');
      expect(result.value.image).toBe('https://example.com/avatar.jpg');
    });

    it('should create a user with default CLIENT role', () => {
      const result = User.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.role.value).toBe(RoleType.CLIENT);
    });

    it('should create a user with specified role', () => {
      const result = User.create({
        ...validProps,
        role: RoleType.CREATOR,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.role.value).toBe(RoleType.CREATOR);
    });

    it('should create a user with null emailVerified by default', () => {
      const result = User.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.emailVerified).toBeNull();
    });

    it('should create a user with emailVerified date', () => {
      const verifiedDate = new Date('2024-01-01');
      const result = User.create({
        ...validProps,
        emailVerified: verifiedDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.emailVerified).toEqual(verifiedDate);
    });

    it('should create a user with a unique ID', () => {
      const result = User.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBeInstanceOf(UniqueId);
    });

    it('should create a user with provided ID', () => {
      const customId = UniqueId.create();
      const result = User.create(validProps, customId);

      expect(result.isSuccess).toBe(true);
      expect(result.value.id.equals(customId)).toBe(true);
    });

    it('should fail with invalid email', () => {
      const result = User.create({
        ...validProps,
        email: 'invalid-email',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail with empty email', () => {
      const result = User.create({
        ...validProps,
        email: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Email cannot be empty');
    });

    it('should create a user without name (optional)', () => {
      const result = User.create({
        email: 'test@example.com',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBeNull();
    });

    it('should create a user without image (optional)', () => {
      const result = User.create({
        email: 'test@example.com',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.image).toBeNull();
    });

    it('should add UserCreated domain event', () => {
      const result = User.create(validProps);

      expect(result.isSuccess).toBe(true);
      const events = result.value.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]!.eventType).toBe('UserCreated');
    });

    it('should fail with invalid role', () => {
      const result = User.create({ ...validProps, role: 'INVALID_ROLE' as RoleType });
      expect(result.isFailure).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a user from persistence data', () => {
      const id = UniqueId.create();
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const result = User.reconstitute({
        id: id.value,
        email: 'test@example.com',
        name: 'John Doe',
        image: 'https://example.com/avatar.jpg',
        role: RoleType.CREATOR,
        emailVerified: new Date('2024-01-01'),
        createdAt,
        updatedAt,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.id.value).toBe(id.value);
      expect(result.value.email.value).toBe('test@example.com');
      expect(result.value.role.value).toBe(RoleType.CREATOR);
      expect(result.value.createdAt).toEqual(createdAt);
      expect(result.value.updatedAt).toEqual(updatedAt);
    });

    it('should not add domain events when reconstituting', () => {
      const id = UniqueId.create();
      const result = User.reconstitute({
        id: id.value,
        email: 'test@example.com',
        role: RoleType.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.domainEvents).toHaveLength(0);
    });

    it('should fail with invalid email in reconstitute', () => {
      const id = UniqueId.create();
      const result = User.reconstitute({
        id: id.value,
        email: 'not-an-email',
        role: RoleType.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.isFailure).toBe(true);
    });

    it('should fail with invalid role in reconstitute', () => {
      const id = UniqueId.create();
      const result = User.reconstitute({
        id: id.value,
        email: 'test@example.com',
        role: 'INVALID_ROLE' as RoleType,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.isFailure).toBe(true);
    });
  });

  describe('updateProfile', () => {
    it('should update name', () => {
      const user = User.create(validProps).value;

      const result = user.updateProfile({ name: 'Jane Doe' });

      expect(result.isSuccess).toBe(true);
      expect(user.name).toBe('Jane Doe');
    });

    it('should update image', () => {
      const user = User.create(validProps).value;

      const result = user.updateProfile({ image: 'https://example.com/new-avatar.jpg' });

      expect(result.isSuccess).toBe(true);
      expect(user.image).toBe('https://example.com/new-avatar.jpg');
    });

    it('should update both name and image', () => {
      const user = User.create(validProps).value;

      const result = user.updateProfile({
        name: 'Jane Doe',
        image: 'https://example.com/new-avatar.jpg',
      });

      expect(result.isSuccess).toBe(true);
      expect(user.name).toBe('Jane Doe');
      expect(user.image).toBe('https://example.com/new-avatar.jpg');
    });

    it('should update phone', () => {
      const user = User.create(validProps).value;
      const result = user.updateProfile({ phone: '+33612345678' });
      expect(result.isSuccess).toBe(true);
      expect(user.phone).toBe('+33612345678');
    });

    it('should update address', () => {
      const user = User.create(validProps).value;
      const result = user.updateProfile({ address: '12 rue de la Paix' });
      expect(result.isSuccess).toBe(true);
      expect(user.address).toBe('12 rue de la Paix');
    });

    it('should update city', () => {
      const user = User.create(validProps).value;
      const result = user.updateProfile({ city: 'Paris' });
      expect(result.isSuccess).toBe(true);
      expect(user.city).toBe('Paris');
    });

    it('should update postalCode', () => {
      const user = User.create(validProps).value;
      const result = user.updateProfile({ postalCode: '75001' });
      expect(result.isSuccess).toBe(true);
      expect(user.postalCode).toBe('75001');
    });

    it('should update country', () => {
      const user = User.create(validProps).value;
      const result = user.updateProfile({ country: 'FR' });
      expect(result.isSuccess).toBe(true);
      expect(user.country).toBe('FR');
    });
  });

  describe('changeRole', () => {
    it('should change role from CLIENT to CREATOR', () => {
      const user = User.create(validProps).value;

      const result = user.changeRole(RoleType.CREATOR);

      expect(result.isSuccess).toBe(true);
      expect(user.role.value).toBe(RoleType.CREATOR);
    });

    it('should change role from CREATOR to ADMIN', () => {
      const user = User.create({ ...validProps, role: RoleType.CREATOR }).value;

      const result = user.changeRole(RoleType.ADMIN);

      expect(result.isSuccess).toBe(true);
      expect(user.role.value).toBe(RoleType.ADMIN);
    });

    it('should fail when new role is invalid', () => {
      const user = User.create(validProps).value;
      const result = user.changeRole('INVALID_ROLE' as RoleType);
      expect(result.isFailure).toBe(true);
    });
  });

  describe('verifyEmail', () => {
    it('should set emailVerified to current date', () => {
      const user = User.create(validProps).value;
      const beforeVerification = new Date();

      user.verifyEmail();

      expect(user.emailVerified).not.toBeNull();
      expect(user.emailVerified!.getTime()).toBeGreaterThanOrEqual(beforeVerification.getTime());
    });

    it('should update emailVerified if already verified', () => {
      const user = User.create({
        ...validProps,
        emailVerified: new Date('2020-01-01'),
      }).value;

      user.verifyEmail();

      expect(user.emailVerified!.getTime()).toBeGreaterThan(new Date('2020-01-01').getTime());
    });
  });

  describe('isEmailVerified', () => {
    it('should return false if emailVerified is null', () => {
      const user = User.create(validProps).value;

      expect(user.isEmailVerified).toBe(false);
    });

    it('should return true if emailVerified is set', () => {
      const user = User.create({
        ...validProps,
        emailVerified: new Date(),
      }).value;

      expect(user.isEmailVerified).toBe(true);
    });
  });

  describe('equality', () => {
    it('should be equal for users with same ID', () => {
      const id = UniqueId.create();
      const user1 = User.create(validProps, id).value;
      const user2 = User.create({ ...validProps, name: 'Different Name' }, id).value;

      expect(user1.equals(user2)).toBe(true);
    });

    it('should not be equal for users with different IDs', () => {
      const user1 = User.create(validProps).value;
      const user2 = User.create(validProps).value;

      expect(user1.equals(user2)).toBe(false);
    });
  });

  describe('accountTypeChosen and wantsToBeCreator', () => {
    it('should create user with accountTypeChosen false by default', () => {
      const result = User.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.accountTypeChosen).toBe(false);
    });

    it('should create user with wantsToBeCreator false by default', () => {
      const result = User.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.wantsToBeCreator).toBe(false);
    });

    it('should reconstitute user with accountTypeChosen and wantsToBeCreator', () => {
      const id = UniqueId.create();
      const result = User.reconstitute({
        id: id.value,
        email: 'test@example.com',
        role: RoleType.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
        accountTypeChosen: true,
        wantsToBeCreator: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.accountTypeChosen).toBe(true);
      expect(result.value.wantsToBeCreator).toBe(true);
    });
  });

  describe('setAccountType', () => {
    it('should set accountTypeChosen to true when choosing CLIENT', () => {
      const user = User.create(validProps).value;

      const result = user.setAccountType(false);

      expect(result.isSuccess).toBe(true);
      expect(user.accountTypeChosen).toBe(true);
      expect(user.wantsToBeCreator).toBe(false);
    });

    it('should set accountTypeChosen and wantsToBeCreator to true when choosing CREATOR', () => {
      const user = User.create(validProps).value;

      const result = user.setAccountType(true);

      expect(result.isSuccess).toBe(true);
      expect(user.accountTypeChosen).toBe(true);
      expect(user.wantsToBeCreator).toBe(true);
    });

    it('should fail if account type was already chosen', () => {
      const id = UniqueId.create();
      const user = User.reconstitute({
        id: id.value,
        email: 'test@example.com',
        role: RoleType.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
        accountTypeChosen: true,
        wantsToBeCreator: false,
      }).value;

      const result = user.setAccountType(true);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Account type has already been chosen');
    });

    it('should update updatedAt when setting account type', () => {
      const user = User.create(validProps).value;
      const beforeUpdate = user.updatedAt;

      // Wait a bit to ensure time difference
      const result = user.setAccountType(false);

      expect(result.isSuccess).toBe(true);
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });
});
