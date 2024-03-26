import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule} from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OAuthModule } from 'angular-oauth2-oidc';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { PageComponent } from './page.component';
import { SearchBarComponent } from '../components/search-bar/search-bar.component';
import { DarkModeComponent } from '../components/dark-mode/dark-mode.component';
import { UserProfileComponent } from '../components/user-profile/user-profile.component';
import { NavMenuComponent } from '../components/nav-menu/nav-menu.component';
import { IS_PRODUCTION } from '../layout.config';


describe('PageComponent', () => {
  let component: PageComponent;
  let fixture: ComponentFixture<PageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        SearchBarComponent,
        DarkModeComponent,
        UserProfileComponent,
        NavMenuComponent,
        PageComponent
      ],
      imports: [
        MatToolbarModule,
        MatSidenavModule,
        MatIconModule,
        MatListModule,
        MatTooltipModule,
        OAuthModule.forRoot(),
        TranslateModule.forRoot(),
        HttpClientModule,
        BrowserAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: IS_PRODUCTION,
          useValue: true
        }
      ]
    });
    fixture = TestBed.createComponent(PageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
