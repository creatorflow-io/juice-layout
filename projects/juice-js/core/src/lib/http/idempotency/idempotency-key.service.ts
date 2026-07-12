import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { TenantService } from '../../tenant/tenant.service';

/**
 * Optional provider of a user-scoped identifier (e.g. the authenticated subject)
 * folded into the idempotency key scope so keys are never reused across a user
 * switch. Kept as a token so `@juice-js/core` does not depend on `@juice-js/auth`
 * (which would introduce a circular library dependency). Applications with auth
 * provide `{ provide: IDEMPOTENCY_USER_CONTEXT, useValue: () => oauth.getIdentityClaims()?.sub ?? null }`.
 */
export const IDEMPOTENCY_USER_CONTEXT = new InjectionToken<() => string | null>('IDEMPOTENCY_USER_CONTEXT');

interface KeyEntry {
  key: string;
  scope: string;
  createdAt: number;
  inFlight: boolean;
}

/**
 * Generates, stores, and reuses a collision-resistant `Idempotency-Key` per
 * logical operation. The same operation id yields the same key across retries
 * and double-submits; distinct operations get distinct keys; and keys are scoped
 * to the current tenant/user so they never leak across a context switch.
 */
@Injectable({ providedIn: 'root' })
export class IdempotencyKeyService {
  private readonly entries = new Map<string, KeyEntry>();

  constructor(
    @Optional() private readonly tenant: TenantService | null,
    @Optional() @Inject(IDEMPOTENCY_USER_CONTEXT) private readonly userContext: (() => string | null) | null,
  ) {}

  private currentScope(): string {
    const t = this.tenant?.currentTenant?.identifier ?? this.tenant?.requestTenantIdentifier ?? '';
    const u = this.userContext?.() ?? '';
    return `${t}|${u}`;
  }

  private newKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback RFC4122-style generator for environments without crypto.randomUUID.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Return the existing key for this operation, or generate a new one. If the
   * current tenant/user scope differs from the stored entry, a fresh key is
   * generated (FR-010).
   */
  getKey(operationId: string): string {
    const scope = this.currentScope();
    const existing = this.entries.get(operationId);
    if (existing && existing.scope === scope) {
      return existing.key;
    }
    const entry: KeyEntry = { key: this.newKey(), scope, createdAt: Date.now(), inFlight: false };
    this.entries.set(operationId, entry);
    return entry.key;
  }

  /** Forget the key for a completed (or abandoned) operation. */
  release(operationId: string): void {
    this.entries.delete(operationId);
  }

  /**
   * Whether the stored key for the operation has exceeded the given retry
   * horizon. Returns `false` when no horizon is set or no key exists yet.
   */
  isExpired(operationId: string, maxAgeMs: number | null | undefined): boolean {
    if (maxAgeMs == null) {
      return false;
    }
    const entry = this.entries.get(operationId);
    if (!entry) {
      return false;
    }
    return Date.now() - entry.createdAt > maxAgeMs;
  }

  /**
   * UI-level double-submit guard (FR-009). Returns `false` if an operation is
   * already in flight, so callers can suppress a duplicate dispatch.
   */
  tryBeginInFlight(operationId: string): boolean {
    const scope = this.currentScope();
    const entry: KeyEntry =
      this.entries.get(operationId) ?? { key: this.newKey(), scope, createdAt: Date.now(), inFlight: false };
    if (entry.inFlight) {
      return false;
    }
    entry.inFlight = true;
    this.entries.set(operationId, entry);
    return true;
  }

  /** Clear the in-flight flag set by {@link tryBeginInFlight}. */
  endInFlight(operationId: string): void {
    const entry = this.entries.get(operationId);
    if (entry) {
      entry.inFlight = false;
    }
  }
}
