import { describe, it, expect } from "vitest";
import { Result } from "../result";

describe("Result", () => {
  describe("ok", () => {
    it("should create a successful result with value", () => {
      const result = Result.ok(42);

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe(42);
      expect(result.error).toBeUndefined();
    });

    it("should create a successful result without value", () => {
      const result = Result.ok<void>();

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.error).toBeUndefined();
    });
  });

  describe("fail", () => {
    it("should create a failed result with error message", () => {
      const result = Result.fail<number>("Something went wrong");

      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Something went wrong");
    });

    it("should throw when accessing value from failed result", () => {
      const result = Result.fail<number>("Error");

      expect(() => result.value).toThrow(
        "Cannot retrieve the value from a failed result"
      );
    });
  });

  describe("combine", () => {
    it("should return success when all results are successful", () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)];

      const combined = Result.combine(results);

      expect(combined.isSuccess).toBe(true);
    });

    it("should return first failure when any result fails", () => {
      const results = [
        Result.ok(1),
        Result.fail("First error"),
        Result.fail("Second error"),
      ];

      const combined = Result.combine(results);

      expect(combined.isFailure).toBe(true);
      expect(combined.error).toBe("First error");
    });
  });

  describe("map", () => {
    it("should transform successful result value", () => {
      const result = Result.ok(5);

      const mapped = result.map((x) => x * 2);

      expect(mapped.isSuccess).toBe(true);
      expect(mapped.value).toBe(10);
    });

    it("should not transform failed result", () => {
      const result = Result.fail<number>("Error");

      const mapped = result.map((x) => x * 2);

      expect(mapped.isFailure).toBe(true);
      expect(mapped.error).toBe("Error");
    });
  });

  describe("flatMap", () => {
    it("should chain successful results", () => {
      const result = Result.ok(5);

      const chained = result.flatMap((x) => Result.ok(x * 2));

      expect(chained.isSuccess).toBe(true);
      expect(chained.value).toBe(10);
    });

    it("should propagate failure", () => {
      const result = Result.fail<number>("First error");

      const chained = result.flatMap((x) => Result.ok(x * 2));

      expect(chained.isFailure).toBe(true);
      expect(chained.error).toBe("First error");
    });

    it("should handle nested failure", () => {
      const result = Result.ok(5);

      const chained = result.flatMap(() => Result.fail<number>("Nested error"));

      expect(chained.isFailure).toBe(true);
      expect(chained.error).toBe("Nested error");
    });
  });

  describe("getOrElse", () => {
    it("should return value for successful result", () => {
      const result = Result.ok(42);

      expect(result.getOrElse(0)).toBe(42);
    });

    it("should return default value for failed result", () => {
      const result = Result.fail<number>("Error");

      expect(result.getOrElse(0)).toBe(0);
    });
  });
});
