import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslatePipe } from '@ngx-translate/core';
import { MenuItem, MenuService, TenantService } from '@juice-js/core';
import { Subject } from 'rxjs';
import { NavMenuComponent } from './nav-menu.component';
import { LayoutService } from '../../layout.service';

/**
 * Zoneless (the Angular 22 default): nothing re-renders a component after an async callback unless it marks
 * itself for check. The menu arrives after the first render — it used to show only on the next mouse event.
 */
describe('NavMenuComponent (zoneless)', () => {
  let fixture: ComponentFixture<NavMenuComponent>;
  let menu: Subject<MenuItem[]>;

  beforeEach(() => {
    menu = new Subject<MenuItem[]>();
    TestBed.configureTestingModule({
      declarations: [NavMenuComponent],
      imports: [TranslatePipe],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideTranslateService(),
        { provide: MenuService, useValue: { getMenu: () => menu } },
        { provide: TenantService, useValue: { getTenantIdentifier: () => Promise.resolve('') } },
        { provide: LayoutService, useValue: { settingUrl: () => undefined, isMenuOpen: () => false } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(NavMenuComponent);
    fixture.autoDetectChanges();
  });

  it('renders menu items that arrive after the first render, without a DOM event', async () => {
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Dashboard');

    menu.next([new MenuItem({ id: 'd', label: 'Dashboard', routerLink: '/dashboard', icon: 'home', order: 1, children: [] })]);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Dashboard');
  });
});
