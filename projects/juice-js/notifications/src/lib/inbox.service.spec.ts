import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { InboxService } from './inbox.service';
import { API, FakeHub, ME, TENANT, counts, item, jwt, providers } from './testing.spec-helpers';

describe('InboxService', () => {
  let http: HttpTestingController;
  let hub: FakeHub;
  let inbox: InboxService;

  function start(token = jwt({ platform_tenant: TENANT })) {
    hub = new FakeHub();
    TestBed.configureTestingModule({ providers: providers(hub, token) });
    http = TestBed.inject(HttpTestingController);
    inbox = TestBed.inject(InboxService);
    inbox.start();
  }

  /** Answers the counts and a page of the inbox. */
  function answer(unread: number, page: ReturnType<typeof item>[], query: Record<string, string> = {}) {
    http.expectOne(`${ME}/inbox/counts`).flush(counts(unread));
    const req = http.expectOne((r) => r.url === `${ME}/inbox`);
    for (const [key, value] of Object.entries(query)) {
      expect(req.request.params.get(key)).toBe(value);
    }
    req.flush(page);
  }

  afterEach(() => http.verify());

  const settled = () => new Promise((resolve) => setTimeout(resolve));

  it('loads the counts and the first page, and connects to the hub for the token\'s tenant', () => {
    start();
    answer(2, [item('a'), item('b')], { limit: '2' });
    expect(inbox.unread()).toBe(2);
    expect(inbox.items().map((i) => i.id)).toEqual(['a', 'b']);
    expect(inbox.hasMore()).toBeTrue();
    expect(hub.last.url).toBe(`${API}/hubs/inbox`);
    expect(hub.last.tenant).toBe(TENANT);
    // Started once, however often it is asked.
    inbox.start();
    expect(hub.connections.length).toBe(1);
  });

  it('waits for a tenant before starting', () => {
    start(jwt({ sub: 'nobody' }));
    http.expectNone(() => true);
    expect(hub.connections.length).toBe(0);
  });

  it('pages on from the last item', () => {
    start();
    answer(3, [item('a'), item('b')]);
    inbox.loadMore();
    const req = http.expectOne((r) => r.url === `${ME}/inbox`);
    expect(req.request.params.get('before')).toBe('b');
    req.flush([item('c')]);
    expect(inbox.items().map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(inbox.hasMore()).toBeFalse();
  });

  it('shows a group or the actionable items, reloading the first page', () => {
    start();
    answer(1, [item('a')]);
    inbox.showGroup('approval');
    http.expectOne((r) => r.url === `${ME}/inbox` && r.params.get('group') === 'approval').flush([item('x', { group: 'approval' })]);
    inbox.showActionableOnly(true);
    http.expectOne((r) => r.url === `${ME}/inbox` && r.params.get('actionable') === 'true' && r.params.get('group') === 'approval').flush([]);
    expect(inbox.items()).toEqual([]);
  });

  it('marks an item read at once, then as the API answers, and reloads the counts', async () => {
    start();
    answer(1, [item('a')]);
    const done = inbox.markRead(inbox.items()[0]);
    expect(inbox.items()[0].readAt).not.toBeNull();
    http.expectOne(`${ME}/inbox/a/read`).flush(item('a', { readAt: '2026-11-17T09:00:00Z' }));
    await done;
    http.expectOne(`${ME}/inbox/counts`).flush(counts(0));
    expect(inbox.items()[0].readAt).toBe('2026-11-17T09:00:00Z');
    expect(inbox.unread()).toBe(0);
  });

  it('puts the server\'s state back when a change fails', async () => {
    start();
    answer(1, [item('a')]);
    const done = inbox.archive(inbox.items()[0]);
    expect(inbox.items()).toEqual([]);
    http.expectOne(`${ME}/inbox/a/archive`).flush({ code: 'not_found' }, { status: 404, statusText: 'Not Found' });
    await done;
    answer(1, [item('a')]);
    expect(inbox.items().map((i) => i.id)).toEqual(['a']);
    expect(inbox.error()).toBeNull();
  });

  it('follows the hub: added reloads, changed refreshes the items shown, reconnected reloads', async () => {
    start();
    answer(1, [item('a'), item('b')]);
    hub.last.handlers.changed({ kind: 'added', items: ['n'] });
    answer(2, [item('n'), item('a')]);
    expect(inbox.items()[0].id).toBe('n');

    // Read elsewhere: only the item shown is fetched again; another isn't.
    hub.last.handlers.changed({ kind: 'changed', items: ['a', 'elsewhere'] });
    http.expectOne(`${ME}/inbox/counts`).flush(counts(1));
    http.expectOne(`${ME}/inbox/a`).flush(item('a', { readAt: '2026-11-17T09:00:00Z' }));
    await settled();
    expect(inbox.items().find((i) => i.id === 'a')!.readAt).not.toBeNull();

    // Archived elsewhere: it leaves the open items.
    hub.last.handlers.changed({ kind: 'changed', items: ['n'] });
    http.expectOne(`${ME}/inbox/counts`).flush(counts(1));
    http.expectOne(`${ME}/inbox/n`).flush(item('n', { archivedAt: '2026-11-17T09:00:00Z' }));
    await settled();
    expect(inbox.items().map((i) => i.id)).toEqual(['a']);

    hub.last.handlers.reconnected();
    answer(0, [item('a')]);
  });

  it('stops: the hub closes and the state clears', () => {
    start();
    answer(1, [item('a')]);
    inbox.stop();
    expect(hub.last.stopped).toBeTrue();
    expect(inbox.items()).toEqual([]);
    expect(inbox.unread()).toBe(0);
  });
});
