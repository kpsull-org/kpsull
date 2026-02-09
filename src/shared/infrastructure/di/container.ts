/**
 * Simple DI Container - lazy singleton registry.
 * Uses Symbols as tokens for type-safety.
 * No external framework required.
 */

interface Registration<T = unknown> {
  factory: () => T;
  instance?: T;
  resolved: boolean;
}

export class Container {
  private registrations = new Map<symbol, Registration>();

  register<T>(token: symbol, factory: () => T): void {
    this.registrations.set(token, { factory, resolved: false });
  }

  registerInstance<T>(token: symbol, instance: T): void {
    this.registrations.set(token, {
      factory: () => instance,
      instance,
      resolved: true,
    });
  }

  get<T>(token: symbol): T {
    const registration = this.registrations.get(token);
    if (!registration) {
      throw new Error(
        `No registration found for token: ${String(token.description ?? token.toString())}`
      );
    }
    if (!registration.resolved) {
      registration.instance = registration.factory();
      registration.resolved = true;
    }
    return registration.instance as T;
  }

  has(token: symbol): boolean {
    return this.registrations.has(token);
  }

  reset(): void {
    this.registrations.clear();
  }
}
