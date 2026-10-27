import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OAuthService } from 'angular-oauth2-oidc';
import { firstValueFrom } from 'rxjs';

import { AuthInterceptor } from './auth.interceptor';
import { AuthModuleConfig } from './auth-module.config';
import { appRelativeUrl } from '../pages/login-completed/login-completed.component';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let oauth: jasmine.SpyObj<OAuthService>;
  let token: string | null;

  function setup(config: Partial<AuthModuleConfig>) {
    token = 't1';
    oauth = jasmine.createSpyObj<OAuthService>('OAuthService', [
      'hasValidAccessToken', 'getAccessToken', 'getRefreshToken', 'loadDiscoveryDocument', 'refreshToken',
    ]);
    oauth.hasValidAccessToken.and.callFake(() => !!token);
    oauth.getAccessToken.and.callFake(() => token!);
    oauth.getRefreshToken.and.returnValue(null as never);
    Object.assign(oauth, { issuer: 'https://id.test', tokenEndpoint: 'https://id.test/connect/token', discoveryDocumentLoaded: true });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: OAuthService, useValue: oauth },
        { provide: AuthModuleConfig, useValue: { basePath: 'https://app.test/auth', ...config } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  afterEach(() => backend.verify());

  it('sends the token only to allowedUrls when they are set', async () => {
    setup({ allowedUrls: ['https://api.test/', ''] });
    const expected: Record<string, string | null> = {
      'https://api.test/items': 'Bearer t1',
      '/relative': 'Bearer t1',
      'https://api.test.evil/x': null,
      'https://cdn.test/a.json': null,
    };
    const calls = Object.keys(expected).map((url) => firstValueFrom(http.get(url)));

    for (const [url, authorization] of Object.entries(expected)) {
      const req = backend.expectOne(url);
      expect(req.request.headers.get('Authorization')).withContext(url).toBe(authorization);
      req.flush({});
    }
    await Promise.all(calls);
  });

  it('sends the token to the app\'s own origin only when allowedUrls is unset', async () => {
    setup({});
    const expected: Record<string, string | null> = {
      '/api/items': 'Bearer t1',
      [`${window.location.origin}/api/items`]: 'Bearer t1',
      'https://cdn.test/a.json': null,
    };
    const calls = Object.keys(expected).map((url) => firstValueFrom(http.get(url)));

    for (const [url, authorization] of Object.entries(expected)) {
      const req = backend.expectOne(url);
      expect(req.request.headers.get('Authorization')).withContext(url).toBe(authorization);
      req.flush({});
    }
    await Promise.all(calls);
  });

  it('sends the token everywhere with allowedUrls [\'*\'] (the pre-2.0 behaviour), warning in dev mode', async () => {
    const warn = spyOn(console, 'warn');
    setup({ allowedUrls: ['*'] });
    const call = firstValueFrom(http.get('https://cdn.test/a.json'));

    const req = backend.expectOne('https://cdn.test/a.json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer t1');
    req.flush({});
    await call;
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('renews the token and retries once on 401 when a refresh token is stored', async () => {
    setup({ allowedUrls: ['https://api.test'] });
    oauth.getRefreshToken.and.returnValue('r1');
    oauth.refreshToken.and.callFake(async () => {
      token = 't2';
      return {} as never;
    });
    const call = firstValueFrom(http.get('https://api.test/items'));

    backend.expectOne('https://api.test/items').flush('', { status: 401, statusText: 'Unauthorized' });
    await new Promise((resolve) => setTimeout(resolve));

    const retry = backend.expectOne('https://api.test/items');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer t2');
    retry.flush({ ok: true });
    expect(await call).toEqual({ ok: true });
    expect(oauth.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('passes a 401 through when there is no refresh token', async () => {
    setup({ allowedUrls: ['https://api.test'] });
    const call = firstValueFrom(http.get('https://api.test/items'));

    backend.expectOne('https://api.test/items').flush('', { status: 401, statusText: 'Unauthorized' });

    await expectAsync(call).toBeRejected();
  });
});

describe('appRelativeUrl', () => {
  it('follows only paths of this application', () => {
    expect(appRelativeUrl('/orders/1?tab=lines')).toBe('/orders/1?tab=lines');
    expect(appRelativeUrl('https://evil.test/')).toBe('');
    expect(appRelativeUrl('//evil.test/')).toBe('');
    expect(appRelativeUrl('/\\evil.test/')).toBe('');
  });
});
