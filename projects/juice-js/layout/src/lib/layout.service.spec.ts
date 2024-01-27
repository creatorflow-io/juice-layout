import { TestBed } from '@angular/core/testing';

import { LayoutService } from './layout.service';
import { LayoutConfig } from './layout.config';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers:[
        {
          provide: LayoutConfig,
          useValue: {
            layoutApi: 'http://localhost:3000/layout',
            submitMissing: true
          }
        }
      ]
    });
    service = TestBed.inject(LayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
