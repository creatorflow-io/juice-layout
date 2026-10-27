import {Injectable, Optional} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {OAuthService} from 'angular-oauth2-oidc';
import {from} from "rxjs";
import {map} from "rxjs/operators";
import { AuthModuleConfig } from './auth-module.config';
import { TenantService } from '@juice-js/core';
import { AuthTokenRefresher } from './auth-token-refresher';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {
  path: string;
  constructor(private router: Router, private oauthService: OAuthService,
    private options: AuthModuleConfig, @Optional() private tenantService: TenantService,
    private refresher: AuthTokenRefresher){
      this.path = new URL(this.options.basePath).pathname;
      if(tenantService){
        var identifier = '/' + tenantService.currentTenant?.identifier||'';
        this.path = this.path.replace('/:tenant', identifier);
      }
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.hasValidToken()) {
      return this.authorize(route);
    }

    return from(this.restoreSession()).pipe(
      map(() => {
        if (this.hasValidToken()) {
          return this.authorize(route);
        }

        return this.router.createUrlTree([`${this.path}/login`], {queryParams: {returnUrl: state.url}});
      })
    )
  }

  /** Completes an OIDC callback if this is one; otherwise renews an expired session with the refresh token. */
  private async restoreSession(): Promise<void> {
    await this.oauthService.loadDiscoveryDocumentAndTryLogin({disableNonceCheck: true});
    if (!this.hasValidToken() && this.refresher.canRefresh()) {
      await this.refresher.refresh();
    }
  }

  /** The tenant and role checks, for a session found valid or just restored. */
  private authorize(route: ActivatedRouteSnapshot): true | UrlTree {
    if(!this.hasValidTenant()){
      // Re-authenticating cannot fix a tenant mismatch: the IdP would hand back the
      // same issuer and the /login redirect would bounce straight back here.
      return this.router.createUrlTree([`${this.path}/unauthorized`], {queryParams: {reason: 'tenant-mismatch'}});
    }
    if(this.hasValidRole(route)){
      return true;
    }
    return this.router.createUrlTree([`${this.path}/unauthorized`], {queryParams: {reason: 'role-mismatch'}});
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

  private hasValidTenant(){
    if(!this.tenantService){
      return true;
    }
    const claims = this.oauthService.getIdentityClaims();
    var tenant = this.tenantService?.currentTenant?.identifier;
    var issuer = claims['iss'];
    return !tenant || this.getTenantFromIssuer(issuer) === tenant;
  }

  private getTenantFromIssuer(issuer: string){
    var match = issuer.match(/\/([^\/]+)\/?$/);
    return match?.[1];
  }
}
