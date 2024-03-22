import { ModuleWithProviders, NgModule, Optional } from '@angular/core';
import { TranslateModule, MissingTranslationHandler } from '@ngx-translate/core';

import { LoginComponent } from './pages/login/login.component';
import { LoginCompletedComponent } from './pages/login-completed/login-completed.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { LogoutCompletedComponent } from './pages/logout-completed/logout-completed.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { UserInfoComponent } from './pages/protected/user-info/user-info.component';
import { AuthModuleConfig } from './auth/auth-module.config';

import { SubmitMissingTranslationHandler } from '@juice-js/localize';
import { AuthConfig } from 'angular-oauth2-oidc';
import { MatDialogModule } from '@angular/material/dialog';
import { TenantService } from '@juice-js/core';

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
    TranslateModule.forChild({
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: SubmitMissingTranslationHandler
      },
      defaultLanguage: 'en-US'
    }),
    MatDialogModule
  ],
  exports: [
  ]
})
export class AuthModule {
  public static forRoot(options : any): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [
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
              let identifier = '/' + tenantService.currentTenant?.identifier??'';
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
