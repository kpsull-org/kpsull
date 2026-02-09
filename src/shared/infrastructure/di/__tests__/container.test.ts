import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../container';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe('register and get', () => {
    it('should register and resolve a factory', () => {
      const token = Symbol('test');
      container.register<string>(token, () => 'hello');

      expect(container.get<string>(token)).toBe('hello');
    });

    it('should return the same instance on subsequent gets (singleton)', () => {
      const token = Symbol('test');
      let callCount = 0;
      container.register(token, () => {
        callCount++;
        return { value: callCount };
      });

      const first = container.get(token);
      const second = container.get(token);

      expect(first).toBe(second);
      expect(callCount).toBe(1);
    });

    it('should be lazy - factory not called until get', () => {
      const token = Symbol('test');
      let called = false;
      container.register(token, () => {
        called = true;
        return 'value';
      });

      expect(called).toBe(false);
      container.get(token);
      expect(called).toBe(true);
    });
  });

  describe('registerInstance', () => {
    it('should register and return an existing instance', () => {
      const token = Symbol('test');
      const instance = { name: 'test-instance' };
      container.registerInstance(token, instance);

      expect(container.get(token)).toBe(instance);
    });
  });

  describe('has', () => {
    it('should return true for registered tokens', () => {
      const token = Symbol('test');
      container.register(token, () => 'value');

      expect(container.has(token)).toBe(true);
    });

    it('should return false for unregistered tokens', () => {
      const token = Symbol('test');

      expect(container.has(token)).toBe(false);
    });
  });

  describe('get - error handling', () => {
    it('should throw when token is not registered', () => {
      const token = Symbol('missing');

      expect(() => container.get(token)).toThrow(
        'No registration found for token: missing'
      );
    });
  });

  describe('reset', () => {
    it('should clear all registrations', () => {
      const token = Symbol('test');
      container.register(token, () => 'value');

      container.reset();

      expect(container.has(token)).toBe(false);
    });
  });
});
