import { EnvironmentProviders, ModuleWithProviders, NgModule, Provider, inject, provideEnvironmentInitializer } from '@angular/core';
import { TranslatePipe, TranslateDirective, MissingTranslationHandler, provideChildTranslateService } from '@ngx-translate/core';

import { LoginComponent } from './pages/login/login.component';
import { LoginCompletedComponent } from './pages/login-completed/login-completed.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { LogoutCompletedComponent } from './pages/logout-completed/logout-completed.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { UserInfoComponent } from './pages/protected/user-info/user-info.component';
import { AuthModuleConfig } from './auth/auth-module.config';
import { AuthInterceptor } from './auth/auth.interceptor'

import { SubmitMissingTranslationHandler } from '@juice-js/localize';
import { AuthConfig, OAuthInfoEvent, OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs/operators';
import { AuthTokenRefresher } from './auth/auth-token-refresher';
import { MatDialogModule } from '@angular/material/dialog';
import { TenantService } from '@juice-js/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  declarations: [
    LoginComponent,
    LoginCompletedComponent,
    LogoutComponent,
    LogoutCompletedComponent,
    UnauthorizedComponent,
    UserInfoComponent
  ],
  imports: [
    TranslatePipe,
    TranslateDirective,
    MatDialogModule
  ],
  exports: [
  ],
  providers: [
    provideChildTranslateService({
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: SubmitMissingTranslationHandler
      }
    })
  ]
})
export class AuthModule {
  public static forRoot(options : any): ModuleWithProviders<AuthModule> {
    const extra: (Provider | EnvironmentProviders)[] = options?.automaticRefresh
      ? [provideEnvironmentInitializer(renewBeforeExpiry)]
      : [];
    return {
      ngModule: AuthModule,
      providers: [
        ...extra,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        {
          provide: AuthModuleConfig,
          useValue: options
        },
        {
          provide: AuthConfig,
          useFactory: (tenantService: TenantService) : AuthConfig => {
            // Create config from options
            var authConfig = new AuthConfig(options);
            // Replace :tenant with the current tenant
            if(tenantService){
              let identifier = '/' + tenantService.currentTenant?.identifier||'';
              authConfig.issuer = options.issuer?.replace('/:tenant', identifier);
              authConfig.redirectUri = options.redirectUri?.replace('/:tenant', identifier);
              authConfig.postLogoutRedirectUri = options.postLogoutRedirectUri?.replace('/:tenant', identifier);
            }
            return authConfig;
          },
          deps: [TenantService]
        }
      ]
    }
  }
}

/**
 * `AuthModuleConfig.automaticRefresh`: OAuthService fires `token_expires` at its timeoutFactor (75% of the lifetime
 * by default); renew the access token then, through the shared AuthTokenRefresher.
 */
function renewBeforeExpiry(): void {
  const oauthService = inject(OAuthService);
  const refresher = inject(AuthTokenRefresher);
  oauthService.events
    .pipe(filter((e): e is OAuthInfoEvent => e.type === 'token_expires' && (e as OAuthInfoEvent).info === 'access_token'))
    .subscribe(() => void refresher.refresh());
}
