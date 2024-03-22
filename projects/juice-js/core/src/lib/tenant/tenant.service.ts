import { Inject, Injectable, Optional, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { TENANT_RESOLVER, TenantResolverService } from './tenant-resolver.service';
import { TenantInfo } from './tenant-info';
import { StorageResolver } from './resolvers/storage-resolver.service';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  currentTenant: TenantInfo|null = null;
  requestTenantIdentifier: string|null = null;
  resolvers: TenantResolverService[] = [];
  storageResolver: StorageResolver|undefined;
  constructor(
    @Optional() storageResolver: StorageResolver
  ) { 
    this.resolvers = inject(TENANT_RESOLVER, {optional: true}) ?? [];
    this.storageResolver = storageResolver;
    this.currentTenant = this.storageResolver?.getCurrentTenant();
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
        // console.debug(`Resolving tenant ${identifier} by ${resolver.constructor.name}`);
        var tenant = await firstValueFrom(resolver.getTenantByIdentifier(identifier));
        if(tenant){
          tenant.resolvedBy = resolver.constructor.name;
          console.debug(`Tenant ${tenant.identifier} resolved by ${tenant.resolvedBy}`);
          if(!(resolver instanceof StorageResolver) || tenant.identifier != this.currentTenant?.identifier){
            this.storageResolver?.saveTenant(tenant);
            this.currentTenant = tenant;
          }
          return tenant;
        }
      }
      return null;
  }

  async getTenantInfo(): Promise<TenantInfo|null>{
     // :tenant/:module/:component
     var tenant = window.location.pathname.split('/')[1];
     this.requestTenantIdentifier = tenant;
     return (await this.getTenantByIdentifier(tenant))
      ?? this.storedTenant()
      ?? null
     ;
  }

  storedTenant(): TenantInfo|null|undefined{
    return this.storageResolver?.getCurrentTenant();
  }

  isMatched(): boolean{
    return this.currentTenant?.identifier == this.requestTenantIdentifier;
  }
}
