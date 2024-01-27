import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {OAuthService} from 'angular-oauth2-oidc';
import {from} from "rxjs";
import {map} from "rxjs/operators";
import { AuthModuleConfig } from './auth-module.config';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {
  path: string;
  constructor(private router: Router, private oauthService: OAuthService,
    private options: AuthModuleConfig) {
      this.path = new URL(this.options.basePath).pathname;
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.hasValidToken()) {
      if(this.hasValidRole(route)){
        return true;
      }
      return this.router.createUrlTree([`${this.path}/unauthorized`]);
    }

    return from(this.oauthService.loadDiscoveryDocumentAndTryLogin()).pipe(
      map(() => {
        if (this.hasValidToken()) {
          if(this.hasValidRole(route)){
            return true;
          }
          return this.router.createUrlTree([`${this.path}/unauthorized`]);
        }

        return this.router.createUrlTree([`${this.path}/login`], {queryParams: {returnUrl: state.url}});
      })
    )
  }

  private hasValidRole(route: ActivatedRouteSnapshot){
    const claims = this.oauthService.getIdentityClaims();
    var {roles} = route.data;
    var {role} = claims;
    
    if(roles 
      && ((typeof role =="string" && !roles.includes(role)) 
        || ( Array.isArray(role) && !role.some(r=> roles.includes(r))))){
      return false;
    }
    return true;
  }

  private hasValidToken() {
    return this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken();
  }
}