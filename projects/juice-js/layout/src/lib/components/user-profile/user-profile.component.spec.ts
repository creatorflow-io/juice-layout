import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslatePipe } from '@ngx-translate/core';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { Subject } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserProfileComponent } from './user-profile.component';
import { IS_PRODUCTION } from '../../layout.config';
import { LayoutService } from '../../layout.service';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let oauth: jasmine.SpyObj<OAuthService>;
  let events: Subject<OAuthEvent>;
  let signedIn: boolean;

  beforeEach(() => {
    signedIn = false;
    events = new Subject<OAuthEvent>();
    oauth = jasmine.createSpyObj<OAuthService>('OAuthService',
      ['hasValidAccessToken', 'hasValidIdToken', 'getIdentityClaims', 'loadDiscoveryDocument', 'initLoginFlow', 'loadUserProfile'],
      { events });
    oauth.hasValidAccessToken.and.callFake(() => signedIn);
    oauth.getIdentityClaims.and.returnValue({ name: 'Ada Lovelace', picture: 'https://img.test/ada.png' });
    Object.assign(oauth, { discoveryDocumentLoaded: true });

    TestBed.configureTestingModule({
      declarations: [UserProfileComponent],
      imports: [MatIconModule, MatButtonModule, TranslatePipe],
      providers: [
        { provide: IS_PRODUCTION, useValue: true },
        { provide: OAuthService, useValue: oauth },
        { provide: LayoutService, useValue: { userImageUrl: (u: string) => `/avatar/${u}` } },
        provideRouter([]),
        provideTranslateService(),
      ],
    });
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const host = () => fixture.nativeElement as HTMLElement;

  it('shows a Login button while anonymous that starts the code flow back to the current route', async () => {
    expect(host().querySelector('.login-button')).toBeTruthy();
    expect(host().classList).toContain('anonymous');

    await component.login();

    expect(oauth.initLoginFlow).toHaveBeenCalledWith('/');
  });

  it('switches to the avatar when a token arrives, and back on logout', () => {
    signedIn = true;
    events.next({ type: 'token_received' } as OAuthEvent);
    fixture.detectChanges();

    expect(host().querySelector('.login-button')).toBeNull();
    expect(host().querySelector('img')?.getAttribute('src')).toBe('https://img.test/ada.png');
    expect(host().classList).not.toContain('anonymous');

    signedIn = false;
    events.next({ type: 'logout' } as OAuthEvent);
    fixture.detectChanges();

    expect(host().querySelector('.login-button')).toBeTruthy();
  });
});
