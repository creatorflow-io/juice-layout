
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TenantResolverService } from '../tenant-resolver.service';
import { TenantModule } from '../tenant.module';
import { TenantInfo } from '../tenant-info';

@Injectable({
    providedIn: TenantModule
})
export class StorageResolver extends TenantResolverService{
    static CURRENT_TENANT = '_TENANT_';
    override priority: number = 100;
    constructor(){
        super();
    }

    getTenantByIdentifier(identifier: string): Observable<TenantInfo|null> {
        var currentTenant = localStorage.getItem(StorageResolver.CURRENT_TENANT);
        var tenantInfo = currentTenant ? JSON.parse(currentTenant) as TenantInfo : null;
        if(tenantInfo && tenantInfo.identifier === identifier){
            return new Observable(subscriber => {
                subscriber.next(tenantInfo);
                subscriber.complete();
            });
        }
        return new Observable(subscriber => {
            subscriber.next(null);
            subscriber.complete();
        });
    }

    saveTenant(tenant: TenantInfo){
        localStorage.setItem(StorageResolver.CURRENT_TENANT, JSON.stringify(tenant));
    }

    clearTenant(){
        localStorage.removeItem(StorageResolver.CURRENT_TENANT);
    }

    getCurrentTenant(): TenantInfo|null{
        var currentTenant = localStorage.getItem(StorageResolver.CURRENT_TENANT);
        return currentTenant ? JSON.parse(currentTenant) as TenantInfo : null;
    }
}