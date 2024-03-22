
import { Observable } from 'rxjs';
import { TenantResolverService } from '../tenant-resolver.service';
import { TenantInfo } from '../tenant-info';

export class ConfigResolver extends TenantResolverService{
    override priority: number = 99;
    constructor(private config: TenantInfo[]){
        super();
    }

    getTenantByIdentifier(identifier: string): Observable<TenantInfo|null> {
        if(identifier===''){
            return new Observable(subscriber => {
                subscriber.next({identifier:''} as TenantInfo);
                subscriber.complete();
            });
        }
        const tenant = this.config.find(tenant => tenant.identifier === identifier);
        if(tenant){
            return new Observable(subscriber => {
                subscriber.next(tenant);
                subscriber.complete();
            });
        }
        return new Observable(subscriber => {
            subscriber.next(null);
            subscriber.complete();
        });
    }
}