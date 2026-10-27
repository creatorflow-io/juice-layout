import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthModuleConfig } from './auth-module.config';
import { AuthTokenRefresher } from './auth-token-refresher';

let warnedUnrestricted = false;

/**
 * Adds `Authorization: Bearer …` to requests for {@link AuthModuleConfig.allowedUrls} (the app's own origin when that
 * is unset). With a refresh token stored, an expired token is renewed before the request, and a 401 renews it and
 * retries once.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: OAuthService, private options: AuthModuleConfig, private refresher: AuthTokenRefresher) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isAllowed(req.url)) {
      return next.handle(req);
    }

    const send = () => next.handle(this.withToken(req));
    if (this.isIdentityServer(req.url)) {
      // The discovery and token requests the refresh itself makes: renewing here would wait on itself.
      return send();
    }
    const first$ = !this.auth.hasValidAccessToken() && this.refresher.canRefresh()
      ? from(this.refresher.refresh()).pipe(switchMap(send))
      : send();

    return first$.pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && this.refresher.canRefresh()) {
          return from(this.refresher.refresh()).pipe(
            switchMap((renewed) => renewed ? send() : throwError(() => error))
          );
        }
        return throwError(() => error);
      })
    );
  }

  private withToken(req: HttpRequest<any>): HttpRequest<any> {
    if (!this.auth.hasValidAccessToken()) {
      return req;
    }
    // Clone the request and replace the original headers with cloned headers, updated with the authorization.
    return req.clone({
      headers: req.headers.set('Authorization', `Bearer ${this.auth.getAccessToken()}`)
    });
  }

  private isIdentityServer(url: string): boolean {
    const urls = [this.auth.issuer, this.auth.tokenEndpoint].filter((u): u is string => !!u);
    return urls.some((u) => matches(url, u));
  }

  private isAllowed(url: string): boolean {
    const allowed = this.options?.allowedUrls ?? ['', ownOrigin()];
    if (allowed.includes('*')) {
      if (isDevMode() && !warnedUnrestricted) {
        warnedUnrestricted = true;
        console.warn('[@juice-js/auth] AuthModuleConfig.allowedUrls is [\'*\']: the access token is sent with every '
          + 'request, to any host. List the APIs that should receive it instead.');
      }
      return true;
    }
    return allowed.some((base) => matches(url, base));
  }
}

/** The default allow-list's absolute entry; empty outside a browser, which leaves relative URLs only. */
function ownOrigin(): string {
  return typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
}

/** `url` is `base` or continues it with `/` or `?`; an empty base (the app's own origin) matches relative URLs only. */
function matches(url: string, base: string): boolean {
  if (!base) {
    return !/^[a-z][a-z0-9+.-]*:\/\//i.test(url) && !url.startsWith('//');
  }
  const trimmed = base.replace(/\/+$/, '');
  return url === trimmed || url.startsWith(trimmed + '/') || url.startsWith(trimmed + '?');
}
