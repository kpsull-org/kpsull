import { describe, it, expect } from 'vitest';
import { CompositeSpecification } from '../composite-specification';

interface TestEntity {
  value: number;
  name: string;
}

class GreaterThanSpec extends CompositeSpecification<TestEntity> {
  constructor(private readonly threshold: number) {
    super();
  }
  isSatisfiedBy(entity: TestEntity): boolean {
    return entity.value > this.threshold;
  }
  toPrismaWhere(): Record<string, unknown> {
    return { value: { gt: this.threshold } };
  }
}

class NameContainsSpec extends CompositeSpecification<TestEntity> {
  constructor(private readonly query: string) {
    super();
  }
  isSatisfiedBy(entity: TestEntity): boolean {
    return entity.name.includes(this.query);
  }
  toPrismaWhere(): Record<string, unknown> {
    return { name: { contains: this.query } };
  }
}

describe('CompositeSpecification', () => {
  const entity: TestEntity = { value: 10, name: 'Alice' };

  describe('AND', () => {
    it('should return true when both specs are satisfied', () => {
      const spec = new GreaterThanSpec(5).and(new NameContainsSpec('Ali'));
      expect(spec.isSatisfiedBy(entity)).toBe(true);
    });

    it('should return false when one spec is not satisfied', () => {
      const spec = new GreaterThanSpec(15).and(new NameContainsSpec('Ali'));
      expect(spec.isSatisfiedBy(entity)).toBe(false);
    });

    it('should generate correct Prisma where clause', () => {
      const spec = new GreaterThanSpec(5).and(new NameContainsSpec('Ali'));
      expect(spec.toPrismaWhere()).toEqual({
        AND: [{ value: { gt: 5 } }, { name: { contains: 'Ali' } }],
      });
    });
  });

  describe('OR', () => {
    it('should return true when at least one spec is satisfied', () => {
      const spec = new GreaterThanSpec(15).or(new NameContainsSpec('Ali'));
      expect(spec.isSatisfiedBy(entity)).toBe(true);
    });

    it('should return false when neither spec is satisfied', () => {
      const spec = new GreaterThanSpec(15).or(new NameContainsSpec('Bob'));
      expect(spec.isSatisfiedBy(entity)).toBe(false);
    });

    it('should generate correct Prisma where clause', () => {
      const spec = new GreaterThanSpec(5).or(new NameContainsSpec('Ali'));
      expect(spec.toPrismaWhere()).toEqual({
        OR: [{ value: { gt: 5 } }, { name: { contains: 'Ali' } }],
      });
    });
  });

  describe('NOT', () => {
    it('should negate the spec', () => {
      const spec = new GreaterThanSpec(15).not();
      expect(spec.isSatisfiedBy(entity)).toBe(true);
    });

    it('should negate a satisfied spec', () => {
      const spec = new GreaterThanSpec(5).not();
      expect(spec.isSatisfiedBy(entity)).toBe(false);
    });

    it('should generate correct Prisma where clause', () => {
      const spec = new GreaterThanSpec(5).not();
      expect(spec.toPrismaWhere()).toEqual({
        NOT: { value: { gt: 5 } },
      });
    });
  });

  describe('chaining', () => {
    it('should support complex chains: (A AND B) OR C', () => {
      const spec = new GreaterThanSpec(5)
        .and(new NameContainsSpec('Ali'))
        .or(new GreaterThanSpec(100));

      expect(spec.isSatisfiedBy(entity)).toBe(true);
      expect(spec.toPrismaWhere()).toEqual({
        OR: [
          { AND: [{ value: { gt: 5 } }, { name: { contains: 'Ali' } }] },
          { value: { gt: 100 } },
        ],
      });
    });
  });
});
