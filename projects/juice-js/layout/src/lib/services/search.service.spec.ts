import { TestBed } from '@angular/core/testing';
import { Router, NavigationStart, NavigationCancel, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { SearchService } from './search.service';
import { SearchablePage } from './searchable-page';

/** Minimal page double: the contract is one method. */
function pageSpy(): jasmine.SpyObj<SearchablePage> {
  return jasmine.createSpyObj<SearchablePage>('SearchablePage', ['onSearch']);
}

describe('SearchService', () => {
  let service: SearchService;
  let routerEvents: Subject<any>;

  beforeEach(() => {
    routerEvents = new Subject<any>();
    TestBed.configureTestingModule({
      // Provided so that if anyone reintroduces a router subscription, the regression
      // tests below can observe it. The service must not depend on this.
      providers: [{ provide: Router, useValue: { events: routerEvents } }],
    });
    service = TestBed.inject(SearchService);
  });

  describe('visibility follows the bound page', () => {
    it('is disabled with no page bound (FR-003: default off)', () => {
      expect(service.isEnabled()).toBe(false);
    });

    it('is enabled once a searchable page is bound (FR-002)', () => {
      service.bindPage(pageSpy());
      expect(service.isEnabled()).toBe(true);
    });

    it('stays disabled for a page that declares no support (FR-003)', () => {
      service.bindPage({ somethingElse: () => {} });
      expect(service.isEnabled()).toBe(false);
    });

    it('is disabled again once the page is unbound', () => {
      service.bindPage(pageSpy());
      service.unbindPage();
      expect(service.isEnabled()).toBe(false);
    });

    it('rebinding replaces the previous page', () => {
      const first = pageSpy();
      const second = pageSpy();
      service.bindPage(first);
      service.bindPage(second);
      service.submit('abc');

      expect(second.onSearch).toHaveBeenCalledWith('abc', undefined);
      expect(first.onSearch).not.toHaveBeenCalled();
    });
  });

  describe('input reaches the bound page', () => {
    it('forwards the query and the originating event (FR-004)', () => {
      const page = pageSpy();
      const event = new Event('input');
      service.bindPage(page);

      service.submit('abc', event);

      expect(page.onSearch).toHaveBeenCalledWith('abc', event);
    });

    it('records the query so the box can render it', () => {
      service.bindPage(pageSpy());
      service.submit('abc');
      expect(service.query()).toBe('abc');
    });

    it('is a silent no-op when nothing is bound', () => {
      expect(() => service.submit('abc')).not.toThrow();
    });

    it('never forwards to a page that is no longer displayed (FR-004)', () => {
      const page = pageSpy();
      service.bindPage(page);
      service.unbindPage();

      service.submit('abc');

      expect(page.onSearch).not.toHaveBeenCalled();
    });
  });

  // US2 — the query is scoped to the page that was searched. A leftover query is worse
  // than none: the box shows a term the new page has not actually filtered by.
  describe('query does not leak between pages', () => {
    it('discards the query when the page goes away (FR-005)', () => {
      service.bindPage(pageSpy());
      service.submit('abc');

      service.unbindPage();

      expect(service.query()).toBe('');
    });

    it('starts the next page with an empty box (FR-005)', () => {
      service.bindPage(pageSpy());
      service.submit('abc');

      // Navigate to another searchable page.
      service.unbindPage();
      service.bindPage(pageSpy());

      expect(service.query()).toBe('');
    });

    it('does not carry a legacy page claim past its own page (FR-011)', () => {
      const legacy = jasmine.createSpy('legacyCallback');
      service.enable(legacy);

      service.unbindPage();

      expect(service.isEnabled()).toBe(false);
      service.submit('abc');
      expect(legacy).not.toHaveBeenCalled();
    });
  });

  describe('clearing', () => {
    it('tells the page the query is now empty, not that the box is gone (FR-010)', () => {
      const page = pageSpy();
      service.bindPage(page);
      service.submit('abc');

      service.submit('');

      expect(page.onSearch).toHaveBeenCalledWith('', undefined);
      expect(service.query()).toBe('');
      expect(service.isEnabled()).toBe(true);
    });
  });

  // US3 — regression guards for the defects that motivated this design. The service
  // deliberately does NOT subscribe to router events; only the shell's outlet lifecycle
  // binds and unbinds. These tests fail if that subscription ever comes back.
  describe('router events never revoke search', () => {
    it('survives a navigation that starts (defect D2)', () => {
      const page = pageSpy();
      service.bindPage(page);

      // NavigationStart fires BEFORE guards run. Revoking here was the original bug.
      routerEvents.next(new NavigationStart(1, '/t1/other'));

      expect(service.isEnabled()).toBe(true);
    });

    it('survives a navigation that is cancelled — the user stays put (FR-007, D2)', () => {
      const page = pageSpy();
      service.bindPage(page);

      // A guard denies: the user remains on the current page, so search must remain.
      routerEvents.next(new NavigationStart(1, '/t1/secure'));
      routerEvents.next(new NavigationCancel(1, '/t1/secure', 'guard denied'));

      expect(service.isEnabled()).toBe(true);
      service.submit('abc');
      expect(page.onSearch).toHaveBeenCalledWith('abc', undefined);
    });

    it('survives a tenant switch that reuses the page component (FR-006, D3)', () => {
      const page = pageSpy();
      service.bindPage(page);
      service.submit('abc');

      // /t1/dashboard -> /t2/dashboard is a param-only change: the router reuses the
      // component, so no constructor re-runs and the outlet never deactivates. The old
      // NavigationStart revocation lost the box for the rest of the session here.
      routerEvents.next(new NavigationStart(2, '/t2/dashboard'));
      routerEvents.next(new NavigationEnd(2, '/t2/dashboard', '/t2/dashboard'));

      expect(service.isEnabled()).toBe(true);
      service.submit('def');
      expect(page.onSearch).toHaveBeenCalledWith('def', undefined);
    });
  });

  // The deprecated path must keep working for out-of-repo consumers, including the
  // ordering the outlet actually produces. See research.md Decision 3.
  describe('deprecated enable()/disable()', () => {
    it('still shows the box and receives input', () => {
      const legacy = jasmine.createSpy('legacyCallback');
      service.enable(legacy);

      expect(service.isEnabled()).toBe(true);
      const event = new Event('input');
      service.submit('abc', event);
      expect(legacy).toHaveBeenCalledWith('abc', event);
    });

    it('survives the deactivate -> construct -> activate ordering (FR-011)', () => {
      const legacy = jasmine.createSpy('legacyCallback');

      // Exactly what the outlet does when navigating to a legacy page: the old page is
      // released, the new page's constructor calls enable(), then the outlet activates it.
      // If activation cleared the claim, every legacy caller would silently lose search.
      service.unbindPage();
      service.enable(legacy);
      service.bindPage({ notSearchable: true });

      expect(service.isEnabled()).toBe(true);
      service.submit('abc');
      expect(legacy).toHaveBeenCalledWith('abc', undefined);
    });

    it('prefers the interface when a page provides both', () => {
      const legacy = jasmine.createSpy('legacyCallback');
      const page = pageSpy();
      service.enable(legacy);
      service.bindPage(page);

      service.submit('abc');

      expect(page.onSearch).toHaveBeenCalledWith('abc', undefined);
      expect(legacy).not.toHaveBeenCalled();
    });

    it('disable() still hides the box', () => {
      service.enable(() => {});
      service.disable();
      expect(service.isEnabled()).toBe(false);
    });
  });
});
