import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { NoTenantError, NotificationsApi } from './notifications-api.service';
import { NOTIFICATIONS_CONFIG, tokenClaim } from './notifications.config';
import { API, FakeHub, ME, TENANT, jwt, providers } from './testing.spec-helpers';

describe('NotificationsApi', () => {
  let http: HttpTestingController;

  function setup(token: string | null, tenantId?: string) {
    TestBed.configureTestingModule({ providers: providers(new FakeHub(), token ?? '') });
    if (tenantId) {
      TestBed.overrideProvider(NOTIFICATIONS_CONFIG, { useValue: { apiUrl: API, tenantId, accessToken: () => token } });
    }
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(NotificationsApi);
  }

  beforeEach(() => http = undefined!);
  afterEach(() => http?.verify());

  it('reads the tenant from the token and calls the person\'s API under it', async () => {
    const api = setup(jwt({ platform_tenant: TENANT }));
    expect(api.tenantId()).toBe(TENANT);
    const pending = firstValueFrom(api.inbox({ group: 'approval', unread: true, actionable: false, limit: 20 }));
    const req = http.expectOne((r) => r.url === `${ME}/inbox`);
    // A false flag is left out, as the API defaults it.
    expect(req.request.params.keys().sort()).toEqual(['group', 'limit', 'unread']);
    expect(req.request.params.get('group')).toBe('approval');
    req.flush([]);
    expect(await pending).toEqual([]);
  });

  it('prefers a configured tenant', () => {
    const api = setup(jwt({ platform_tenant: 'other' }), 'configured');
    expect(api.tenantId()).toBe('configured');
  });

  it('fails without a tenant instead of calling', async () => {
    const api = setup(jwt({ sub: 'x' }));
    await expectAsync(firstValueFrom(api.counts())).toBeRejectedWithError(NoTenantError);
    http.expectNone(() => true);
  });

  it('marks read and unread, archives and restores, and reads all', async () => {
    const api = setup(jwt({ platform_tenant: TENANT }));
    api.read('a').subscribe();
    expect(http.expectOne(`${ME}/inbox/a/read`).request.method).toBe('POST');
    api.read('a', false).subscribe();
    expect(http.expectOne(`${ME}/inbox/a/read`).request.method).toBe('DELETE');
    api.archive('a').subscribe();
    expect(http.expectOne(`${ME}/inbox/a/archive`).request.method).toBe('POST');
    api.archive('a', false).subscribe();
    expect(http.expectOne(`${ME}/inbox/a/archive`).request.method).toBe('DELETE');
    const all = firstValueFrom(api.readAll('general'));
    const req = http.expectOne((r) => r.url === `${ME}/inbox/read-all`);
    expect(req.request.params.get('group')).toBe('general');
    req.flush({ marked: 3 });
    expect(await all).toBe(3);
  });

  it('sends only the fields a preference has, and the contact point calls', () => {
    const api = setup(jwt({ platform_tenant: TENANT }));
    api.savePreferences([{ category: 'ops', channel: 'email', mode: 'off', updatedAt: 'x' }]).subscribe();
    expect(http.expectOne(`${ME}/preferences`).request.body).toEqual({ preferences: [{ category: 'ops', channel: 'email', mode: 'off' }] });
    api.addContactPoint('email', 'a@example.com').subscribe();
    expect(http.expectOne(`${ME}/contact-points`).request.body).toEqual({ channel: 'email', address: 'a@example.com' });
    api.sendCode('p 1').subscribe();
    expect(http.expectOne(`${ME}/contact-points/p%201/verification`).request.method).toBe('POST');
    api.verify('p1', '123456').subscribe();
    expect(http.expectOne(`${ME}/contact-points/p1/verify`).request.body).toEqual({ code: '123456' });
  });

  it('reads claims from base64url payloads, including non-ASCII, and nothing from a non-JWT', () => {
    expect(tokenClaim(jwt({ name: 'Nguyễn ÿ' }), 'name')).toBe('Nguyễn ÿ');
    expect(tokenClaim('not-a-token', 'name')).toBeNull();
    expect(tokenClaim(null, 'name')).toBeNull();
    expect(tokenClaim(jwt({ platform_tenant: 1 }), 'platform_tenant')).toBeNull();
  });
});
