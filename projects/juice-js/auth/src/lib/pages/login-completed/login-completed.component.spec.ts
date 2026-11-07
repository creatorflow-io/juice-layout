import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { Subject } from 'rxjs';

import { LoginCompletedComponent, appRelativeUrl } from './login-completed.component';

describe('LoginCompletedComponent', () => {
  const page = '%252Fservices%252F1%253Ftab%253Dcapacity';
  let events: Subject<OAuthEvent>;
  let router: jasmine.SpyObj<Router>;

  function open() {
    events = new Subject<OAuthEvent>();
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    const oauth = jasmine.createSpyObj<OAuthService>('OAuthService', ['loadDiscoveryDocumentAndTryLogin'], { events, state: page });
    oauth.loadDiscoveryDocumentAndTryLogin.and.resolveTo(true);
    TestBed.configureTestingModule({
      declarations: [LoginCompletedComponent],
      providers: [
        { provide: OAuthService, useValue: oauth },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).overrideTemplate(LoginCompletedComponent, '');
    const fixture = TestBed.createComponent(LoginCompletedComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('returns to the page asked for after signing in', fakeAsync(() => {
    open();

    events.next({ type: 'token_received' } as OAuthEvent);
    tick(2000);

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/services/1?tab=capacity');
  }));

  it('does not move the user when the token is later refreshed', fakeAsync(() => {
    open();
    events.next({ type: 'token_received' } as OAuthEvent);
    tick(2000);
    router.navigateByUrl.calls.reset();

    // The library sends token_received for a refresh too.
    events.next({ type: 'token_received' } as OAuthEvent);
    events.next({ type: 'token_refreshed' } as OAuthEvent);
    tick(2000);

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  }));

  it('does not move the user once they have left the page', fakeAsync(() => {
    const fixture = open();
    fixture.destroy();

    events.next({ type: 'token_received' } as OAuthEvent);
    tick(2000);

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  }));

  it('does not send the user anywhere if they leave before the redirect', fakeAsync(() => {
    const fixture = open();
    events.next({ type: 'token_received' } as OAuthEvent);
    tick(1000);
    fixture.destroy();
    tick(1000);

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  }));
});

describe('appRelativeUrl', () => {
  it('keeps only paths of this application', () => {
    expect(appRelativeUrl('/services/1?tab=capacity')).toBe('/services/1?tab=capacity');
    expect(appRelativeUrl('https://elsewhere.example')).toBe('');
    expect(appRelativeUrl('//elsewhere.example')).toBe('');
    expect(appRelativeUrl('/\\elsewhere.example')).toBe('');
  });
});
