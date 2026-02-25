import { describe, it, expect } from 'vitest';
import { ConcurrentModificationError } from '../concurrent-modification.error';

describe('ConcurrentModificationError', () => {
  it('should be an instance of Error', () => {
    const error = new ConcurrentModificationError('conflict detected');
    expect(error).toBeInstanceOf(Error);
  });

  it('should be an instance of ConcurrentModificationError', () => {
    const error = new ConcurrentModificationError('conflict detected');
    expect(error).toBeInstanceOf(ConcurrentModificationError);
  });

  it('should set the message passed to constructor', () => {
    const error = new ConcurrentModificationError('record was modified by another process');
    expect(error.message).toBe('record was modified by another process');
  });

  it('should set name to ConcurrentModificationError', () => {
    const error = new ConcurrentModificationError('conflict detected');
    expect(error.name).toBe('ConcurrentModificationError');
  });

  it('should be throwable and catchable', () => {
    const throwError = () => {
      throw new ConcurrentModificationError('conflict');
    };
    expect(throwError).toThrow(Error);
    expect(throwError).toThrow('conflict');
  });
});
