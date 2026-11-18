import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router, RouterLink, RouterModule, provideRouter } from '@angular/router';

import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ExpandableMenuComponent } from './expandable-menu.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MenuItem } from '@juice-js/core';

@Component({ template: '', standalone: true })
class BlankPage {}

/** A group the way an app builds one, its pages' links kept as they are. */
function group(routerLink: string, children: { id: string, routerLink: string, inMenu?: boolean }[]): MenuItem {
  return new MenuItem({
    id: 'configure', label: 'Configure', icon: 'tune', routerLink, replaceChildRouterLink: false,
    children: children.map(c => ({ ...c, label: c.id, icon: 'rule' })),
  });
}

describe('ExpandableMenuComponent', () => {
  let component: ExpandableMenuComponent;
  let fixture: ComponentFixture<ExpandableMenuComponent>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExpandableMenuComponent],
      imports: [MatExpansionModule, MatListModule, MatIconModule, NoopAnimationsModule, RouterModule],
      providers: [provideRouter([
        { path: '', component: BlankPage },
        { path: 'settings', component: BlankPage },
        { path: 'settings/users', component: BlankPage },
        { path: 'settings/edit/:id', component: BlankPage },
        { path: 'rules', component: BlankPage },
        { path: 'rules/:id', component: BlankPage },
        { path: 'silences', component: BlankPage },
        { path: 'load-runs', component: BlankPage },
        { path: 'logs', component: BlankPage },
      ])],
    });
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ExpandableMenuComponent);
    component = fixture.componentInstance;
  });

  const children = [{ id: 'rules', routerLink: '/rules' }, { id: 'silences', routerLink: '/silences' }];

  /** The header's link, as its RouterLink makes it (null: none). */
  function headerLink(): string | null {
    fixture.detectChanges();
    const header = fixture.debugElement.query(By.css('mat-expansion-panel-header .mat-mdc-list-item'));
    const tree = header.injector.get(RouterLink).urlTree;
    return tree ? router.serializeUrl(tree) : null;
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('opens while any of its pages is on display, not only its own link', async () => {
    component.item = group('/rules', children);
    await router.navigateByUrl('/silences?environment=prod');
    expect(component.open).toBeTrue();
    await router.navigateByUrl('/rules/42');
    expect(component.open).toBeTrue();
    await router.navigateByUrl('/logs');
    expect(component.open).toBeFalse();
  });

  it('also opens on a page of it kept out of the menu', async () => {
    component.item = group('', [...children, { id: 'load-runs', routerLink: '/load-runs', inMenu: false }]);
    await router.navigateByUrl('/load-runs');
    expect(component.open).toBeTrue();
  });

  it('a header linking to its first page only opens and closes, and the page is highlighted, not the header', async () => {
    component.item = group('/rules', children);
    await router.navigateByUrl('/rules');
    expect(component.headerActive).toBeFalse();
    expect(headerLink()).toBeNull();
  });

  it('highlights and links a header that has a page of its own', async () => {
    component.item = group('/settings', children);
    await router.navigateByUrl('/settings');
    expect(component.headerActive).toBeTrue();
    expect(component.open).toBeTrue();
    expect(headerLink()).toBe('/settings');
  });

  it('a group without a link only opens and closes: never active by itself', async () => {
    component.item = group('', children);
    await router.navigateByUrl('/logs');
    expect(component.open).toBeFalse();
    expect(component.headerActive).toBeFalse();
    expect(headerLink()).toBeNull();
  });

  it('a link other pages of the group sit under (home) matches only itself', async () => {
    component.item = group('', [{ id: 'home', routerLink: '/' }, ...children]);
    await router.navigateByUrl('/logs');
    expect(component.open).toBeFalse();
    await router.navigateByUrl('/');
    expect(component.open).toBeTrue();
  });

  it('opens again on arriving at one of its pages after being closed by hand', async () => {
    component.item = group('', children);
    await router.navigateByUrl('/rules');
    fixture.detectChanges();
    const panel = fixture.debugElement.query(By.directive(MatExpansionPanel)).injector.get(MatExpansionPanel);
    panel.close();
    await router.navigateByUrl('/silences');
    expect(panel.expanded).toBeTrue();
  });

  it('stays as the user left it when only the query string changes', async () => {
    component.item = group('', children);
    await router.navigateByUrl('/rules');
    fixture.detectChanges();
    const panel = fixture.debugElement.query(By.directive(MatExpansionPanel)).injector.get(MatExpansionPanel);
    panel.close();
    await router.navigateByUrl('/rules?environment=prod');
    expect(panel.expanded).toBeFalse();
  });

  it('opens on pages under its own page that are not in the menu, unless that page is home', async () => {
    component.item = group('/settings', [{ id: 'users', routerLink: '/settings/users' }]);
    await router.navigateByUrl('/settings/edit/3');
    expect(component.open).toBeTrue();
    expect(component.headerActive).toBeFalse();
    component.item = group('/', children);
    await router.navigateByUrl('/logs');
    expect(component.open).toBeFalse();
  });

  it('leaves out the pages marked inMenu: false', () => {
    component.item = group('/rules', [...children, { id: 'hidden', routerLink: '/hidden', inMenu: false }]);
    expect(component.children.map(c => c.id)).toEqual(['rules', 'silences']);
  });
});
