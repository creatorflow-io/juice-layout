import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TenantService, withIdempotency } from '@juice-js/core';
import { environment } from '../../environments/environment';

interface LogLine {
  at: string;
  text: string;
  kind: 'sent' | 'ok' | 'err';
}

/**
 * DEMO: exercises the idempotency interceptor against the in-app mock backend
 * (`MockIdempotencyBackendInterceptor`). Each button opts a POST into idempotency
 * via `withIdempotency(operationId)` and logs what comes back.
 */
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DashboardComponent {
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

  /** Fire one opted-in POST at the given mock scenario. */
  send(scenario: string): void {
    const operationId = `op-${scenario}-${++this.seq}`;
    this.post(scenario, operationId, `→ ${scenario} [${operationId}]`);
  }

  /**
   * Fire an opted-in POST at the REAL backend (`environment.idempotencyDemoApi`).
   * Unlike the mock buttons this goes over the wire, so the `Idempotency-Key`
   * header is visible in DevTools → Network (whatever status the server returns).
   */
  sendReal(): void {
    const operationId = `op-real-${++this.seq}`;
    const url = environment.idempotencyDemoApi;
    this.append('sent', `→ real backend ${url} [${operationId}]`);
    this.http
      .post(url, { amount: 100, at: this.seq }, { context: withIdempotency(operationId) })
      .subscribe({
        next: (res) => this.append('ok', `real ✓ ${JSON.stringify(res)}`),
        error: (err) => this.append('err', `real ✗ ${err?.name ?? 'Error'} ${err?.status ?? ''}: ${err?.message ?? err}`),
      });
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
    this.http
      .post(`/mock-api/${scenario}`, { amount: 100, at: this.seq }, { context: withIdempotency(operationId) })
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
