import { Inject, Injectable, Optional, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { TENANT_RESOLVER, TenantResolverService } from './tenant-resolver.service';
import { TenantInfo } from './tenant-info';
import { StorageResolver } from './resolvers/storage-resolver.service';

@Injectable({
  providedIn: 'root'
})
export class TenantService {

  resolvers: TenantResolverService[] = [];
  storageResolver: StorageResolver|undefined;
  constructor(
    @Optional() storageResolver: StorageResolver
  ) { 
    this.resolvers = inject(TENANT_RESOLVER, {optional: true}) ?? [];
    this.storageResolver = storageResolver;
  }

  async getTenantIdentifier(){
    return (await this.getTenantInfo())?.identifier
    ;
  }

  private async getTenantByIdentifier(identifier: string): Promise<TenantInfo|null>{
      if(!this.resolvers){
        return null;
      }
      for(const resolver of this.resolvers.sort((a,b) => b.priority - a.priority)){
        var tenant = await firstValueFrom(resolver.getTenantByIdentifier(identifier));
        if(tenant){
          tenant.resolvedBy = resolver.constructor.name;
          console.debug(`Tenant ${tenant.identifier} resolved by ${tenant.resolvedBy}`);
          if(!(resolver instanceof StorageResolver)){
            this.storageResolver?.saveTenant(tenant);
          }
          return tenant;
        }
      }
      return null;
  }

  async getTenantInfo(): Promise<TenantInfo|null>{
     // :tenant/:module/:component
     var tenant = window.location.pathname.split('/')[1];
     return (await this.getTenantByIdentifier(tenant))
      ?? this.storageResolver?.getCurrentTenant()??null
     ;
  }
}
