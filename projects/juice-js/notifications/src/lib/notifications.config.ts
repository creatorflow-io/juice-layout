import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

/**
 * Where the Juice.Notifications API is, and how to find the person's tenant and token. Only `apiUrl` is required: the tenant comes from the
 * access token's `platform_tenant` claim and the token from `angular-oauth2-oidc`'s `OAuthService`, as `@juice-js/auth` signs people in.
 */
export interface NotificationsConfig {
  /** The API's base URL, without a trailing slash: `https://notifications.example.com`. */
  apiUrl: string;
  /** The inbox hub; left out: `${apiUrl}/hubs/inbox`. */
  hubUrl?: string;
  /**
   * The tenant's id (a GUID, which the API routes by; not the app's tenant identifier in its URL). A string, or a function read on each call;
   * left out: the access token's `platform_tenant` claim.
   */
  tenantId?: string | (() => string | null | undefined);
  /** The access token; left out: `OAuthService.getAccessToken()`. The REST calls get theirs from `@juice-js/auth`'s interceptor. */
  accessToken?: () => string | null | undefined;
  /** Items per page in the panel (at most 100). */
  pageSize?: number;
}

export const NOTIFICATIONS_CONFIG = new InjectionToken<NotificationsConfig>('NOTIFICATIONS_CONFIG');

/** Registers the configuration: `providers: [provideNotifications({ apiUrl: environment.notificationsApi })]`. */
export function provideNotifications(config: NotificationsConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: NOTIFICATIONS_CONFIG, useValue: config }]);
}

/** A JWT's payload claim, or null when the token isn't a JWT or hasn't it. Reads; never verifies (the API does). */
export function tokenClaim(token: string | null | undefined, claim: string): string | null {
  const payload = token?.split('.')[1];
  if (!payload) {
    return null;
  }
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const value = JSON.parse(decodeURIComponent(Array.from(json, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')))[claim];
    return typeof value === 'string' && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}
