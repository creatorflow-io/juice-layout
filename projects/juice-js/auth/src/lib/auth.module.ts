import { ModuleWithProviders, NgModule } from '@angular/core';
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
    })
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
          useValue: options
        }
      ]
    }
  }
}
