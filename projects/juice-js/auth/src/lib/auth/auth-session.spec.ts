import { TestBed } from '@angular/core/testing';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { Subject } from 'rxjs';

import { AuthSession } from './auth-session';

describe('AuthSession', () => {
  let oauth: jasmine.SpyObj<OAuthService>;
  let events: Subject<OAuthEvent>;
  let state: { access: boolean; refresh: string | null; claims: object | null; token: string | null };

  function create(): AuthSession {
    events = new Subject<OAuthEvent>();
    oauth = jasmine.createSpyObj<OAuthService>('OAuthService',
      ['hasValidAccessToken', 'getRefreshToken', 'getIdentityClaims', 'getAccessToken'], { events });
    oauth.hasValidAccessToken.and.callFake(() => state.access);
    oauth.getRefreshToken.and.callFake(() => state.refresh as string);
    oauth.getIdentityClaims.and.callFake(() => state.claims as Record<string, unknown>);
    oauth.getAccessToken.and.callFake(() => state.token as string);
    TestBed.configureTestingModule({ providers: [{ provide: OAuthService, useValue: oauth }] });
    return TestBed.inject(AuthSession);
  }

  beforeEach(() => (state = { access: false, refresh: null, claims: null, token: null }));

  it('reports sign-in and sign-out as changes, but not the user restored at start-up', () => {
    state = { access: true, refresh: null, claims: { sub: 'alice' }, token: 'x' };
    const session = create();
    const changes: (string | null)[] = [];
    session.changes.subscribe((key) => changes.push(key));

    expect(session.userKey).toBe('alice');

    state = { access: false, refresh: null, claims: null, token: null };
    events.next({ type: 'logout' } as OAuthEvent);
    state = { access: true, refresh: null, claims: { sub: 'bob' }, token: 'y' };
    events.next({ type: 'token_received' } as OAuthEvent);

    expect(changes).toEqual([null, 'bob']);
  });

  it('does not report a token renewal for the same user', () => {
    state = { access: true, refresh: 'r', claims: { sub: 'alice' }, token: 'x' };
    const session = create();
    const changes: (string | null)[] = [];
    session.changes.subscribe((key) => changes.push(key));

    events.next({ type: 'token_refreshed' } as OAuthEvent);

    expect(changes).toEqual([]);
  });

  it('treats an expired session that can be refreshed as still signed in', () => {
    state = { access: false, refresh: 'r', claims: { sub: 'alice' }, token: null };

    expect(create().userKey).toBe('alice');
  });

  it('falls back to the access token\'s sub without identity claims', () => {
    const payload = btoa(JSON.stringify({ sub: 'carol' })).replace(/=+$/, '');
    state = { access: true, refresh: null, claims: null, token: `h.${payload}.s` };

    expect(create().userKey).toBe('carol');
  });
});
