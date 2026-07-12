import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { withIdempotency } from './idempotency.context';
import { IdempotencyConflictError, IdempotencyExpiredError } from './idempotency.errors';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyKeyService } from './idempotency-key.service';

describe('IdempotencyInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        IdempotencyKeyService,
        { provide: HTTP_INTERCEPTORS, useClass: IdempotencyInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('attaches an Idempotency-Key to an opted-in unsafe request', () => {
    http.post('/orders', { a: 1 }, { context: withIdempotency('op-1') }).subscribe();
    const req = httpMock.expectOne('/orders');
    expect(req.request.headers.has('Idempotency-Key')).toBeTrue();
    req.flush({});
  });

  it('does not attach a key to a read-only request', () => {
    http.get('/orders', { context: withIdempotency('op-1') }).subscribe();
    const req = httpMock.expectOne('/orders');
    expect(req.request.headers.has('Idempotency-Key')).toBeFalse();
    req.flush({});
  });

  it('does not attach a key when not opted in', () => {
    http.post('/orders', { a: 1 }).subscribe();
    const req = httpMock.expectOne('/orders');
    expect(req.request.headers.has('Idempotency-Key')).toBeFalse();
    req.flush({});
  });

  it('coalesces two concurrent submits of the same operation into one request (FR-009)', () => {
    const results: unknown[] = [];
    http.post('/orders', { a: 1 }, { context: withIdempotency('op-dup') }).subscribe((r) => results.push(r));
    http.post('/orders', { a: 1 }, { context: withIdempotency('op-dup') }).subscribe((r) => results.push(r));

    // Only one request leaves the app; the second dispatch rides the first.
    const req = httpMock.expectOne('/orders');
    req.flush({ ok: true });

    // Both subscribers settle on the single shared outcome.
    expect(results).toEqual([{ ok: true }, { ok: true }]);
  });

  it('starts a fresh request for the same operation once the first has settled', () => {
    http.post('/orders', { a: 1 }, { context: withIdempotency('op-seq') }).subscribe();
    const first = httpMock.expectOne('/orders');
    const firstKey = first.request.headers.get('Idempotency-Key');
    first.flush({ ok: true });

    // The in-flight entry was released on completion, so this is a new attempt
    // with a freshly generated key (the released one is not reused).
    http.post('/orders', { a: 1 }, { context: withIdempotency('op-seq') }).subscribe();
    const second = httpMock.expectOne('/orders');
    expect(second.request.headers.get('Idempotency-Key')).not.toBe(firstKey);
    second.flush({ ok: true });
  });

  it('retries on a 409 in-progress response reusing the same key, then succeeds', fakeAsync(() => {
    let result: unknown;
    http.post('/orders', { a: 1 }, { context: withIdempotency('op-ip') }).subscribe((r) => (result = r));

    const first = httpMock.expectOne('/orders');
    const key = first.request.headers.get('Idempotency-Key');
    first.flush({ title: 'Request in progress' }, { status: 409, statusText: 'Conflict' });

    tick(500); // first backoff

    const second = httpMock.expectOne('/orders');
    expect(second.request.headers.get('Idempotency-Key')).toBe(key);
    second.flush({ ok: true });
    tick();

    expect(result).toEqual({ ok: true });
  }));

  it('maps a 422 to IdempotencyConflictError without resubmitting', () => {
    let error: unknown;
    http.post('/orders', { a: 1 }, { context: withIdempotency('op-c') }).subscribe({ error: (e) => (error = e) });
    const req = httpMock.expectOne('/orders');
    req.flush({ title: 'Idempotency key conflict' }, { status: 422, statusText: 'Unprocessable Entity' });
    expect(error).toBeInstanceOf(IdempotencyConflictError);
    httpMock.verify(); // no second request was issued
  });

  it('surfaces an expired key as IdempotencyExpiredError', fakeAsync(() => {
    // Seed a persisting key, advance past the horizon, then dispatch — the
    // interceptor must reject before issuing any HTTP request.
    const keys = TestBed.inject(IdempotencyKeyService);
    keys.getKey('op-exp');

    tick(2000);

    let error: unknown;
    http.post('/orders', { a: 1 }, { context: withIdempotency('op-exp', 1000) }).subscribe({ error: (e) => (error = e) });
    expect(error).toBeInstanceOf(IdempotencyExpiredError);
    httpMock.verify(); // no request was issued
  }));
});
