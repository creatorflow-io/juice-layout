import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TenantService, withIdempotency } from '@juice-js/core';
import { SearchablePage } from '@juice-js/layout';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface LogLine {
  at: string;
  text: string;
  kind: 'sent' | 'ok' | 'err';
}

/**
 * DEMO: exercises the idempotency interceptor and the backend contract against the
 * Juice test host (`environment.idempotencyDemoApi`). Two backends live under that host:
 * the deterministic `/mock-api/{scenario}` emulators (one per response case) that the
 * scenario buttons hit via `withIdempotency(operationId)`, and the REAL
 * `[Idempotent] POST /api/orders` endpoint that `sendReal()` walks end-to-end — through
 * the actual Juice HTTP idempotency filter — covering every case in a single click.
 */
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DashboardComponent implements SearchablePage {
  tenantIdentifier: string = "";
  log: LogLine[] = [];
  private seq = 0;

  constructor(
    private tenant: TenantService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {
    this.tenant.getTenantIdentifier().then(tenant => {
      console.log(tenant);
      this.tenantIdentifier = tenant??"";
    });
  }

  /** Implementing this is what puts the search box in the toolbar on this page. */
  onSearch(query: string, event?: Event): void {
    console.log(query, event);
  }

  /** Fire one opted-in POST at the given mock scenario. */
  send(scenario: string): void {
    const operationId = `op-${scenario}-${++this.seq}`;
    this.post(scenario, operationId, `→ ${scenario} [${operationId}]`);
  }

  /**
   * Walk EVERY case of the REAL `POST /api/orders` endpoint in one click, over the
   * wire. Unlike the deterministic `/mock-api/*` emulators, this is a single endpoint
   * guarded by `[Idempotent(Scope = "orders")]`; the outcome depends only on the
   * `Idempotency-Key`, the payload fingerprint, and concurrency:
   *
   *   1 create   — new key                → 200 `{ orderId: <new>, replayed:false }`, stored
   *   2 replay   — same key + same payload → 200 the STORED envelope verbatim: SAME orderId
   *                                          (note `replayed` stays false — the identical
   *                                          orderId, not a flag, is the proof of exactly-once)
   *   3 conflict — same key + new payload  → 422 "Idempotency key conflict"
   *   4 required — no key                  → 400 "Idempotency-Key header required"
   *   5 invalid  — key > 128 chars         → 400 "Invalid Idempotency-Key"
   *   6 keyed    — via withIdempotency      → 200 (interceptor mints + attaches the key)
   *   7 coalesce — same op, 2 concurrent    → one in-flight request, ONE orderId (FR-009)
   *   8 in-flight race — N concurrent raw, same key, `?delayMs` widening the window →
   *                      the server's InProgress path (409 + Retry-After) for the losers,
   *                      one 200 for the winner; every 200 shares one orderId (exactly-once)
   *
   * Cases 1–3 hold the `Idempotency-Key` manually rather than using `withIdempotency`,
   * because the interceptor releases its key on every settled response
   * ({@link IdempotencyKeyService.release}) and mints a fresh one on the next dispatch —
   * so replay and payload-conflict can only be provoked by reusing a key we hold.
   */
  async sendReal(): Promise<void> {
    const url = `${environment.idempotencyDemoApi}/api/orders`;
    const run = ++this.seq;
    const payload = { amount: 100, at: run };
    this.append('sent', `→ real backend POST ${url} — walking every idempotency case [run ${run}]`);

    // 1–3: one held key drives create → replay → conflict. Sequential awaits so the
    // server commits each (scope, key) state before the next request reads it.
    const key = this.newKey();
    const created = await this.fireRaw(url, key, payload, '1 create (200 new orderId)');
    const replay = await this.fireRaw(url, key, payload, '2 replay (200 SAME orderId)');
    this.assertReplay(created?.orderId, replay?.orderId);
    await this.fireRaw(url, key, { ...payload, amount: 999 }, '3 conflict — same key, new payload (422)');

    // 4–5: request-validation cases, each self-contained.
    await this.fireRaw(url, null, payload, '4 missing key (400 header required)');
    await this.fireRaw(url, 'k'.repeat(129), payload, '5 oversized key >128 (400 invalid key)');

    // 6: interceptor happy path — a fresh operation mints a key, attaches it, gets 200.
    await this.fireKeyed(url, `op-order-${run}`, payload, '6 via interceptor (200)');

    // 7: dispatch coalescing (FR-009) — the same operation fired twice concurrently rides
    // one in-flight request, so both settle on ONE order (a single row created server-side).
    await this.coalesce(url, `op-coalesce-${run}`, payload);

    // 8: server in-progress (409). The real endpoint has no fake "in-progress" route — a 409
    // only arises from a genuine race, so fire a concurrent RAW burst on one shared key. The
    // `?delayMs` holds the winner inside the idempotency window (test-host only) so the losers
    // deterministically observe InProgress: expect one 200 + five 409 (+ Retry-After). Invariant
    // regardless of timing: every 200 carries the SAME orderId (exactly-once).
    await this.race(`${url}?delayMs=300`, this.newKey(), payload, 6);
  }

  /** Generate a fresh, collision-resistant Idempotency-Key for manual reuse. */
  private newKey(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `key-${++this.seq}-${new Date().getTime()}`;
  }

  /**
   * POST with a caller-controlled `Idempotency-Key` (or none), bypassing the
   * interceptor so we fully control key reuse and observe each backend case verbatim.
   * Returns the parsed order body on 2xx (so callers can compare `orderId`), else null.
   */
  private async fireRaw(url: string, key: string | null, body: unknown, label: string): Promise<any | null> {
    this.append('sent', `→ ${label}${key ? ` [key ${this.short(key)}]` : ' [no key]'}`);
    const options = key ? { headers: { 'Idempotency-Key': key } } : {};
    try {
      const res: any = await firstValueFrom(this.http.post(url, body, options));
      this.append('ok', `${label} ✓ ${this.summarize(res)}`);
      return res;
    } catch (err: any) {
      this.append('err', `${label} ✗ ${err?.status ?? ''} ${this.errText(err)}`);
      return null;
    }
  }

  /** POST through the interceptor (mints + attaches the key, 409 retry/backoff) for one operation. */
  private async fireKeyed(url: string, operationId: string, body: unknown, label: string): Promise<any | null> {
    this.append('sent', `→ ${label} [${operationId}]`);
    try {
      const res: any = await firstValueFrom(this.http.post(url, body, { context: withIdempotency(operationId) }));
      this.append('ok', `${label} ✓ ${this.summarize(res)}`);
      return res;
    } catch (err: any) {
      this.append('err', `${label} ✗ ${err?.name ?? 'Error'} ${err?.status ?? ''}: ${this.errText(err)}`);
      return null;
    }
  }

  /**
   * Fire the same operation twice concurrently through the interceptor. The second
   * dispatch is coalesced onto the first in-flight request (FR-009), so both resolve
   * to ONE order — proven by an identical `orderId`, not two rows.
   */
  private async coalesce(url: string, operationId: string, body: unknown): Promise<void> {
    this.append('sent', `→ 7 coalesce: two concurrent dispatches share [${operationId}]`);
    const both = [1, 2].map(() =>
      firstValueFrom(this.http.post(url, body, { context: withIdempotency(operationId) })) as Promise<any>);
    try {
      const [a, b] = await Promise.all(both);
      const same = a?.orderId && a.orderId === b?.orderId;
      this.append(same ? 'ok' : 'err', same
        ? `7 coalesced ✓ both dispatches → one order ${this.short(a.orderId)} (single request)`
        : `7 coalesce mismatch: ${this.short(a?.orderId)} vs ${this.short(b?.orderId)}`);
    } catch (err: any) {
      this.append('err', `7 coalesce ✗ ${err?.name ?? 'Error'} ${err?.status ?? ''}: ${this.errText(err)}`);
    }
  }

  /**
   * Fire `n` concurrent RAW posts sharing one key (interceptor bypassed, so they are NOT
   * coalesced and actually race at the server). Reports the status spread and asserts the
   * core invariant: exactly-once — every 2xx response carries a single shared `orderId`.
   * When `url` carries the test host's `?delayMs`, the winner is held inside the idempotency
   * window so the losers deterministically return 409 (Request in progress, + Retry-After);
   * without it, a fast run may instead serialize into all-replay 200s.
   */
  private async race(url: string, key: string, body: unknown, n: number): Promise<void> {
    this.append('sent', `→ 8 in-flight race: ${n} concurrent raw posts share [key ${this.short(key)}]`);
    const options = { headers: { 'Idempotency-Key': key }, observe: 'response' as const };
    const settled = await Promise.all(
      Array.from({ length: n }, () =>
        firstValueFrom(this.http.post(url, body, options))
          .then((r: any) => ({ status: r.status as number, orderId: r.body?.orderId as string | undefined, retryAfter: r.headers?.get('Retry-After') }))
          .catch((e: any) => ({ status: (e?.status ?? 0) as number, orderId: undefined, retryAfter: e?.headers?.get?.('Retry-After') })),
      ),
    );

    const counts = settled.reduce<Record<number, number>>((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {});
    this.append('ok', `8 race settled — status counts ${JSON.stringify(counts)}`);

    const orderIds = new Set(settled.filter(r => r.status === 200 && r.orderId).map(r => r.orderId!));
    if (orderIds.size === 1) {
      this.append('ok', `8 exactly-once ✓ all ${counts[200] ?? 0} success responses share orderId ${this.short([...orderIds][0])}`);
    } else if (orderIds.size > 1) {
      this.append('err', `8 exactly-once BROKEN ✗ ${orderIds.size} distinct orderIds: ${[...orderIds].map(id => this.short(id)).join(', ')}`);
    }

    const inProgress = settled.filter(r => r.status === 409);
    this.append(inProgress.length ? 'ok' : 'sent', inProgress.length
      ? `8 observed ${inProgress.length}× 409 in-progress (Retry-After ${inProgress[0].retryAfter ?? '—'})`
      : `8 no 409 this run — the burst serialized; losers replayed the one order`);
  }

  /** Human summary of an order response: the orderId is the identity that proves replay. */
  private summarize(res: any): string {
    return res && typeof res === 'object' && 'orderId' in res
      ? `orderId ${this.short(res.orderId)} amount ${res.amount} replayed ${res.replayed}`
      : JSON.stringify(res);
  }

  /** First 8 chars of a key/id for readable logs. */
  private short(v: string | undefined | null): string {
    return v ? `${v.slice(0, 8)}…` : '—';
  }

  private assertReplay(firstOrderId: string | undefined, replayOrderId: string | undefined): void {
    if (!firstOrderId || !replayOrderId) {
      return;
    }
    const same = firstOrderId === replayOrderId;
    this.append(same ? 'ok' : 'err', same
      ? `   ↳ replay confirmed: orderId unchanged (${this.short(firstOrderId)}) — exactly-once ✓`
      : `   ↳ replay BROKEN: orderId changed ${this.short(firstOrderId)} → ${this.short(replayOrderId)}`);
  }

  private errText(err: any): string {
    return `${err?.error?.title ?? err?.message ?? err}`;
  }

  /** Fire the same operation twice in a row to show dispatch-level coalescing (FR-009). */
  doubleClick(): void {
    const operationId = `op-double-${++this.seq}`;
    this.append('sent', `→ double-click both share [${operationId}]`);
    this.post('success', operationId, 'click #1');
    this.post('success', operationId, 'click #2');
  }

  private post(scenario: string, operationId: string, label: string): void {
    this.append('sent', label);
    const url = `${environment.idempotencyDemoApi}/mock-api/${scenario}`;
    this.http
      .post(url, { amount: 100, at: this.seq }, { context: withIdempotency(operationId) })
      .subscribe({
        next: (res) => this.append('ok', `${label} ✓ ${JSON.stringify(res)}`),
        error: (err) => this.append('err', `${label} ✗ ${err?.name ?? 'Error'}: ${err?.message ?? err}`),
      });
  }

  clear(): void {
    this.log = [];
  }

  private append(kind: LogLine['kind'], text: string): void {
    // Timestamp without seconds-precision fuss; good enough to read ordering.
    this.log = [{ at: new Date().toLocaleTimeString(), text, kind }, ...this.log].slice(0, 40);
    this.cdr.detectChanges();
  }
}
