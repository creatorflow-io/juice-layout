import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MenuItem, Menus, TenantService } from '@juice-js/core';
import { LayoutConfig } from '../layout.config';
import { PageSwitcherService, flatten } from './page-switcher.service';

const menus: Menus = [
  { id: 'overview', label: 'Overview', icon: 'dashboard', routerLink: '', shortcut: 'g o' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', routerLink: ':tenant/dashboard' },
  { id: 'services', label: 'Services', icon: 'hub', routerLink: '/services', shortcut: 'g s' },
  { id: 'configure', label: 'Configure', icon: 'tune', routerLink: '/rules', replaceChildRouterLink: false, children: [
    { id: 'rules', label: 'Rules', icon: 'rule', routerLink: '/rules' },
    { id: 'silences', label: 'Silences', icon: 'notifications_paused', routerLink: '/silences' },
  ] },
  { id: 'settings', label: 'Settings', icon: 'settings', routerLink: '/settings', children: [
    { id: 'users', label: 'Users', icon: 'person', routerLink: '/settings/users' },
  ] },
  { id: 'security', label: 'Security', icon: 'lock', routerLink: '', children: [
    { id: 'roles', label: 'Roles', icon: 'badge', routerLink: '/roles' },
  ] },
  { id: 'load-runs', label: 'Load runs', icon: 'speed', routerLink: '/load-runs', inMenu: false },
];

function key(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, composed: true, ...init });
  target.dispatchEvent(e);
  return e;
}

/** Runs `body` with `el` in the page. */
function within(el: HTMLElement, body: () => void) {
  document.body.appendChild(el);
  try { body(); } finally { el.remove(); }
}

