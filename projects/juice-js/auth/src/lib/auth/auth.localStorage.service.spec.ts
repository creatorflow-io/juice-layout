import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { AuthLocalStorageService } from './auth.localStorage.service';

describe('AuthLocalStorageService', () => {
  let service: AuthLocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    });
    service = TestBed.inject(AuthLocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
