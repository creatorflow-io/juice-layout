import { TestBed } from '@angular/core/testing';

import { TenantService } from './tenant.service';
import { TenantResolverService } from './tenant-resolver.service';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});


describe('TenantResolverService', () => {
  let service: TenantResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
