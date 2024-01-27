import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { TenantService } from '@juice-js/core';

@Injectable({
  providedIn: 'root'
})
export class TenantGuard  {
  constructor(private router: Router,private tenantService: TenantService) {
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    var tenant = await this.tenantService.getTenantIdentifier();
    if(tenant){
      return true;
    }
    return this.router.createUrlTree([`/tenant-mismatch`]);
  }

}