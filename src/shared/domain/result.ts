/**
 * Result pattern for handling success and failure cases without exceptions.
 *
 * This pattern provides a type-safe way to handle operations that can fail,
 * forcing the caller to handle both success and failure cases explicitly.
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number> {
 *   if (b === 0) {
 *     return Result.fail("Cannot divide by zero");
 *   }
 *   return Result.ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.isSuccess) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: string;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: string, value?: T) {
    if (isSuccess && error) {
      throw new Error("Invalid operation: success result cannot have an error");
    }
    if (!isSuccess && !error) {
      throw new Error("Invalid operation: failed result must have an error");
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;
  }

  /**
   * Returns the value if the result is successful.
   * Throws an error if trying to access value from a failed result.
   */
  get value(): T {
    if (!this.isSuccess) {
      throw new Error(
        `Cannot retrieve the value from a failed result. Error: ${this.error}`
      );
    }
    return this._value as T;
  }

  /**
   * Creates a successful Result with an optional value.
   */
  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  /**
   * Creates a failed Result with an error message.
   */
  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  /**
   * Combines multiple Results into one.
   * Returns the first failure if any, otherwise returns success.
   */
  public static combine(results: Result<unknown>[]): Result<void> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail(result.error!);
      }
    }
    return Result.ok();
  }

  /**
   * Maps the value of a successful result using the provided function.
   * If the result is a failure, returns the same failure.
   */
  public map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure) {
      return Result.fail(this.error!);
    }
    return Result.ok(fn(this._value as T));
  }

  /**
   * Chains Results together, similar to Promise.then().
   * If the result is a failure, returns the same failure without calling fn.
   */
  public flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure) {
      return Result.fail(this.error!);
    }
    return fn(this._value as T);
  }

  /**
   * Returns the value if successful, otherwise returns the default value.
   */
  public getOrElse(defaultValue: T): T {
    if (this.isFailure) {
      return defaultValue;
    }
    return this._value as T;
  }
}
