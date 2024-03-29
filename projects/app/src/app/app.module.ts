import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from './material.module';
import { LayoutModule, ProfileDialogService } from '@juice-js/layout';

import { environment } from '../environments/environment';
import { LocalizeModule, SubmitMissingTranslationHandler } from '@juice-js/localize';
import { MissingTranslationHandler, TranslateModule } from '@ngx-translate/core';
import { OAuthModule } from 'angular-oauth2-oidc';
import { AuthModule } from '@juice-js/auth';
import { TenantAuthModule } from '@juice-js/tenant';
import { TenantModule } from '@juice-js/core';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserProfileDialogService } from './user-profile/user-profile-dialog.service';

const { localize, auth, production, layout, tenants } = environment;

@NgModule({
  declarations: [
    AppComponent,
    UserProfileComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    MaterialModule,
    LayoutModule.forRoot(production, layout),
    TenantModule.forRoot(tenants),
    AuthModule.forRoot(auth),
    TenantAuthModule,
    AppRoutingModule, // must be last and comes after other modules
    OAuthModule.forRoot(),
    LocalizeModule.forRoot(localize),
    TranslateModule.forRoot({
      missingTranslationHandler:{
        provide: MissingTranslationHandler,
        useClass: SubmitMissingTranslationHandler
      }
    })
  ],
  providers: [
    {
      provide: ProfileDialogService,
      useClass: UserProfileDialogService
    },
    // {
    //   provide: AuthModuleConfig,
    //   useValue: auth
    // }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
