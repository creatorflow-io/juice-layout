import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
// Loaded for its String helpers (injectTenant, trimSlash); the namespace keeps the bundler from dropping it.
import * as stringExtensions from '../extensions/string.extensions';
import { MenuItem } from './menu-item';
import { loadChildren } from './menu-loader';

describe('MenuItem', () => {
  beforeAll(() => expect(stringExtensions).toBeDefined());
  it('is in the side menu unless told otherwise, with no shortcut', () => {
    const item = new MenuItem({ id: 'logs', label: 'Logs', icon: 'notes', routerLink: '/logs' });
    expect(item.inMenu).toBeTrue();
    expect(item.shortcut).toBeUndefined();
  });

  it('keeps inMenu and shortcut, its children too', () => {
    const item = new MenuItem({
      id: 'group', label: 'Group', icon: 'tune', routerLink: '', children: [
        { id: 'load-runs', label: 'Load runs', icon: 'speed', routerLink: '/load-runs', inMenu: false, shortcut: 'g r' },
      ],
    });
    expect(item.children[0].inMenu).toBeFalse();
    expect(item.children[0].shortcut).toBe('g r');
  });

  it('reads them from route data', () => {
    const item = MenuItem.fromRoute({ path: 'logs', data: { menuDisplay: true, menuInMenu: false, menuShortcut: 'g l' } });
    expect(item.inMenu).toBeFalse();
    expect(item.shortcut).toBe('g l');
  });

  it('a group without a link keeps none, a page without one is the home page', () => {
    const group = new MenuItem({ id: 'security', label: 'Security', icon: 'lock', routerLink: '', children: [
      { id: 'roles', label: 'Roles', icon: 'badge', routerLink: 'roles' },
    ] });
    group.injectTenant('acme');
    expect(group.routerLink).toBe('');
    expect(group.children[0].routerLink).toBe('/roles');

    const home = new MenuItem({ id: 'home', label: 'Home', icon: 'home', routerLink: '' });
    home.injectTenant(null);
    expect(home.routerLink).toBe('/');

    const tenantGroup = new MenuItem({ id: 't', label: 'T', icon: 'x', routerLink: ':tenant', children: [
      { id: 'a', label: 'A', icon: 'x', routerLink: 'a' },
    ] });
    tenantGroup.injectTenant('acme');
    expect(tenantGroup.routerLink).toBe('/acme');
  });

  it('a group that links home on purpose keeps the link', () => {
    const group = new MenuItem({ id: 'g', label: 'G', icon: 'x', routerLink: '/', children: [
      { id: 'a', label: 'A', icon: 'x', routerLink: 'a' },
    ] });
    group.injectTenant(null);
    expect(group.routerLink).toBe('/');
    expect(group.hasOwnPage()).toBeTrue();
  });

  it('knows the children the side menu shows, and whether it has a page of its own', () => {
    const children = [
      { id: 'a', label: 'A', icon: 'x', routerLink: '/a' },
      { id: 'b', label: 'B', icon: 'x', routerLink: '/b', inMenu: false },
    ];
    const first = new MenuItem({ id: 'g', label: 'G', icon: 'x', routerLink: '/a', children });
    expect(first.menuChildren().map(c => c.id)).toEqual(['a']);
    expect(first.hasOwnPage()).toBeFalse();
    expect(new MenuItem({ id: 'g', label: 'G', icon: 'x', routerLink: '', children }).hasOwnPage()).toBeFalse();
    expect(new MenuItem({ id: 'g', label: 'G', icon: 'x', routerLink: '/g', children }).hasOwnPage()).toBeTrue();
    expect(new MenuItem({ id: 'p', label: 'P', icon: 'x', routerLink: '' }).hasOwnPage()).toBeTrue();
  });

  it('a group without a link left with no pages for this user is no page, not the home page', () => {
    const group = new MenuItem({ id: 'security', label: 'Security', icon: 'lock', routerLink: '', children: [
      { id: 'roles', label: 'Roles', icon: 'badge', routerLink: 'roles' },
    ] });
    group.children = [];
    group.injectTenant(null);
    expect(group.routerLink).toBe('');
    expect(group.hasOwnPage()).toBeFalse();
  });

  it('a nested group kept out of the menu keeps its pages out when they take its place', async () => {
    const menu = new MenuItem({ id: 'admin', label: 'Admin', icon: 'tune', routerLink: 'admin', children: [
      { id: 'wrap', label: 'Wrap', icon: 'x', routerLink: '', inMenu: false, children: [
        { id: 'audit', label: 'Audit', icon: 'x', routerLink: 'audit' },
      ] },
      { id: 'users', label: 'Users', icon: 'x', routerLink: 'users' },
    ] });
    await loadChildren(menu, TestBed.inject(Injector), null);
    expect(menu.children.map(c => `${c.id}:${c.inMenu}`)).toEqual(['audit:false', 'users:true']);
  });
});
