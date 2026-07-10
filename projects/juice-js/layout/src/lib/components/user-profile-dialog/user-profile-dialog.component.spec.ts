import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProfileDialogComponent } from './user-profile-dialog.component';
import { OAuthModule } from 'angular-oauth2-oidc';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('UserProfileDialogComponent', () => {
  let component: UserProfileDialogComponent;
  let fixture: ComponentFixture<UserProfileDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    declarations: [UserProfileDialogComponent],
    imports: [OAuthModule.forRoot(),
        TranslateModule.forRoot()],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    fixture = TestBed.createComponent(UserProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
