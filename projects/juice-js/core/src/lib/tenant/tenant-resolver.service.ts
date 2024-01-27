import { Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { TenantInfo } from './tenant-info';

export const TENANT_RESOLVER = new InjectionToken<TenantResolverService[]>('TENANT_RESOLVER');

@Injectable({
  providedIn: 'root'
})
export abstract class TenantResolverService {

  priority = 0;
  abstract getTenantByIdentifier(identifier: string): Observable<TenantInfo|null>;
}
