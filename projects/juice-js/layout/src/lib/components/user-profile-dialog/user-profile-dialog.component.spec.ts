import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProfileDialogComponent } from './user-profile-dialog.component';
import { OAuthModule } from 'angular-oauth2-oidc';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

describe('UserProfileDialogComponent', () => {
  let component: UserProfileDialogComponent;
  let fixture: ComponentFixture<UserProfileDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserProfileDialogComponent],
      imports: [
        OAuthModule.forRoot(),
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ]
    });
    fixture = TestBed.createComponent(UserProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
