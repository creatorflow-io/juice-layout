import { HttpErrorResponse } from '@angular/common/http';

/**
 * Classification of a backend response with respect to idempotency handling.
 */
export type IdempotencyOutcome = 'in-progress' | 'conflict' | 'required' | 'other';

/**
 * Classify an {@link HttpErrorResponse} against the backend idempotency contract
 * (see the Juice backend `011-idempotency-key-api` feature):
 * - `409` → operation is still in progress (retry after backoff)
 * - `422` → key reused with a different payload (conflict)
 * - `400` with an idempotency-key ProblemDetails title → key required
 * - anything else → not an idempotency signal
 */
export function classifyError(error: HttpErrorResponse): IdempotencyOutcome {
  switch (error.status) {
    case 409:
      return 'in-progress';
    case 422:
      return 'conflict';
    case 400: {
      const title = (error.error && (error.error.title as string)) || '';
      return /idempotency[-\s]?key/i.test(title) ? 'required' : 'other';
    }
    default:
      return 'other';
  }
}
