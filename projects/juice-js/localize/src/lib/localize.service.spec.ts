import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { LocalizeService } from './localize.service';
import { LocalizeConfig } from './localize.config';

describe('LocalizeService', () => {
  let service: LocalizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule
      ],
      providers: [
        {
          provide: LocalizeConfig,
          useValue: {
            cultureApi: 'http://localhost:3000/cultures',
            localizeApi: 'http://localhost:3000/localize',
            submitMissing: true
          }
        }
      ]
    });
    service = TestBed.inject(LocalizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
