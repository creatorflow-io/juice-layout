import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

import { LocalizeService } from './localize.service';
import { LocalizeConfig } from './localize.config';

describe('LocalizeService', () => {
  let service: LocalizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        {
            provide: LocalizeConfig,
            useValue: {
                cultureApi: 'http://localhost:3000/cultures',
                localizeApi: 'http://localhost:3000/localize',
                submitMissing: true
            }
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi())
    ]
});
    service = TestBed.inject(LocalizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
