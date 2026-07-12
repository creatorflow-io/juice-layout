/**
 * Raised when the backend rejects a request because the same `Idempotency-Key`
 * was reused with a materially different payload (HTTP 422).
 */
export class IdempotencyConflictError extends Error {
  constructor(
    public readonly operationId: string,
    message = 'Idempotency key conflict: the same key was reused with a different payload.',
  ) {
    super(message);
    this.name = 'IdempotencyConflictError';
  }
}

/**
 * Raised when an endpoint requires an `Idempotency-Key` but none was supplied
 * (HTTP 400). Should not occur in normal client flow because the interceptor
 * always attaches a key to opted-in requests.
 */
export class IdempotencyKeyRequiredError extends Error {
  constructor(message = 'Idempotency-Key header is required for this request.') {
    super(message);
    this.name = 'IdempotencyKeyRequiredError';
  }
}

/**
 * Raised when a key has exceeded its client-side retry horizon and can no longer
 * be safely reused for the same operation.
 */
export class IdempotencyExpiredError extends Error {
  constructor(
    public readonly operationId: string,
    message = 'Idempotency key expired; the operation can no longer be safely retried with the same key.',
  ) {
    super(message);
    this.name = 'IdempotencyExpiredError';
  }
}
