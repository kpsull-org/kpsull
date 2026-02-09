import { describe, it, expect } from 'vitest';
import { CreatorStatusSpecification } from '../creator-status.specification';
import { CreatorSearchSpecification } from '../creator-search.specification';
import type { CreatorLike } from '../creator-like.type';

function makeCreator(overrides: Partial<CreatorLike> = {}): CreatorLike {
  return {
    name: 'Default Name',
    email: 'default@test.com',
    status: 'ACTIVE',
    ...overrides,
  };
}

describe('CreatorStatusSpecification', () => {
  it('should match ACTIVE creators', () => {
    const spec = new CreatorStatusSpecification('ACTIVE');
    expect(spec.isSatisfiedBy(makeCreator({ status: 'ACTIVE' }))).toBe(true);
    expect(spec.isSatisfiedBy(makeCreator({ status: 'SUSPENDED' }))).toBe(false);
  });

  it('should match SUSPENDED creators', () => {
    const spec = new CreatorStatusSpecification('SUSPENDED');
    expect(spec.isSatisfiedBy(makeCreator({ status: 'SUSPENDED' }))).toBe(true);
    expect(spec.isSatisfiedBy(makeCreator({ status: 'ACTIVE' }))).toBe(false);
  });

  it('should generate Prisma where for ACTIVE (no un-reactivated suspensions)', () => {
    const spec = new CreatorStatusSpecification('ACTIVE');
    expect(spec.toPrismaWhere()).toEqual({
      suspensions: { none: { reactivatedAt: null } },
    });
  });

  it('should generate Prisma where for SUSPENDED (has un-reactivated suspension)', () => {
    const spec = new CreatorStatusSpecification('SUSPENDED');
    expect(spec.toPrismaWhere()).toEqual({
      suspensions: { some: { reactivatedAt: null } },
    });
  });
});

describe('CreatorSearchSpecification', () => {
  it('should match by name (case-insensitive)', () => {
    const spec = new CreatorSearchSpecification('jean');
    expect(spec.isSatisfiedBy(makeCreator({ name: 'Jean Dupont', email: 'other@test.com' }))).toBe(true);
    expect(spec.isSatisfiedBy(makeCreator({ name: 'JEAN', email: 'other@test.com' }))).toBe(true);
    expect(spec.isSatisfiedBy(makeCreator({ name: 'Marie', email: 'other@test.com' }))).toBe(false);
  });

  it('should match by email (case-insensitive)', () => {
    const spec = new CreatorSearchSpecification('jean@');
    expect(spec.isSatisfiedBy(makeCreator({ name: 'Other', email: 'jean@example.com' }))).toBe(true);
    expect(spec.isSatisfiedBy(makeCreator({ name: 'Other', email: 'JEAN@EXAMPLE.COM' }))).toBe(true);
  });

  it('should generate correct Prisma where clause', () => {
    const spec = new CreatorSearchSpecification('paris');
    expect(spec.toPrismaWhere()).toEqual({
      OR: [
        { name: { contains: 'paris', mode: 'insensitive' } },
        { email: { contains: 'paris', mode: 'insensitive' } },
      ],
    });
  });

  it('should compose with status spec', () => {
    const spec = new CreatorSearchSpecification('jean').and(
      new CreatorStatusSpecification('ACTIVE')
    );
    expect(spec.toPrismaWhere()).toEqual({
      AND: [
        {
          OR: [
            { name: { contains: 'jean', mode: 'insensitive' } },
            { email: { contains: 'jean', mode: 'insensitive' } },
          ],
        },
        { suspensions: { none: { reactivatedAt: null } } },
      ],
    });
  });
});
