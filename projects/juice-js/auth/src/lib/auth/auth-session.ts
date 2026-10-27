import { Injectable } from '@angular/core';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter, skip } from 'rxjs/operators';

/** The OAuth events after which the signed-in user may be someone else, or nobody. */
const USER_EVENTS: readonly OAuthEvent['type'][] = [
  'token_received', 'token_refreshed', 'token_refresh_error', 'logout', 'session_terminated', 'session_error',
];

/**
 * Who is signed in, as a stable key (the `sub` claim), for anything that caches per user — menus, permissions,
 * profile data — and must start over when the user changes.
 *
 * A session whose access token expired but can still be refreshed counts as the same user, so a page reload or a
 * token renewal is not reported as a sign-in.
 *
 * ```ts
 * inject(AuthSession).changes.subscribe(() => this.cache.clear());
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AuthSession {
  private readonly key$: BehaviorSubject<string | null>;

  /** The current user key (`null` = nobody), then every change. */
  readonly user$: Observable<string | null>;
  /** Every change after the current value: sign-in (`null` → key), sign-out (key → `null`), another user. */
  readonly changes: Observable<string | null>;

  constructor(private oauthService: OAuthService) {
    this.key$ = new BehaviorSubject(this.readKey());
    this.user$ = this.key$.pipe(distinctUntilChanged());
    this.changes = this.user$.pipe(skip(1));
    this.oauthService.events
      .pipe(filter((e) => USER_EVENTS.includes(e.type)))
      .subscribe(() => this.key$.next(this.readKey()));
  }

  /** The signed-in user's key now; `null` when nobody is. */
  get userKey(): string | null {
    return this.key$.value;
  }

  private readKey(): string | null {
    if (!this.oauthService.hasValidAccessToken() && !this.oauthService.getRefreshToken()) {
      return null;
    }
    const claims = this.oauthService.getIdentityClaims() as Record<string, unknown> | null;
    const sub = claims?.['sub'] ?? subOf(this.oauthService.getAccessToken());
    return typeof sub === 'string' && sub ? sub : null;
  }
}

/** The `sub` of a JWT access token, unverified (a key only; the APIs verify the token). */
function subOf(token: string | null | undefined): unknown {
  const payload = token?.split('.')[1];
  if (!payload) {
    return undefined;
  }
  try {
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))['sub'];
  } catch {
    return undefined;
  }
}
