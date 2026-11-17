import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ContactPoint, Me } from '../models';
import { FakeHub, ME, TENANT, jwt, providers } from '../testing.spec-helpers';
import { ContactPointsComponent } from './contact-points/contact-points.component';
import { PreferencesComponent } from './preferences/preferences.component';

const settled = () => new Promise((resolve) => setTimeout(resolve));

function setup<T>(component: Type<T>) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [...providers(new FakeHub(), jwt({ platform_tenant: TENANT })), provideNoopAnimations()],
  });
  const fixture = TestBed.createComponent(component);
  return { fixture, page: fixture.componentInstance, http: TestBed.inject(HttpTestingController) };
}

const me: Me = { id: 's', source: 'oidc', externalId: 'ann', name: 'Ann', locale: null, timeZone: 'Asia/Ho_Chi_Minh', quietHours: null };

describe('PreferencesComponent', () => {
  it('loads the preferences, saves them whole, and saves or clears quiet hours', async () => {
    const { fixture, page, http } = setup(PreferencesComponent);
    fixture.detectChanges();
    http.expectOne(`${ME}/preferences`).flush([{ category: 'ops', channel: '*', mode: 'off', updatedAt: 'x' }]);
    http.expectOne(ME).flush(me);
    await settled();
    expect(page.rows().length).toBe(1);
    // No quiet hours yet: a default in the person's own zone, off.
    expect(page.quietOn()).toBeFalse();
    expect(page.quiet()!.timeZone).toBe('Asia/Ho_Chi_Minh');

    page.add();
    page.update(1, { category: 'billing', channel: 'email', mode: 'digest' });
    const saving = page.savePreferences();
    const put = http.expectOne(`${ME}/preferences`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.preferences).toEqual([
      { category: 'ops', channel: '*', mode: 'off' }, { category: 'billing', channel: 'email', mode: 'digest' }]);
    put.flush(put.request.body.preferences);
    await saving;
    expect(page.message()).toBe('Preferences saved.');

    // Every day but Sunday; then Sunday again, which is every day: no list.
    page.toggleDay('sun', false);
    expect(page.quiet()!.days).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    page.toggleDay('sun', true);
    expect(page.quiet()!.days).toBeNull();

    page.quietOn.set(true);
    const quiet = page.saveQuietHours();
    const set = http.expectOne(`${ME}/quiet-hours`);
    expect(set.request.method).toBe('PUT');
    expect(set.request.body).toEqual({ days: null, start: '22:00', end: '07:00', timeZone: 'Asia/Ho_Chi_Minh' });
    set.flush(set.request.body);
    await quiet;

    page.quietOn.set(false);
    const cleared = page.saveQuietHours();
    const clear = http.expectOne(`${ME}/quiet-hours`);
    expect(clear.request.method).toBe('DELETE');
    clear.flush(null);
    await cleared;
  });

  it('shows the API\'s field errors', async () => {
    const { fixture, page, http } = setup(PreferencesComponent);
    fixture.detectChanges();
    http.expectOne(`${ME}/preferences`).flush([]);
    http.expectOne(ME).flush(me);
    await settled();
    const saving = page.savePreferences();
    http.expectOne(`${ME}/preferences`).flush(
      { status: 400, code: 'invalid_configuration', errors: [{ pointer: '/preferences/0/mode', message: 'A mode is on, off or digest.' }] },
      { status: 400, statusText: 'Bad Request' });
    await saving;
    expect(page.error()).toBe('A mode is on, off or digest.');
  });
});

describe('ContactPointsComponent', () => {
  const point = (change: Partial<ContactPoint> = {}): ContactPoint => ({
    id: 'p1', channel: 'email', address: 'ann@example.com', verified: false, verifiedAt: null, verifiedBy: null, health: 'Ok', healthReason: null,
    createdAt: '2026-11-17T08:00:00Z', ...change,
  });

  it('adds an address and sends it a code, then verifies it', async () => {
    const { fixture, page, http } = setup(ContactPointsComponent);
    fixture.detectChanges();
    http.expectOne(`${ME}/contact-points`).flush([]);
    await settled();

    page.address.set(' ann@example.com ');
    const adding = page.add();
    const post = http.expectOne((r) => r.url === `${ME}/contact-points` && r.method === 'POST');
    expect(post.request.body).toEqual({ channel: 'email', address: 'ann@example.com' });
    post.flush(point());
    await settled();
    http.expectOne((r) => r.url === `${ME}/contact-points` && r.method === 'GET').flush([point()]);
    await settled();
    http.expectOne(`${ME}/contact-points/p1/verification`).flush({ expiresAt: '2026-11-17T08:15:00Z' });
    await adding;
    expect(page.sent()['p1']).toBe('2026-11-17T08:15:00Z');

    page.setCode('p1', '123456');
    const verifying = page.verify(page.points()[0]);
    const verify = http.expectOne(`${ME}/contact-points/p1/verify`);
    expect(verify.request.body).toEqual({ code: '123456' });
    verify.flush(point({ verified: true }));
    await settled();
    http.expectOne(`${ME}/contact-points`).flush([point({ verified: true })]);
    await verifying;
    expect(page.points()[0].verified).toBeTrue();
    expect(page.sent()['p1']).toBeUndefined();
    http.verify();
  });
});
