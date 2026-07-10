import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { firstValueFrom, isObservable, Observable } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthModuleConfig } from './auth-module.config';
import { TenantService } from '@juice-js/core';

/**
 * Auth-flow verification for the Angular 22 / angular-oauth2-oidc@22 upgrade.
 *
 * These specs exercise the AuthGuard's authorization decisions against a mocked
 * OAuthService, covering the three flow outcomes:
 *   1. valid session   -> allow / role+tenant checks
 *   2. no session       -> run loadDiscoveryDocumentAndTryLogin (the OIDC callback),
 *                          then re-evaluate
 *   3. still no session -> redirect to /login carrying the returnUrl
 *
 * They do NOT hit a real identity provider, so the OIDC token exchange / nonce
 * validation itself is out of scope here (that requires a live IdP round-trip).
 */
describe('AuthGuard (auth flow, Angular 22 / oauth2-oidc@22)', () => {
  let guard: AuthGuard;
  let oauth: jasmine.SpyObj<OAuthService>;
  let router: jasmine.SpyObj<Router>;

  // basePath is fed to `new URL(...).pathname`, so it must be an absolute URL.
  const config = { basePath: 'https://app.example.com/portal' } as AuthModuleConfig;
  const state = { url: '/secure/page' } as RouterStateSnapshot;

  // mutable session flag so hasValidToken() reflects tryLogin() side effects
  let sessionValid = false;

  const routeWithRoles = (roles?: unknown): ActivatedRouteSnapshot =>
    ({ data: { roles } } as unknown as ActivatedRouteSnapshot);

  beforeEach(() => {
    sessionValid = false;

    oauth = jasmine.createSpyObj<OAuthService>('OAuthService', [
      'hasValidAccessToken',
      'hasValidIdToken',
      'getIdentityClaims',
      'loadDiscoveryDocumentAndTryLogin',
    ]);
    oauth.hasValidAccessToken.and.callFake(() => sessionValid);
    oauth.hasValidIdToken.and.callFake(() => sessionValid);
    oauth.getIdentityClaims.and.returnValue({} as object);
    // default: the OIDC callback does not establish a session
    oauth.loadDiscoveryDocumentAndTryLogin.and.callFake(async () => false);

    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake(
      (commands: unknown[], extras?: unknown) =>
        ({ __urlTree: true, commands, extras } as unknown as UrlTree)
    );

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: OAuthService, useValue: oauth },
        { provide: Router, useValue: router },
        { provide: AuthModuleConfig, useValue: config },
        { provide: TenantService, useValue: null },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  async function resolve(result: unknown): Promise<unknown> {
    return isObservable(result) ? firstValueFrom(result as Observable<unknown>) : result;
  }

  it('derives the base path from the configured basePath URL', () => {
    expect(guard.path).toBe('/portal');
  });

  it('allows access when a valid session and a permitted role are present', async () => {
    sessionValid = true;
    oauth.getIdentityClaims.and.returnValue({ role: 'admin' });

    const result = await resolve(guard.canActivate(routeWithRoles(['admin']), state));

    expect(result).toBe(true);
    // an already-valid session must not trigger the OIDC callback
    expect(oauth.loadDiscoveryDocumentAndTryLogin).not.toHaveBeenCalled();
  });

  it('redirects to /unauthorized when the session is valid but the role is not permitted', async () => {
    sessionValid = true;
    oauth.getIdentityClaims.and.returnValue({ role: 'guest' });

    const result = await resolve(guard.canActivate(routeWithRoles(['admin']), state));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/portal/unauthorized']);
    expect((result as { __urlTree?: boolean }).__urlTree).toBeTrue();
  });

  it('allows access when no roles are required on the route', async () => {
    sessionValid = true;
    oauth.getIdentityClaims.and.returnValue({ role: 'anyone' });

    const result = await resolve(guard.canActivate(routeWithRoles(undefined), state));

    expect(result).toBe(true);
  });

  it('runs the OIDC callback then redirects to /login with returnUrl when no session is established', async () => {
    // sessionValid stays false; tryLogin resolves without a session
    const result = await resolve(guard.canActivate(routeWithRoles(['admin']), state));

    expect(oauth.loadDiscoveryDocumentAndTryLogin).toHaveBeenCalledTimes(1);
    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/portal/login'],
      { queryParams: { returnUrl: '/secure/page' } }
    );
    expect((result as { __urlTree?: boolean }).__urlTree).toBeTrue();
  });

  it('completes the login callback: no session -> tryLogin establishes it -> access allowed', async () => {
    oauth.loadDiscoveryDocumentAndTryLogin.and.callFake(async () => {
      sessionValid = true; // the callback exchanged the code/token successfully
      return true;
    });
    oauth.getIdentityClaims.and.returnValue({ role: 'admin' });

    const result = await resolve(guard.canActivate(routeWithRoles(['admin']), state));

    expect(oauth.loadDiscoveryDocumentAndTryLogin).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('after a successful callback, still blocks a user whose role is not permitted', async () => {
    oauth.loadDiscoveryDocumentAndTryLogin.and.callFake(async () => {
      sessionValid = true;
      return true;
    });
    oauth.getIdentityClaims.and.returnValue({ role: 'guest' });

    const result = await resolve(guard.canActivate(routeWithRoles(['admin']), state));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/portal/unauthorized']);
    expect((result as { __urlTree?: boolean }).__urlTree).toBeTrue();
  });

  it('supports array-valued role claims (grants when any role matches)', async () => {
    sessionValid = true;
    oauth.getIdentityClaims.and.returnValue({ role: ['editor', 'admin'] });

    const result = await resolve(guard.canActivate(routeWithRoles(['admin']), state));

    expect(result).toBe(true);
  });
});
