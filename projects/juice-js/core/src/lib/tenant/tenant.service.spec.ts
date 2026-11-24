import { TestBed } from '@angular/core/testing';

import { TenantService } from './tenant.service';
import { TENANT_RESOLVER, TenantResolverService } from './tenant-resolver.service';
import { ConfigResolver } from './resolvers/config-resolver.service';

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

describe('TenantService tenant Id', () => {
  it('gives the Id of the tenant in the URL when its resolver knows it, and none otherwise', async () => {
    const id = '0193f0aa-0000-7000-8000-0000000000a1';
    TestBed.configureTestingModule({
      providers: [{ provide: TENANT_RESOLVER, useValue: [new ConfigResolver([{ identifier: 'acme', id, name: 'Acme' }, { identifier: 'old', name: 'Old' }])] }],
    });
    const service = TestBed.inject(TenantService);
    window.history.pushState({}, '', '/acme/home');
    expect(await service.getTenantId()).toBe(id);
    expect(await service.getTenantIdentifier()).toBe('acme');
    window.history.pushState({}, '', '/old/home');
    expect(await service.getTenantId()).toBeUndefined();
    window.history.pushState({}, '', '/');
  });
});
