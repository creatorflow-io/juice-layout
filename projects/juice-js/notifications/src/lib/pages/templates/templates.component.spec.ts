import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FakeHub, TENANT, jwt, providers } from '../../testing.spec-helpers';
import { TemplatesComponent } from './templates.component';

const settled = () => new Promise((resolve) => setTimeout(resolve));

describe('TemplatesComponent', () => {
  const base = (url: string) => url.includes(`/tenants/${TENANT}/`) && !url.includes('/me');

  it('loads a type\'s template, previews it with sample data, saves it, and removes it', async () => {
    TestBed.configureTestingModule({
      imports: [TemplatesComponent],
      providers: [...providers(new FakeHub(), jwt({ platform_tenant: TENANT })), provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(TemplatesComponent);
    const page = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne((r) => base(r.url) && r.url.endsWith('/types')).flush([
      { key: 'ci.build', name: 'Build', version: 2, application: 'ci', channels: [
        { channel: 'email', declared: true, overridden: false }, { channel: 'sms', declared: false, overridden: false }] },
    ]);
    await settled();

    const picking = page.pickType('ci.build');
    expect(page.channels().map((c) => c.channel)).toEqual(['email']);
    http.expectOne((r) => r.url.endsWith('/types/ci.build/templates/email')).flush({
      type: 'ci.build', typeVersion: 2, channel: 'email', locale: 'en', application: 'Subject: Build {{ data.n }}', tenant: null, tenantVersion: null, updatedAt: null,
    });
    await settled();
    const preview = http.expectOne((r) => r.url.endsWith('/templates/preview'));
    expect(preview.request.body).toEqual({ type: 'ci.build', channel: 'email', body: 'Subject: Build {{ data.n }}', data: null });
    preview.flush({ channel: 'email', content: { Subject: 'Build 1' }, error: null, data: { n: 1 } });
    await picking;
    expect(page.body()).toBe('Subject: Build {{ data.n }}');
    expect(JSON.parse(page.data())).toEqual({ n: 1 });

    page.body.set('Subject: Ours {{ data.n }}');
    const saving = page.save();
    const put = http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/types/ci.build/templates/email'));
    expect(put.request.body).toEqual({ body: 'Subject: Ours {{ data.n }}' });
    put.flush({ type: 'ci.build', typeVersion: 2, channel: 'email', locale: 'en', application: 'Subject: Build {{ data.n }}', tenant: 'Subject: Ours {{ data.n }}',
      tenantVersion: 1, updatedAt: 'x' });
    await saving;
    expect(page.saved()).toBeTrue();
    expect(page.types()[0].channels[0].overridden).toBeTrue();

    const removing = page.remove();
    http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/types/ci.build/templates/email')).flush(null);
    await settled();
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/types/ci.build/templates/email')).flush({
      type: 'ci.build', typeVersion: 2, channel: 'email', locale: 'en', application: 'Subject: Build {{ data.n }}', tenant: null, tenantVersion: null, updatedAt: null,
    });
    await settled();
    http.expectOne((r) => r.url.endsWith('/templates/preview')).flush({ channel: 'email', content: { Subject: 'Build 1' }, error: null, data: { n: 1 } });
    await removing;
    expect(page.body()).toBe('Subject: Build {{ data.n }}');
    expect(page.types()[0].channels[0].overridden).toBeFalse();
    http.verify();
  });
});
