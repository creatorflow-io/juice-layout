import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, finalize, retry, shareReplay, tap, throwError, timer } from 'rxjs';
import { IDEMPOTENCY_MAX_AGE_MS, IDEMPOTENCY_OPERATION } from './idempotency.context';
import {
  IdempotencyConflictError,
  IdempotencyExpiredError,
  IdempotencyKeyRequiredError,
} from './idempotency.errors';
import { IdempotencyKeyService } from './idempotency-key.service';
import { classifyError } from './idempotency-response';

/**
 * Attaches an `Idempotency-Key` header to opted-in state-changing requests and
 * interprets the backend idempotency responses:
 * - replayed success is passed through and the key released;
 * - `409` in-progress triggers a bounded backoff retry reusing the same key;
 * - `422` conflict and `400` required surface as typed errors without resubmission;
 * - keys past their retry horizon surface as an expired error.
 *
 * On top of the shared key, it de-duplicates concurrent dispatches of the same
 * operation (FR-009): while one attempt is in flight, a second subscription to
 * the same operation is coalesced onto the first in-flight response instead of
 * issuing a parallel request, so a double-click settles on a single outcome.
 *
 * Mirrors the `@juice-js/auth` `AuthInterceptor` idiom.
 */
@Injectable()
export class IdempotencyInterceptor implements HttpInterceptor {
  private readonly maxInProgressRetries = 3;
  private readonly baseBackoffMs = 500;

  /**
   * Shared, in-flight response streams keyed by operation id. Present only while
   * an operation is being sent; cleared when it settles (success or error).
   */
  private readonly inFlight = new Map<string, Observable<HttpEvent<unknown>>>();

  constructor(private readonly keys: IdempotencyKeyService) {}

  private isUnsafe(method: string): boolean {
    const m = method.toUpperCase();
    return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const operationId = req.context.get(IDEMPOTENCY_OPERATION);

    // Not opted in, or a safe/read-only request → pass through untouched (FR-004).
    if (!operationId || !this.isUnsafe(req.method)) {
      return next.handle(req);
    }

    const maxAgeMs = req.context.get(IDEMPOTENCY_MAX_AGE_MS);
    if (this.keys.isExpired(operationId, maxAgeMs)) {
      this.keys.release(operationId);
      return throwError(() => new IdempotencyExpiredError(operationId));
    }

    // FR-009: a duplicate dispatch while the operation is in flight rides the
    // existing response instead of firing a parallel request.
    const existing = this.inFlight.get(operationId);
    if (existing) {
      return existing;
    }

    const key = this.keys.getKey(operationId);
    const idempotentReq = req.clone({ headers: req.headers.set('Idempotency-Key', key) });

    const shared = next.handle(idempotentReq).pipe(
      retry({
        count: this.maxInProgressRetries,
        delay: (error, retryCount) => {
          // Only retry the in-progress signal; every other error propagates immediately.
          if (!(error instanceof HttpErrorResponse) || classifyError(error) !== 'in-progress') {
            throw error;
          }
          return timer(this.baseBackoffMs * Math.pow(2, retryCount - 1));
        },
      }),
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.keys.release(operationId);
        }
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          switch (classifyError(error)) {
            case 'conflict':
              this.keys.release(operationId);
              return throwError(() => new IdempotencyConflictError(operationId));
            case 'required':
              this.keys.release(operationId);
              return throwError(() => new IdempotencyKeyRequiredError());
            case 'in-progress':
              // Retries exhausted while still in progress — surface the original error,
              // keeping the key so a later manual retry can reuse it within retention.
              return throwError(() => error);
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => error);
      }),
      // Drop the coalescing entry once the operation settles so the next dispatch
      // starts a fresh attempt. With refCount:false below this fires on terminal
      // success or error, not on a subscriber leaving mid-flight.
      finalize(() => this.inFlight.delete(operationId)),
      // Multicast the single attempt to every coalesced subscriber; refCount:false
      // keeps the request running even if the initial subscriber unsubscribes.
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.inFlight.set(operationId, shared);
    return shared;
  }
}
