import { describe, it, expect } from "vitest";
import { Entity } from "../entity.base";
import { UniqueId } from "../unique-id.vo";

// Test implementation of Entity
interface UserProps {
  name: string;
  email: string;
}

class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: UniqueId) {
    super(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  static create(props: UserProps, id?: UniqueId): User {
    return new User(props, id);
  }
}

describe("Entity", () => {
  describe("identity", () => {
    it("should have a unique id when created", () => {
      const user = User.create({ name: "John", email: "john@example.com" });

      expect(user.id).toBeDefined();
      expect(user.id.value).toBeDefined();
    });

    it("should use provided id when given", () => {
      const id = UniqueId.create("custom-id-123");
      const user = User.create({ name: "John", email: "john@example.com" }, id);

      expect(user.id.equals(id)).toBe(true);
      expect(user.id.value).toBe("custom-id-123");
    });
  });

  describe("equality", () => {
    it("should be equal when ids are the same", () => {
      const id = UniqueId.create("same-id");
      const user1 = User.create(
        { name: "John", email: "john@example.com" },
        id
      );
      const user2 = User.create(
        { name: "Jane", email: "jane@example.com" },
        id
      );

      expect(user1.equals(user2)).toBe(true);
    });

    it("should not be equal when ids are different", () => {
      const user1 = User.create({ name: "John", email: "john@example.com" });
      const user2 = User.create({ name: "John", email: "john@example.com" });

      expect(user1.equals(user2)).toBe(false);
    });

    it("should be equal to itself", () => {
      const user = User.create({ name: "John", email: "john@example.com" });

      expect(user.equals(user)).toBe(true);
    });

    it("should not be equal to undefined", () => {
      const user = User.create({ name: "John", email: "john@example.com" });

      expect(user.equals(undefined)).toBe(false);
    });
  });

  describe("props access", () => {
    it("should expose props through getters", () => {
      const user = User.create({ name: "John", email: "john@example.com" });

      expect(user.name).toBe("John");
      expect(user.email).toBe("john@example.com");
    });
  });
});

describe("UniqueId", () => {
  describe("create", () => {
    it("should create unique id with random value", () => {
      const id1 = UniqueId.create();
      const id2 = UniqueId.create();

      expect(id1.value).toBeDefined();
      expect(id2.value).toBeDefined();
      expect(id1.value).not.toBe(id2.value);
    });

    it("should create unique id with provided value", () => {
      const id = UniqueId.create("custom-id");

      expect(id.value).toBe("custom-id");
    });
  });

  describe("fromString", () => {
    it("should create unique id from string", () => {
      const id = UniqueId.fromString("existing-id");

      expect(id.value).toBe("existing-id");
    });

    it("should throw for empty string", () => {
      expect(() => UniqueId.fromString("")).toThrow("UniqueId cannot be empty");
    });

    it("should throw for whitespace-only string", () => {
      expect(() => UniqueId.fromString("   ")).toThrow(
        "UniqueId cannot be empty"
      );
    });
  });

  describe("equality", () => {
    it("should be equal when values are the same", () => {
      const id1 = UniqueId.create("same-value");
      const id2 = UniqueId.create("same-value");

      expect(id1.equals(id2)).toBe(true);
    });

    it("should not be equal when values are different", () => {
      const id1 = UniqueId.create("value-1");
      const id2 = UniqueId.create("value-2");

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return string representation", () => {
      const id = UniqueId.create("my-id");

      expect(id.toString()).toBe("my-id");
    });
  });
});
