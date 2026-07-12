import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Operation identifier that groups all HTTP attempts belonging to one logical
 * state-changing operation. Requests carrying the same operation id reuse the
 * same `Idempotency-Key` (across double-clicks and retries); a `null` value
 * means the request is not opted into idempotency.
 */
export const IDEMPOTENCY_OPERATION = new HttpContextToken<string | null>(() => null);

/**
 * Optional client-side retry horizon (in milliseconds) that bounds how long a
 * key may be reused, mirroring the backend retention window. Past this age the
 * request is surfaced as an expired condition rather than silently treated as new.
 */
export const IDEMPOTENCY_MAX_AGE_MS = new HttpContextToken<number | null>(() => null);

/**
 * Build (or extend) an {@link HttpContext} that opts a request into idempotency
 * for the given logical operation.
 *
 * @example
 * this.http.post('/orders', body, { context: withIdempotency('create-order-42') });
 */
export function withIdempotency(
  operationId: string,
  maxAgeMs?: number,
  context: HttpContext = new HttpContext(),
): HttpContext {
  context.set(IDEMPOTENCY_OPERATION, operationId);
  if (maxAgeMs != null) {
    context.set(IDEMPOTENCY_MAX_AGE_MS, maxAgeMs);
  }
  return context;
}
