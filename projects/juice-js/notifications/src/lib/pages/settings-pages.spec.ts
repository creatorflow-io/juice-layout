import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ContactPoint, Me } from '../models';
import { FakeHub, ME, TENANT, jwt, providers } from '../testing.spec-helpers';
import { NOTIFICATIONS_CONFIG } from '../notifications.config';
import { ContactPointsComponent } from './contact-points/contact-points.component';
import { PreferencesComponent } from './preferences/preferences.component';

const settled = () => new Promise((resolve) => setTimeout(resolve));

function setup<T>(component: Type<T>, config: Record<string, unknown> = {}) {
  // The library's configuration, with the test's own settings over it.
  const base = providers(new FakeHub(), jwt({ platform_tenant: TENANT })).map((p) => {
    const provider = p as { provide?: unknown; useValue?: object };
    return provider.provide === NOTIFICATIONS_CONFIG ? { provide: NOTIFICATIONS_CONFIG, useValue: { ...provider.useValue, ...config } } : p;
  });
  TestBed.configureTestingModule({
    imports: [component],
    providers: [...base, provideNoopAnimations()],
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
    id: 'p1', channel: 'email', address: 'ann@example.com', verified: false, verifiedAt: null, verifiedBy: null, health: 'ok', healthReason: null,
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

  it('adds a phone number for SMS when the tenant sends SMS', async () => {
    const { fixture, page, http } = setup(ContactPointsComponent, { phoneNumbers: true });
    fixture.detectChanges();
    http.expectOne(`${ME}/contact-points`).flush([]);
    await settled();
    page.phone.set(' +84 90 123 4567 ');
    const adding = page.add('sms');
    const post = http.expectOne((r) => r.url === `${ME}/contact-points` && r.method === 'POST');
    expect(post.request.body).toEqual({ channel: 'sms', address: '+84 90 123 4567' });
    post.flush(point({ id: 'p3', channel: 'sms', address: '+84901234567' }));
    await settled();
    http.expectOne((r) => r.url === `${ME}/contact-points` && r.method === 'GET').flush([point({ id: 'p3', channel: 'sms', address: '+84901234567' })]);
    await settled();
    http.expectOne(`${ME}/contact-points/p3/verification`).flush({ expiresAt: '2026-11-17T08:15:00Z' });
    await adding;
    expect(page.emails().map((p) => p.id)).toEqual(['p3']);
    expect(page.phone()).toBe('');
    http.verify();
  });

  it('lists chat accounts apart and links one with a code sent to the bot', async () => {
    const { fixture, page, http } = setup(ContactPointsComponent, { linkChannels: ['telegram'], telegramBot: 'juice_bot' });
    fixture.detectChanges();
    http.expectOne(`${ME}/contact-points`).flush([point()]);
    await settled();
    expect(page.emails().length).toBe(1);
    expect(page.accounts().length).toBe(0);

    const linking = page.linkAccount('telegram');
    const post = http.expectOne(`${ME}/links`);
    expect(post.request.body).toEqual({ channel: 'telegram' });
    post.flush({ channel: 'telegram', code: 'ABCD-EFGH', expiresAt: '2026-11-18T09:15:00Z' });
    await linking;
    expect(page.telegramLink(page.link()!)).toBe('https://t.me/juice_bot?start=ABCDEFGH');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('/start ABCD-EFGH');

    const done = page.linked();
    http.expectOne(`${ME}/contact-points`).flush([point(), point({ id: 'p2', channel: 'telegram', address: '…6789', verified: true, verifiedBy: 'link' })]);
    await done;
    expect(page.accounts().map((p) => p.id)).toEqual(['p2']);
    expect(page.link()).toBeNull();
    http.verify();
  });
});
