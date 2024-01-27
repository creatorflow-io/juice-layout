import { ModuleWithProviders, NgModule } from '@angular/core';
import { TenantService } from './tenant.service';
import { TENANT_RESOLVER } from './tenant-resolver.service';
import { ConfigResolver } from './resolvers/config-resolver.service';
import { StorageResolver } from './resolvers/storage-resolver.service';
import { TenantInfo } from './tenant-info';

@NgModule({
})
export class TenantModule { 
  public static forRoot(tenants: TenantInfo[] = []): ModuleWithProviders<TenantModule>{
    return {
      ngModule: TenantModule,
      providers: [
        TenantService,
        {
          provide: TENANT_RESOLVER,
          useValue: new ConfigResolver(tenants),
          multi: true
        },
        {
          provide: TENANT_RESOLVER,
          useClass: StorageResolver,
          multi: true
        }
      ]
    }
  }
}
