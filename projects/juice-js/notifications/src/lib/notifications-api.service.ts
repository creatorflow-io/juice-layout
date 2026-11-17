import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ContactPoint, InboxCounts, InboxItem, InboxQuery, Me, Preference, QuietHours, VerificationSent,
} from './models';
import { NOTIFICATIONS_CONFIG, NotificationsConfig, tokenClaim } from './notifications.config';

/** Thrown (as an observable error) when no tenant id can be found: the configuration has none and the token no `platform_tenant` claim. */
export class NoTenantError extends Error {
  constructor() {
    super('[@juice-js/notifications] No tenant: configure tenantId, or sign in with a token that has a platform_tenant claim.');
  }
}

/**
 * The person's API of Juice.Notifications, one method per call. The bearer token comes from `@juice-js/auth`'s interceptor (list the API in
 * `AuthModuleConfig.allowedUrls`); errors are the API's problem details ({@link NotificationsProblem}) in an `HttpErrorResponse`.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);
  private readonly config: NotificationsConfig = inject(NOTIFICATIONS_CONFIG);
  private readonly oauth = inject(OAuthService, { optional: true });

  /** The access token for the hub (REST calls get theirs from the interceptor). */
  accessToken(): string | null {
    return (this.config.accessToken ? this.config.accessToken() : this.oauth?.getAccessToken()) ?? null;
  }

  /** The tenant's id: configured, or the token's `platform_tenant` claim. */
  tenantId(): string | null {
    const configured = typeof this.config.tenantId === 'function' ? this.config.tenantId() : this.config.tenantId;
    return configured || tokenClaim(this.accessToken(), 'platform_tenant');
  }

  get hubUrl(): string {
    return this.config.hubUrl ?? `${this.config.apiUrl}/hubs/inbox`;
  }

  // The inbox.

  inbox(query: InboxQuery = {}): Observable<InboxItem[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== false) {
        params = params.set(key, String(value));
      }
    }
    return this.me((base) => this.http.get<InboxItem[]>(`${base}/inbox`, { params }));
  }

  counts(): Observable<InboxCounts> {
    return this.me((base) => this.http.get<InboxCounts>(`${base}/inbox/counts`));
  }

  item(id: string): Observable<InboxItem> {
    return this.me((base) => this.http.get<InboxItem>(`${base}/inbox/${encodeURIComponent(id)}`));
  }

  /** Marks an item read (`true`) or unread. */
  read(id: string, read = true): Observable<InboxItem> {
    const url = (base: string) => `${base}/inbox/${encodeURIComponent(id)}/read`;
    return this.me((base) => read ? this.http.post<InboxItem>(url(base), null) : this.http.delete<InboxItem>(url(base)));
  }

  /** Archives an item (`true`, which also reads it) or puts it back. */
  archive(id: string, archive = true): Observable<InboxItem> {
    const url = (base: string) => `${base}/inbox/${encodeURIComponent(id)}/archive`;
    return this.me((base) => archive ? this.http.post<InboxItem>(url(base), null) : this.http.delete<InboxItem>(url(base)));
  }

  /**
   * Chooses one of the item's actions: the producer hears it and decides (the inbox decides nothing). Once per action; refused (409
   * `correlation_closed`) once it has been decided.
   */
  act(id: string, actionId: string): Observable<InboxItem> {
    return this.me((base) => this.http.post<InboxItem>(`${base}/inbox/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}`, null));
  }

  /** Acknowledges the item: the producer hears it. */
  acknowledge(id: string): Observable<InboxItem> {
    return this.me((base) => this.http.post<InboxItem>(`${base}/inbox/${encodeURIComponent(id)}/acknowledge`, null));
  }

  /** Marks every open item read, in one group or all; answers how many were. */
  readAll(group?: string): Observable<number> {
    const params = group ? new HttpParams().set('group', group) : undefined;
    return this.me((base) => this.http.post<{ marked: number }>(`${base}/inbox/read-all`, null, { params }).pipe(map((r) => r.marked)));
  }

  // The person and their settings.

  profile(): Observable<Me> {
    return this.me((base) => this.http.get<Me>(base));
  }

  preferences(): Observable<Preference[]> {
    return this.me((base) => this.http.get<Preference[]>(`${base}/preferences`));
  }

  /** Replaces all of the person's preferences (an empty list: everything on). */
  savePreferences(preferences: Preference[]): Observable<Preference[]> {
    const body = { preferences: preferences.map(({ category, channel, mode }) => ({ category, channel, mode })) };
    return this.me((base) => this.http.put<Preference[]>(`${base}/preferences`, body));
  }

  saveQuietHours(quiet: QuietHours): Observable<QuietHours> {
    return this.me((base) => this.http.put<QuietHours>(`${base}/quiet-hours`, quiet));
  }

  clearQuietHours(): Observable<void> {
    return this.me((base) => this.http.delete<void>(`${base}/quiet-hours`));
  }

  contactPoints(): Observable<ContactPoint[]> {
    return this.me((base) => this.http.get<ContactPoint[]>(`${base}/contact-points`));
  }

  addContactPoint(channel: string, address: string): Observable<ContactPoint> {
    return this.me((base) => this.http.post<ContactPoint>(`${base}/contact-points`, { channel, address }));
  }

  removeContactPoint(id: string): Observable<void> {
    return this.me((base) => this.http.delete<void>(`${base}/contact-points/${encodeURIComponent(id)}`));
  }

  /** Sends a verification code to the address. */
  sendCode(id: string): Observable<VerificationSent> {
    return this.me((base) => this.http.post<VerificationSent>(`${base}/contact-points/${encodeURIComponent(id)}/verification`, null));
  }

  verify(id: string, code: string): Observable<ContactPoint> {
    return this.me((base) => this.http.post<ContactPoint>(`${base}/contact-points/${encodeURIComponent(id)}/verify`, { code }));
  }

  /** A call under `…/tenants/{tenantId}/me`, or {@link NoTenantError} when there's no tenant. */
  private me<T>(call: (base: string) => Observable<T>): Observable<T> {
    const tenant = this.tenantId();
    return tenant
      ? call(`${this.config.apiUrl}/api/v1/tenants/${encodeURIComponent(tenant)}/me`)
      : throwError(() => new NoTenantError());
  }
}
