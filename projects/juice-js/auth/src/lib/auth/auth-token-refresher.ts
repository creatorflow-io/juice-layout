import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

/**
 * Renews the access token with the refresh token. Concurrent callers — the interceptor's 401 retries, the guard and
 * the expiry timer — share one request, so a rotating refresh token is redeemed once.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthTokenRefresher {
  private refreshing?: Promise<boolean>;

  constructor(private oauthService: OAuthService) {}

  /** True when a refresh token is stored, so an expired session can be renewed without a login round-trip. */
  canRefresh(): boolean {
    return !!this.oauthService.getRefreshToken();
  }

  /** Resolves true when a new access token was obtained; never rejects. */
  refresh(): Promise<boolean> {
    if (!this.canRefresh()) {
      return Promise.resolve(false);
    }
    this.refreshing ??= this.doRefresh().finally(() => (this.refreshing = undefined));
    return this.refreshing;
  }

  private async doRefresh(): Promise<boolean> {
    try {
      // The token endpoint comes from the discovery document, which a page outside AuthGuard may not have loaded.
      if (!this.oauthService.discoveryDocumentLoaded) {
        await this.oauthService.loadDiscoveryDocument();
      }
      await this.oauthService.refreshToken();
      return this.oauthService.hasValidAccessToken();
    } catch {
      return false;
    }
  }
}
