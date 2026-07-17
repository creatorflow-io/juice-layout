import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule} from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OAuthModule } from 'angular-oauth2-oidc';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslatePipe, TranslateDirective, provideTranslateService } from '@ngx-translate/core';
import { PageComponent } from './page.component';
import { SearchBarComponent } from '../components/search-bar/search-bar.component';
import { DarkModeComponent } from '../components/dark-mode/dark-mode.component';
import { UserProfileComponent } from '../components/user-profile/user-profile.component';
import { NavMenuComponent } from '../components/nav-menu/nav-menu.component';
import { IS_PRODUCTION } from '../layout.config';
import { SearchService } from '../services/search.service';
import { SearchablePage } from '../services/searchable-page';


describe('PageComponent', () => {
  let component: PageComponent;
  let fixture: ComponentFixture<PageComponent>;
  let search: SearchService;
  let page: jasmine.SpyObj<SearchablePage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    declarations: [
        SearchBarComponent,
        DarkModeComponent,
        UserProfileComponent,
        NavMenuComponent,
        PageComponent
    ],
    imports: [MatToolbarModule,
        MatSidenavModule,
        MatIconModule,
        MatListModule,
        MatTooltipModule,
        OAuthModule.forRoot(),
        TranslatePipe,
        TranslateDirective,
        BrowserAnimationsModule,
        RouterTestingModule],
    providers: [
        {
            provide: IS_PRODUCTION,
            useValue: true
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideTranslateService()
    ]
});
    fixture = TestBed.createComponent(PageComponent);
    component = fixture.componentInstance;
    search = TestBed.inject(SearchService);
    page = jasmine.createSpyObj<SearchablePage>('SearchablePage', ['onSearch']);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The shell binds the active page from its own outlet lifecycle rather than from
  // router events. That is what makes the box track the page (US1) and what keeps it
  // correct when a navigation is interrupted or a component is reused (US3).
  describe('outlet wiring', () => {
    it('binds a page that declares search support (FR-001, FR-002)', () => {
      component.onPageActivate(page);
      expect(search.isEnabled()).toBe(true);
    });

    it('binds nothing for a page that declares no support (FR-003)', () => {
      component.onPageActivate({ notSearchable: true });
      expect(search.isEnabled()).toBe(false);
    });

    it('unbinds when the page goes away', () => {
      component.onPageActivate(page);
      component.onPageDeactivate();
      expect(search.isEnabled()).toBe(false);
    });

    it('re-entering a page binds it again — the tenth visit equals the first (FR-006)', () => {
      component.onPageActivate(page);
      component.onPageDeactivate();
      component.onPageActivate(page);

      expect(search.isEnabled()).toBe(true);

      search.submit('abc');
      expect(page.onSearch).toHaveBeenCalledWith('abc', undefined);
    });

    it('keeps the binding while the outlet does not deactivate (FR-006, defect D3)', () => {
      // A param-only navigation (tenant switch /t1/dashboard -> /t2/dashboard) reuses the
      // component, so the outlet never deactivates and no constructor re-runs. Under the old
      // NavigationStart-based revocation this permanently lost the box for the session.
      component.onPageActivate(page);

      expect(search.isEnabled()).toBe(true);
      search.submit('abc');
      expect(page.onSearch).toHaveBeenCalledWith('abc', undefined);
    });
  });
});
