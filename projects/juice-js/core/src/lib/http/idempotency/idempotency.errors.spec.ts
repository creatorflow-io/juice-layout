import {
  IdempotencyConflictError,
  IdempotencyExpiredError,
  IdempotencyKeyRequiredError,
} from './idempotency.errors';

describe('idempotency errors', () => {
  it('IdempotencyConflictError carries the operation id and a stable name', () => {
    const err = new IdempotencyConflictError('op-1');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('IdempotencyConflictError');
    expect(err.operationId).toBe('op-1');
  });

  it('IdempotencyKeyRequiredError has a stable name', () => {
    const err = new IdempotencyKeyRequiredError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('IdempotencyKeyRequiredError');
  });

  it('IdempotencyExpiredError carries the operation id', () => {
    const err = new IdempotencyExpiredError('op-2');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('IdempotencyExpiredError');
    expect(err.operationId).toBe('op-2');
  });
});
