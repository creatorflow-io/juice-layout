import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { TenantService } from '@juice-js/core';

// This guard is used to check if the tenant is set and redirect to the tenant-mismatch page if not
@Injectable({
  providedIn: 'root'
})
export class TenantGuard  {
  constructor(private router: Router,private tenantService: TenantService) {
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    var tenant = await this.tenantService.getTenantIdentifier();
    if(tenant && this.tenantService.isMatched()){
      return true;
    }
    // check if the request is for the tenant-mismatch page
    if(this.router.url.endsWith('tenant-mismatch')){
      return true;
    }
    console.debug(`Tenant mismatch`, this.router.url);
    if(this.tenantService.requestTenantIdentifier){
      return this.router.createUrlTree([`/${this.tenantService.requestTenantIdentifier}/tenant-mismatch`]);
    }
    return this.router.createUrlTree([`/tenant-mismatch`]);
  }

}