describe('PageSwitcherService', () => {
  let service: PageSwitcherService;
  let navigate: jasmine.Spy;
  let detach: () => void;

  /** As the side menu hands them over: groups resolved (MenuService does it as it loads their children), top-level pages as written. */
  function loaded(): MenuItem[] {
    return menus.map(m => new MenuItem(m)).map(i => { if (i.hasChildren()) i.injectTenant('acme'); return i; });
  }

  async function setup(config?: LayoutConfig, attach = true) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TenantService, useValue: { getTenantIdentifier: async () => 'acme' } },
        ...(config ? [{ provide: LayoutConfig, useValue: config }] : []),
      ],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    service = TestBed.inject(PageSwitcherService);
    await service.setItems(loaded());
    detach = attach ? service.attach() : () => {};
  }

  afterEach(() => { detach?.(); TestBed.resetTestingModule(); });

  it('offers every page: groups as their pages, hidden ones too, a group with a page of its own as well', () => {
    expect(flatten(loaded(), 'acme').map(p => `${p.label}${p.group ? ' · ' + p.group : ''} ${p.routerLink}`)).toEqual([
      'Overview /', 'Dashboard /acme/dashboard', 'Services /services', 'Rules · Configure /rules', 'Silences · Configure /silences',
      'Settings /settings', 'Users · Settings /settings/users', 'Roles · Security /roles', 'Load runs /load-runs',
    ]);
  });

  it('ranks what starts with the query first, then word starts, then contains, then the group', async () => {
    await setup();
    expect(service.filter('s').map(p => p.label)).toEqual(['Services', 'Silences', 'Settings', 'Dashboard', 'Rules', 'Users', 'Roles', 'Load runs']);
    expect(service.filter('runs').map(p => p.label)).toEqual(['Load runs']);
    expect(service.filter('config').map(p => p.label)).toEqual(['Rules', 'Silences']);
    expect(service.filter('zzz')).toEqual([]);
    expect(service.filter('  ').length).toBe(9);
  });

  it('Ctrl+K and ⌘K open and close it, also from a field', async () => {
    await setup();
    const e = key('k', { ctrlKey: true });
    expect(e.defaultPrevented).toBeTrue();
    expect(service.isOpen()).toBeTrue();
    key('k', { metaKey: true });
    expect(service.isOpen()).toBeFalse();
    within(document.createElement('input'), () => {
      key('k', { ctrlKey: true }, document.body.lastElementChild!);
      expect(service.isOpen()).toBeTrue();
    });
  });

  it('leaves an editor its own Ctrl+K', async () => {
    await setup();
    within(document.createElement('textarea'), () => {
      key('k', { ctrlKey: true }, document.body.lastElementChild!);
      expect(service.isOpen()).toBeFalse();
    });
    const handled = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true });
    handled.preventDefault();
    document.body.dispatchEvent(handled);
    expect(service.isOpen()).toBeFalse();
  });

  it('goes to a page by its keys', async () => {
    await setup();
    key('g');
    key('s');
    expect(navigate).toHaveBeenCalledWith('/services');
  });

  it('a key that breaks a sequence starts a new one', async () => {
    await setup();
    key('g');
    key('g');
    key('s');
    expect(navigate).toHaveBeenCalledWith('/services');
  });

  it('goes home by its keys', async () => {
    await setup();
    key('g');
    key('o');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('a shortcut that starts a longer one waits for it, then goes', fakeAsync(() => {
    setup();
    flushMicrotasks();
    service.setItems([
      new MenuItem({ id: 'a', label: 'A', icon: 'x', routerLink: '/a', shortcut: 'g' }),
      new MenuItem({ id: 'b', label: 'B', icon: 'x', routerLink: '/b', shortcut: 'g b' }),
    ]);
    flushMicrotasks();
    key('g');
    key('b');
    expect(navigate).toHaveBeenCalledWith('/b');
    navigate.calls.reset();
    key('g');
    expect(navigate).not.toHaveBeenCalled();
    tick(2000);
    expect(navigate).toHaveBeenCalledWith('/a');
  }));

  it('forgets a started sequence after a pause', fakeAsync(() => {
    setup();
    flushMicrotasks();
    key('g');
    tick(2000);
    key('s');
    expect(navigate).not.toHaveBeenCalled();
  }));

  it('leaves keys typed into a field, or a widget that takes letters, alone', async () => {
    await setup();
    const select = document.createElement('div');
    select.setAttribute('role', 'combobox');
    select.tabIndex = 0;
    for (const el of [document.createElement('input'), select]) {
      within(el, () => {
        key('g', {}, el);
        key('s', {}, el);
      });
    }
    expect(navigate).not.toHaveBeenCalled();
  });

  it('looks inside a web component for the field the keys go to', async () => {
    await setup();
    const host = document.createElement('div');
    const input = document.createElement('input');
    host.attachShadow({ mode: 'open' }).appendChild(input);
    within(host, () => {
      key('g', {}, input);
      key('s', {}, input);
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('leaves the keys to a menu, tree or grid, also when focus is on an item inside', async () => {
    await setup();
    for (const role of ['menu', 'tree', 'grid']) {
      const widget = document.createElement('div');
      widget.setAttribute('role', role);
      const item = document.createElement('button');
      item.setAttribute('role', role === 'menu' ? 'menuitem' : role === 'tree' ? 'treeitem' : 'gridcell');
      widget.appendChild(item);
      within(widget, () => {
        key('g', {}, item);
        key('s', {}, item);
      });
    }
    expect(navigate).not.toHaveBeenCalled();
  });

  it('leaves the keys and Ctrl+K alone while another dialog is open', async () => {
    await setup();
    // A Material dialog: aria-modal off, as by default.
    const dialog = document.createElement('div');
    dialog.className = 'cdk-dialog-container';
    within(dialog, () => {
      key('g');
      key('s');
      expect(navigate).not.toHaveBeenCalled();
      key('k', { ctrlKey: true });
      expect(service.isOpen()).toBeFalse();
    });
  });

  it('still takes the keys on a checkbox, not a text field', async () => {
    await setup();
    const box = document.createElement('input');
    box.type = 'checkbox';
    within(box, () => {
      key('g', {}, box);
      key('s', {}, box);
    });
    expect(navigate).toHaveBeenCalledWith('/services');
  });

  it('forgets the pages when the shell goes away, until the next menu comes', async () => {
    await setup();
    detach();
    expect(service.pages()).toEqual([]);
    let ready = false;
    service.whenReady().then(() => ready = true);
    await Promise.resolve();
    expect(ready).toBeFalse();
  });

  it('opens on Ctrl+K on any keyboard layout', async () => {
    await setup();
    key('л', { ctrlKey: true, code: 'KeyK' });
    expect(service.isOpen()).toBeTrue();
  });

  it('keeps the pages of the latest menu load, whichever finishes first', async () => {
    await setup();
    let release!: (t: string) => void;
    const slow = new Promise<string>(resolve => release = resolve);
    const tenants = TestBed.inject(TenantService) as unknown as { getTenantIdentifier: () => Promise<string> };
    tenants.getTenantIdentifier = () => slow;
    const older = service.setItems([new MenuItem({ id: 'old', label: 'Old', icon: 'x', routerLink: '/old' })]);
    tenants.getTenantIdentifier = async () => 'acme';
    await service.setItems([new MenuItem({ id: 'new', label: 'New', icon: 'x', routerLink: '/new' })]);
    release('acme');
    await older;
    expect(service.pages().map(p => p.id)).toEqual(['new']);
  });

  it('does nothing while no switcher is on screen', async () => {
    await setup(undefined, false);
    key('g');
    key('s');
    key('k', { ctrlKey: true });
    expect(navigate).not.toHaveBeenCalled();
    expect(service.isOpen()).toBeFalse();
  });

  it('stops when the switcher goes away, closed', async () => {
    await setup();
    service.open();
    detach();
    expect(service.isOpen()).toBeFalse();
    key('g');
    key('s');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does nothing when the app turns it off', async () => {
    await setup(new LayoutConfig({ brand: 'x', pageSwitcher: false }));
    key('k', { ctrlKey: true });
    expect(service.isOpen()).toBeFalse();
    expect(service.isEnabled).toBeFalse();
  });
});
