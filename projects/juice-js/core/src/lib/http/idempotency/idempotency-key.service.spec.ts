import { TestBed } from '@angular/core/testing';
import { TenantService } from '../../tenant/tenant.service';
import { IDEMPOTENCY_USER_CONTEXT, IdempotencyKeyService } from './idempotency-key.service';

describe('IdempotencyKeyService', () => {
  function configure(tenant?: unknown, userContext?: () => string | null): IdempotencyKeyService {
    TestBed.configureTestingModule({
      providers: [
        IdempotencyKeyService,
        { provide: TenantService, useValue: tenant ?? { currentTenant: null, requestTenantIdentifier: null } },
        ...(userContext ? [{ provide: IDEMPOTENCY_USER_CONTEXT, useValue: userContext }] : []),
      ],
    });
    return TestBed.inject(IdempotencyKeyService);
  }

  it('generates distinct keys for distinct operations', () => {
    const svc = configure();
    expect(svc.getKey('op-a')).not.toBe(svc.getKey('op-b'));
  });

  it('reuses the same key for the same operation', () => {
    const svc = configure();
    expect(svc.getKey('op-a')).toBe(svc.getKey('op-a'));
  });

  it('generates a new key after release', () => {
    const svc = configure();
    const first = svc.getKey('op-a');
    svc.release('op-a');
    expect(svc.getKey('op-a')).not.toBe(first);
  });

  it('regenerates the key when the tenant changes', () => {
    const tenant = { currentTenant: { identifier: 'a' }, requestTenantIdentifier: null };
    const svc = configure(tenant);
    const k1 = svc.getKey('op-a');
    tenant.currentTenant = { identifier: 'b' };
    expect(svc.getKey('op-a')).not.toBe(k1);
  });

  it('regenerates the key when the user context changes', () => {
    let user: string | null = 'u1';
    const svc = configure(undefined, () => user);
    const k1 = svc.getKey('op-a');
    user = 'u2';
    expect(svc.getKey('op-a')).not.toBe(k1);
  });

  it('reports expiry once the key exceeds its max age', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2020, 0, 1));
    try {
      const svc = configure();
      svc.getKey('op-a');
      jasmine.clock().tick(2000);
      expect(svc.isExpired('op-a', 1000)).toBeTrue();
      expect(svc.isExpired('op-a', null)).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('guards concurrent in-flight dispatch of the same operation', () => {
    const svc = configure();
    expect(svc.tryBeginInFlight('op-a')).toBeTrue();
    expect(svc.tryBeginInFlight('op-a')).toBeFalse();
    svc.endInFlight('op-a');
    expect(svc.tryBeginInFlight('op-a')).toBeTrue();
  });
});
