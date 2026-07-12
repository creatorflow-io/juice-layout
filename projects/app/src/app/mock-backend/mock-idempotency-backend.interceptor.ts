import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, delay, mergeMap, of, throwError } from 'rxjs';

interface KeyState {
  attempts: number;
  body: string;
}

/**
 * DEMO-ONLY in-app stand-in for the Juice backend `011-idempotency-key-api`
 * contract, so the {@link IdempotencyInterceptor} can be exercised end-to-end in
 * the browser without a running server. It short-circuits requests to
 * `/mock-api/*` (never calls `next.handle`) and replies per scenario:
 *
 * - `POST /mock-api/success`      → `200` (replays the stored result on a repeat key)
 * - `POST /mock-api/in-progress`  → `409` for the first two attempts, then `200`
 * - `POST /mock-api/stuck`        → `409` forever (drives the retries-exhausted path)
 * - `POST /mock-api/conflict`     → `422` (key reused with a different payload)
 * - `POST /mock-api/required`     → `400` with an idempotency-key ProblemDetails title
 *
 * Registered AFTER {@link IdempotencyModule} so the idempotency interceptor wraps
 * it: the key is attached on the way in and the reply flows back through the
 * retry/backoff and error-mapping logic. Not exported from the library.
 */
@Injectable()
export class MockIdempotencyBackendInterceptor implements HttpInterceptor {
  private readonly latencyMs = 1000;
  private readonly seen = new Map<string, KeyState>();

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith('/mock-api/')) {
      return next.handle(req);
    }

    const scenario = req.url.slice('/mock-api/'.length);
    const key = req.headers.get('Idempotency-Key');

    // Simulate network latency so a double-click has a window in which the
    // interceptor can coalesce the second dispatch onto the first.
    return of(null).pipe(
      delay(this.latencyMs),
      mergeMap(() => this.reply(scenario, key, req)),
    );
  }

  private reply(scenario: string, key: string | null, req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    if (scenario === 'required' || !key) {
      return this.error(400, 'Bad Request', { title: 'Idempotency-Key header is required' });
    }

    if (scenario === 'conflict') {
      return this.error(422, 'Unprocessable Entity', { title: 'Idempotency key conflict' });
    }

    const body = JSON.stringify(req.body ?? null);
    const prior = this.seen.get(key);

    if (scenario === 'in-progress' || scenario === 'stuck') {
      const state = prior ?? { attempts: 0, body };
      state.attempts += 1;
      this.seen.set(key, state);
      const stillWorking = scenario === 'stuck' || state.attempts <= 2;
      if (stillWorking) {
        return this.error(409, 'Conflict', { title: 'Operation still in progress', attempts: state.attempts });
      }
      return this.ok({ ok: true, key, attempts: state.attempts, replayed: false });
    }

    // Default `success` scenario: first key stores the result; a repeat of the
    // same key replays it, and the same key with a different payload conflicts.
    if (prior) {
      if (prior.body !== body) {
        return this.error(422, 'Unprocessable Entity', { title: 'Idempotency key conflict' });
      }
      return this.ok({ ok: true, key, replayed: true });
    }
    this.seen.set(key, { attempts: 1, body });
    return this.ok({ ok: true, key, replayed: false });
  }

  private ok(body: unknown): Observable<HttpEvent<unknown>> {
    return of(new HttpResponse({ status: 200, body }));
  }

  private error(status: number, statusText: string, error: unknown): Observable<HttpEvent<unknown>> {
    return throwError(() => new HttpErrorResponse({ status, statusText, error }));
  }
}
