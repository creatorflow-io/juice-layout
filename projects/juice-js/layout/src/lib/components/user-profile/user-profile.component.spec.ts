import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { OAuthModule } from 'angular-oauth2-oidc';
import { UserProfileComponent } from './user-profile.component';
import { IS_PRODUCTION } from '../../layout.config';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserProfileComponent],
      imports: [
        OAuthModule.forRoot(),
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: IS_PRODUCTION,
          useValue: true
        }
      ]
    });
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
